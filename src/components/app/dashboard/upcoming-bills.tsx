'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { CreditCard, RecurringTransaction } from '@/lib/types'
import { differenceInDays, isFuture, isPast, parseISO, startOfToday, format as formatDate } from 'date-fns'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function UpcomingBills() {
    const firestore = useFirestore()
    const { user } = useUser()

    const creditCardsQuery = useMemoFirebase(
        () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
        [firestore, user]
    )
    const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)
    
    const recurringQuery = useMemoFirebase(
        () => user ? query(
            collection(firestore, 'users', user.uid, 'recurringTransactions'),
            where('active', '==', true),
            where('autoCreate', '==', false) // Only get reminders
        ) : null,
        [firestore, user]
    )
    const { data: recurringTransactions, isLoading: loadingRecurring } = useCollection<RecurringTransaction>(recurringQuery)
    
    const isLoading = loadingCreditCards || loadingRecurring

    const upcomingBills = useMemo(() => {
        if (!creditCards && !recurringTransactions) return [];
        
        const today = startOfToday();
        const bills = [];

        // Credit Card Bills
        if (creditCards) {
            for (const card of creditCards) {
                try {
                    const dueDate = parseISO(card.statementDueDate);
                    const daysUntilDue = differenceInDays(dueDate, today);
                    const isOverdue = isPast(dueDate) && card.currentBalance > 0 && daysUntilDue < 0;
                    
                    if (card.currentBalance > 0 && (isOverdue || (isFuture(dueDate) && daysUntilDue <= 30))) {
                        bills.push({
                            id: `cc-${card.id}`,
                            name: card.name,
                            dueDate: dueDate,
                            amount: card.currentBalance,
                            isOverdue: isOverdue,
                            daysUntilDue: daysUntilDue
                        });
                    }
                } catch (e) { /* Ignore invalid dates */ }
            }
        }
        
        // Recurring Transactions (as reminders)
        if (recurringTransactions) {
            for (const item of recurringTransactions) {
                 try {
                    const dueDate = parseISO(item.nextGenerationDate);
                    const daysUntilDue = differenceInDays(dueDate, today);
                     const isOverdue = isPast(dueDate) && daysUntilDue < 0;

                    if (isOverdue || (isFuture(dueDate) && daysUntilDue <= 30)) {
                         bills.push({
                            id: `rec-${item.id}`,
                            name: item.description,
                            dueDate: dueDate,
                            amount: item.amount,
                            isOverdue: isOverdue,
                            daysUntilDue: daysUntilDue
                        });
                    }
                 } catch (e) { /* Ignore invalid dates */ }
            }
        }
        
        // Sort by due date
        return bills.sort((a, b) => a!.dueDate.getTime() - b!.dueDate.getTime());

    }, [creditCards, recurringTransactions]);


    const renderLoading = () => (
        <ul className="space-y-4">
            {[...Array(3)].map((_, index) => (
                <li key={index}>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24 mt-1" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                    </div>
                    {index < 2 && <Separator className="mt-4" />}
                </li>
            ))}
        </ul>
    );

    const renderEmpty = () => (
        <div className="text-center py-10">
            <p className="text-muted-foreground">No upcoming bills in the next 30 days.</p>
        </div>
    );

    const renderBills = () => (
        <ul className="space-y-4">
          {upcomingBills.map((bill, index) => (
            <li key={bill!.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{bill!.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">Due: {formatDate(bill!.dueDate, 'LLL dd, yyyy')}</p>
                    {bill!.isOverdue ? (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs font-normal">
                            {bill!.daysUntilDue} day{bill!.daysUntilDue !== 1 ? 's' : ''} left
                        </Badge>
                    )}
                  </div>
                </div>
                <p className={`font-bold text-sm ${bill!.isOverdue ? 'text-red-600' : ''}`}>{formatCurrency(bill!.amount)}</p>
              </div>
              {index < upcomingBills.length - 1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
    );

    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
        <CardHeader>
            <CardTitle className="text-xl">Upcoming Bills</CardTitle>
            <CardDescription>Bills due in the next 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? renderLoading() : upcomingBills.length === 0 ? renderEmpty() : renderBills()}
        </CardContent>
        </Card>
    )
}
