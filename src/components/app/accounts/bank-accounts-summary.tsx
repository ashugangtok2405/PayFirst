'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Wallet } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { BankAccount, Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { startOfMonth } from 'date-fns'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function BankAccountsSummary() {
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
  
  const startOfCurrentMonth = useMemo(() => startOfMonth(new Date()), [])
  const transactionsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'transactions'),
            where('transactionDate', '>=', startOfCurrentMonth.toISOString())
          )
        : null,
    [firestore, user?.uid, startOfCurrentMonth]
  )
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const { totalBalance, totalInflow, totalOutflow } = useMemo(() => {
    if (!bankAccounts || !transactions) return { totalBalance: 0, totalInflow: 0, totalOutflow: 0 };
    
    const totalBalance = bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0);

    const accountIds = new Set(bankAccounts.map(a => a.id));

    const totalInflow = transactions.filter(t => {
        const toBank = t.toBankAccountId && accountIds.has(t.toBankAccountId);
        return (t.type === 'income' && toBank) ||
               (t.type === 'transfer' && toBank) ||
               (t.type === 'debt_borrowed' && toBank) ||
               (t.type === 'debt_repayment_in' && toBank);
    }).reduce((sum, t) => sum + t.amount, 0);
    
    const totalOutflow = transactions.filter(t => {
        const fromBank = t.fromBankAccountId && accountIds.has(t.fromBankAccountId);
        return (t.type === 'expense' && fromBank) ||
               (t.type === 'transfer' && fromBank) ||
               (t.type === 'credit_card_payment' && fromBank) ||
               (t.type === 'loan_payment' && fromBank) ||
               (t.type === 'debt_lent' && fromBank) ||
               (t.type === 'debt_repayment_out' && fromBank) ||
               (t.type === 'investment' && fromBank);
    }).reduce((sum, t) => sum + t.amount, 0);

    return { totalBalance, totalInflow, totalOutflow };
  }, [bankAccounts, transactions]);


  const summaryData = [
    { title: 'Total Inflow (Month)', value: totalInflow, icon: ArrowUp, className: 'text-green-600' },
    { title: 'Total Outflow (Month)', value: totalOutflow, icon: ArrowDown, className: 'text-red-600' },
    { title: 'Total Balance', value: totalBalance, icon: Wallet, className: 'text-blue-600' },
  ]
  
  const isLoading = loadingBankAccounts || loadingTransactions

  if (isLoading) {
      return (
          <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-5 rounded-full" />
                      </CardHeader>
                      <CardContent>
                          <Skeleton className="h-8 w-36 mt-2" />
                          <Skeleton className="h-3 w-28 mt-2" />
                      </CardContent>
                  </Card>
              ))}
          </div>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {summaryData.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(item.value)}</div>
                <p className="text-xs text-muted-foreground">
                    {item.title === 'Total Balance' ? 'Across all bank accounts' : 'Current month activity'}
                </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
