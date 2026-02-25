'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CalendarClock, Ban, ShieldCheck } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, CreditCard } from '@/lib/types'
import { differenceInDays, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

// Alert configuration
const LOW_BALANCE_THRESHOLD = 5000;
const CREDIT_LIMIT_UTILIZATION_THRESHOLD = 80; // in percent
const DUE_DATE_WARNING_DAYS = 5;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function SmartAlerts() {
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null,
    [firestore, user]
  )
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
    [firestore, user]
  )
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)

  const isLoading = loadingBankAccounts || loadingCreditCards

  const alerts = useMemo(() => {
    const generatedAlerts = [];
    const now = new Date();

    // Low balance alerts
    if (bankAccounts) {
        for (const account of bankAccounts) {
            if (!account.isSavingsAccount && account.currentBalance < LOW_BALANCE_THRESHOLD) {
                generatedAlerts.push({
                    id: `low-balance-${account.id}`,
                    icon: Ban,
                    iconColor: 'text-blue-500',
                    bgColor: 'bg-blue-50',
                    title: 'Low Balance',
                    description: `Your ${account.name} account balance is ${formatCurrency(account.currentBalance)}.`,
                });
            }
        }
    }
    
    // Credit card alerts
    if (creditCards) {
        for (const card of creditCards) {
            // High utilization alert
            const utilization = (card.creditLimit > 0) ? (card.currentBalance / card.creditLimit) * 100 : 0;
            if (utilization >= CREDIT_LIMIT_UTILIZATION_THRESHOLD) {
                 generatedAlerts.push({
                    id: `limit-${card.id}`,
                    icon: AlertCircle,
                    iconColor: 'text-red-500',
                    bgColor: 'bg-red-50',
                    title: 'Credit Card Limit',
                    description: `Your ${card.name} card is nearing its limit (${utilization.toFixed(0)}% used).`,
                });
            }

            // Upcoming due date alert
            try {
                const dueDate = parseISO(card.statementDueDate);
                const daysUntilDue = differenceInDays(dueDate, now);

                if (daysUntilDue >= 0 && daysUntilDue <= DUE_DATE_WARNING_DAYS) {
                    generatedAlerts.push({
                        id: `due-date-${card.id}`,
                        icon: CalendarClock,
                        iconColor: 'text-yellow-500',
                        bgColor: 'bg-yellow-50',
                        title: 'Upcoming Due Date',
                        description: `${card.name} bill is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`,
                    });
                }
            } catch (e) {
                // Ignore invalid date formats
            }
        }
    }

    return generatedAlerts;
  }, [bankAccounts, creditCards])


  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <Skeleton className="flex h-10 w-10 shrink-0 rounded-full" />
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-24" />
                           <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                ))}
            </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => {
            const Icon = alert.icon
            return (
              <div key={alert.id} className="flex items-start gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${alert.bgColor}`}>
                  <Icon className={`h-5 w-5 ${alert.iconColor}`} />
                </div>
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
            )
          })
        ) : (
            <div className="flex items-center text-center flex-col gap-4 py-4">
                 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                </div>
                <div>
                    <p className="font-semibold">All Clear!</p>
                    <p className="text-sm text-muted-foreground">You have no pending alerts.</p>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
