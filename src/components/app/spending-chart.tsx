'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction } from '@/lib/types'
import { useMemo } from 'react'
import { subMonths, format, startOfMonth } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

export function SpendingChart() {
    const firestore = useFirestore()
    const { user } = useUser()

    const sixMonthsAgo = subMonths(new Date(), 5)
    const startOfPeriod = startOfMonth(sixMonthsAgo).toISOString()

    const transactionsQuery = useMemoFirebase(
        () => user ? query(
            collection(firestore, 'users', user.uid, 'transactions'), 
            where('type', '==', 'expense'), 
            where('transactionDate', '>=', startOfPeriod)
        ) : null,
        [firestore, user, startOfPeriod]
    )
    const { data: recentExpenses, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery)

    const monthlySpending = useMemo(() => {
        const months = Array.from({ length: 6 }).map((_, i) => {
            const date = subMonths(new Date(), i);
            return {
                name: format(date, 'MMM'),
                total: 0,
            };
        }).reverse();

        if (!recentExpenses) return months;
        
        recentExpenses.forEach(transaction => {
            const transactionMonth = format(new Date(transaction.transactionDate), 'MMM');
            const monthData = months.find(m => m.name === transactionMonth);
            if (monthData) {
                monthData.total += transaction.amount;
            }
        });

        return months;
    }, [recentExpenses])

    const isLoading = isLoadingTransactions;

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Spending Overview</CardTitle>
                <CardDescription>Your spending trend for the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[350px] w-full flex items-center justify-center">
                       <Skeleton className="h-full w-full" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlySpending}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
