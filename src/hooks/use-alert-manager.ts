'use client'

import { useEffect } from 'react'
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase'
import {
  collection,
  query,
  where,
  writeBatch,
  doc,
  Timestamp,
} from 'firebase/firestore'
import type { CreditCard, Alert, BankAccount, Transaction, Loan, PersonalDebt } from '@/lib/types'
import { differenceInDays, parseISO } from 'date-fns'

// --- Alerting Thresholds ---
const CRITICAL_UTILIZATION = 80 // %
const WARNING_UTILIZATION = 60 // %
const LOW_BALANCE_THRESHOLD = 5000 // currency units
const CRITICAL_LOW_BALANCE_FACTOR = 0.5 // e.g., 50% of threshold
const DUE_DATE_WARNING_DAYS = 3 // days
const PERSONAL_DEBT_DUE_DATE_WARNING_DAYS = 5 // days
const WARNING_SPENDING_RATIO = 0.8 // 80%
const CRITICAL_SPENDING_RATIO = 1.0 // 100%

export function useAlertManager() {
  const { user } = useUser()
  const firestore = useFirestore()
  
  // This is recalculated on every render, ensuring it's always for the current month
  const startOfMonthISO = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  // --- Data Fetching ---
  const creditCardsQuery = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'creditCards') : null), [firestore, user?.uid])
  const { data: creditCards } = useCollection<CreditCard>(creditCardsQuery)

  const bankAccountsQuery = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null), [firestore, user?.uid])
  const { data: bankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
  
  const loansQuery = useMemoFirebase(() => (user ? collection(firestore, 'users', user.uid, 'loans') : null), [firestore, user?.uid])
  const { data: loans } = useCollection<Loan>(loansQuery)
  
  const personalDebtsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'personalDebts'), where('status', '==', 'active')) : null, [firestore, user?.uid])
  const { data: personalDebts } = useCollection<PersonalDebt>(personalDebtsQuery)

  const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonthISO)) : null, [firestore, user?.uid, startOfMonthISO])
  const { data: transactions } = useCollection<Transaction>(transactionsQuery)

  const alertsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'alerts'), where('resolved', '==', false), where('type', 'in', ['credit_utilization', 'credit_due', 'low_balance', 'overspending', 'loan_due', 'personal_debt_due'])) : null, [firestore, user?.uid])
  const { data: activeAlerts } = useCollection<Alert>(alertsQuery)

  useEffect(() => {
    if (!user || !firestore || !creditCards || !bankAccounts || !loans || !transactions || !activeAlerts || !personalDebts) {
      return
    }

    const processAlerts = async () => {
      const batch = writeBatch(firestore)
      const now = new Date()

      const createAlert = (alertData: Omit<Alert, 'id' | 'createdAt'>) => {
        const newAlertRef = doc(collection(firestore, 'users', user.uid, 'alerts'))
        batch.set(newAlertRef, { ...alertData, createdAt: now.toISOString() })
      }

      const activeAlertsMap = new Map(activeAlerts.map((a) => [a.type + '-' + (a.accountId || 'global'), a]))

      // 1. Credit Utilization Alerts
      for (const card of creditCards) {
        if (card.creditLimit <= 0) continue
        const utilization = (card.currentBalance / card.creditLimit) * 100
        const existingAlert = activeAlertsMap.get(`credit_utilization-${card.id}`)

        if (utilization >= CRITICAL_UTILIZATION) {
          if (existingAlert?.severity !== 'critical') {
            if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true });
            createAlert({ userId: user.uid, type: 'credit_utilization', accountId: card.id, title: 'Critical Credit Utilization', message: `Your ${card.name} card is at ${utilization.toFixed(0)}% utilization.`, severity: 'critical', isRead: false, resolved: false, actionLink: '/dashboard/accounts' });
          }
        } else if (utilization >= WARNING_UTILIZATION) {
          if (!existingAlert) {
            createAlert({ userId: user.uid, type: 'credit_utilization', accountId: card.id, title: 'High Credit Utilization', message: `Your ${card.name} card is at ${utilization.toFixed(0)}% utilization.`, severity: 'warning', isRead: false, resolved: false, actionLink: '/dashboard/accounts' });
          }
        } else {
          if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true });
        }
      }

      // 2. Upcoming Due Date Alerts (Credit Cards)
      for (const card of creditCards) {
          if (card.currentBalance <= 0) continue
          try {
              const dueDate = parseISO(card.statementDueDate)
              const daysUntilDue = differenceInDays(dueDate, now)
              const existingAlert = activeAlertsMap.get(`credit_due-${card.id}`)
              
              if (daysUntilDue >= 0 && daysUntilDue <= DUE_DATE_WARNING_DAYS) {
                  if (!existingAlert) {
                      createAlert({ userId: user.uid, type: 'credit_due', accountId: card.id, title: 'Credit Card Due Soon', message: `${card.name} bill of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(card.currentBalance)} is due in ${daysUntilDue} day(s).`, severity: daysUntilDue <= 1 ? 'critical' : 'warning', isRead: false, resolved: false, actionLink: '/dashboard/accounts' })
                  }
              } else {
                  if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true })
              }
          } catch(e) {/* ignore invalid dates */}
      }
      
      // 3. Upcoming Due Date Alerts (Loans)
      for (const loan of loans) {
          if (!loan.active || loan.outstanding <= 0) continue
          try {
              const dueDate = parseISO(loan.nextDueDate)
              const daysUntilDue = differenceInDays(dueDate, now)
              const existingAlert = activeAlertsMap.get(`loan_due-${loan.id}`)
              
              if (daysUntilDue >= 0 && daysUntilDue <= DUE_DATE_WARNING_DAYS) {
                  if (!existingAlert) {
                      createAlert({ userId: user.uid, type: 'loan_due', accountId: loan.id, title: 'Loan EMI Due Soon', message: `${loan.name} EMI of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(loan.emiAmount)} is due in ${daysUntilDue} day(s).`, severity: daysUntilDue <= 1 ? 'critical' : 'warning', isRead: false, resolved: false, actionLink: '/dashboard/accounts' })
                  }
              } else {
                  if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true })
              }
          } catch(e) {/* ignore invalid dates */}
      }

      // 4. Low Balance Alerts
      for (const account of bankAccounts) {
        if (account.isSavingsAccount) continue
        const existingAlert = activeAlertsMap.get(`low_balance-${account.id}`)

        if (account.currentBalance < LOW_BALANCE_THRESHOLD) {
            const severity = account.currentBalance < LOW_BALANCE_THRESHOLD * CRITICAL_LOW_BALANCE_FACTOR ? 'critical' : 'warning'
            if (existingAlert?.severity !== severity) {
                if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true });
                createAlert({ userId: user.uid, type: 'low_balance', accountId: account.id, title: 'Low Balance Alert', message: `Your ${account.name} balance is ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(account.currentBalance)}.`, severity, isRead: false, resolved: false, actionLink: '/dashboard/accounts' })
            }
        } else {
            if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true })
        }
      }

      // 5. Overspending Alert
      const monthlyIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const monthlyExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      const existingOverspendingAlert = activeAlertsMap.get('overspending-global')
      
      if (monthlyIncome > 0) {
          const spendingRatio = monthlyExpense / monthlyIncome;
          if (spendingRatio >= CRITICAL_SPENDING_RATIO) {
              if (existingOverspendingAlert?.severity !== 'critical') {
                  if (existingOverspendingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingOverspendingAlert.id), { resolved: true });
                  createAlert({ userId: user.uid, type: 'overspending', title: 'Overspending Alert', message: `You've spent ${Math.round(spendingRatio*100)}% of your monthly income.`, severity: 'critical', isRead: false, resolved: false, actionLink: '/dashboard/transactions' });
              }
          } else if (spendingRatio >= WARNING_SPENDING_RATIO) {
              if (!existingOverspendingAlert) {
                   createAlert({ userId: user.uid, type: 'overspending', title: 'High Spending Alert', message: `You've spent ${Math.round(spendingRatio*100)}% of your monthly income.`, severity: 'warning', isRead: false, resolved: false, actionLink: '/dashboard/transactions' });
              }
          } else {
              if (existingOverspendingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingOverspendingAlert.id), { resolved: true });
          }
      }

      // 6. Personal Debt Due Date Alerts
      for (const debt of personalDebts) {
        if (!debt.dueDate) continue;
        try {
          const dueDate = parseISO(debt.dueDate);
          const daysUntilDue = differenceInDays(dueDate, now);
          const existingAlert = activeAlertsMap.get(`personal_debt_due-${debt.id}`);

          if (daysUntilDue >= 0 && daysUntilDue <= PERSONAL_DEBT_DUE_DATE_WARNING_DAYS) {
            if (!existingAlert) {
              const message = debt.type === 'lent'
                ? `A repayment of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(debt.remainingAmount)} from ${debt.personName} is due in ${daysUntilDue} day(s).`
                : `Your debt of ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(debt.remainingAmount)} to ${debt.personName} is due in ${daysUntilDue} day(s).`;
              createAlert({ userId: user.uid, type: 'personal_debt_due', accountId: debt.id, title: 'Personal Debt Due Soon', message, severity: daysUntilDue <= 1 ? 'critical' : 'warning', isRead: false, resolved: false, actionLink: '/dashboard/accounts' });
            }
          } else {
            if (existingAlert) batch.update(doc(firestore, 'users', user.uid, 'alerts', existingAlert.id), { resolved: true });
          }
        } catch(e) {}
      }

      try {
        await batch.commit()
      } catch (error) {
        console.warn('Could not commit alert batch:', error)
      }
    }

    processAlerts()
  }, [creditCards, bankAccounts, loans, personalDebts, transactions, activeAlerts, user, firestore])
}
