'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Zap, ArrowRight, ShieldCheck, CalendarClock } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { BankAccount, CreditCard, Transaction } from '@/lib/types'
import { differenceInDays, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

type Alert = {
    id: string;
    type: "credit" | "balance" | "category" | "savings" | "due";
    severity: "info" | "warning" | "critical";
    message: string;
    actionLink?: string;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}


export function SmartAlertsDashboard() {
    const firestore = useFirestore()
    const { user } = useUser()
    const [showAll, setShowAll] = useState(false)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Data fetching
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
    
    const transactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null,
        [firestore, user]
    );
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const isLoading = loadingBankAccounts || loadingCreditCards || loadingTransactions;

    // Alert generation logic
    const alerts: Alert[] = useMemo(() => {
        if (!bankAccounts || !creditCards || !transactions) return [];

        const generatedAlerts: Alert[] = [];
        const now = new Date();

        // Low balance alerts
        const LOW_BALANCE_THRESHOLD = 5000;
        for (const account of bankAccounts) {
            if (!account.isSavingsAccount && account.currentBalance < LOW_BALANCE_THRESHOLD) {
                generatedAlerts.push({
                    id: `low-balance-${account.id}`,
                    type: 'balance',
                    severity: 'warning',
                    message: `Your ${account.name} balance is low: ${formatCurrency(account.currentBalance)}.`,
                });
            }
        }
        
        // Credit card alerts
        if (creditCards) {
            for (const card of creditCards) {
                // High utilization alert
                const utilization = (card.creditLimit > 0) ? (card.currentBalance / card.creditLimit) * 100 : 0;
                if (utilization >= 85) {
                     generatedAlerts.push({
                        id: `util-critical-${card.id}`,
                        type: 'credit',
                        severity: 'critical',
                        message: `Your ${card.name} is at ${utilization.toFixed(0)}% utilization.`,
                    });
                } else if (utilization >= 70) {
                     generatedAlerts.push({
                        id: `util-warning-${card.id}`,
                        type: 'credit',
                        severity: 'warning',
                        message: `Your ${card.name} is at ${utilization.toFixed(0)}% utilization.`,
                    });
                }

                // Upcoming due date alert
                const DUE_DATE_WARNING_DAYS = 5;
                try {
                    const dueDate = parseISO(card.statementDueDate);
                    const daysUntilDue = differenceInDays(dueDate, now);

                    if (daysUntilDue >= 0 && daysUntilDue <= DUE_DATE_WARNING_DAYS) {
                        generatedAlerts.push({
                            id: `due-date-${card.id}`,
                            type: 'due',
                            severity: 'info',
                            message: `${card.name} payment is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`,
                        });
                    }
                } catch (e) {
                    // Ignore invalid date formats
                }
            }
        }

        // Low Savings Rate Alert
        const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        if (totalIncome > 0) {
            const savings = totalIncome - totalExpense;
            const savingsRate = (savings / totalIncome) * 100;
            if (savingsRate < 10) {
                 generatedAlerts.push({
                    id: 'low-savings-rate',
                    type: 'savings',
                    severity: 'warning',
                    message: `Your savings rate is low this month (${savingsRate.toFixed(0)}%).`,
                });
            }
        }

        return generatedAlerts;
    }, [bankAccounts, creditCards, transactions]);

    // UI Rendering
    const alertConfig: Record<Alert['severity'], {icon: React.ElementType, iconColor: string, bgColor: string}> = {
        critical: { icon: AlertCircle, iconColor: 'text-red-500', bgColor: 'bg-red-50' },
        warning: { icon: Zap, iconColor: 'text-orange-500', bgColor: 'bg-orange-50' },
        info: { icon: CalendarClock, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
    };

    const renderLoading = () => (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-3">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                </div>
            ))}
        </div>
    );
    
    const renderNoAlerts = () => (
        <div className="flex flex-col items-center justify-center text-center py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50">
                <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
            <p className="mt-4 font-semibold">All Clear!</p>
            <p className="text-sm text-muted-foreground">No financial risks detected.</p>
        </div>
    );

    const renderAlerts = () => {
        const alertsToShow = showAll ? alerts : alerts.slice(0, 3);
    
        return (
            <div className="space-y-4">
                {alertsToShow.map((alert) => {
                    const config = alertConfig[alert.severity];
                    const Icon = config.icon;
                    return (
                        <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
                                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{alert.message}</p>
                            </div>
                        </div>
                    )
                })}
                 {alerts.length > 3 && !showAll && (
                    <Button variant="link" className="w-full text-primary" onClick={() => setShowAll(true)}>
                        View all {alerts.length} alerts <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
                {alerts.length > 3 && showAll && (
                     <p className="text-sm text-center text-muted-foreground pt-2">No more alerts to show.</p>
                )}
            </div>
        );
    }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Smart Alerts</CardTitle>
        <CardDescription>Proactive insights on your finances.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? renderLoading() : alerts.length > 0 ? renderAlerts() : renderNoAlerts()}
      </CardContent>
    </Card>
  )
}
