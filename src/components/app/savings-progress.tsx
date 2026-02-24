'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function SavingsProgress() {
    const firestore = useFirestore()
    const { user } = useUser()
    const savingsGoal = 5000; // Mock data

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const transactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null,
        [firestore, user]
    )
    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery)

    const monthlyIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) ?? 0;
    const monthlyExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) ?? 0;
    const amountSaved = monthlyIncome - monthlyExpenses;
    const savingsPercentage = monthlyIncome > 0 ? (amountSaved / monthlyIncome) * 100 : 0;
    const goalProgress = savingsGoal > 0 ? (amountSaved / savingsGoal) * 100 : 0;
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Savings Progress</CardTitle>
                <CardDescription>Your saving activity this month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-4 w-1/4" />
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between text-lg font-medium">
                            <span>Saved this month</span>
                            <span className={amountSaved >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(amountSaved)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Monthly Income</span>
                            <span>{formatCurrency(monthlyIncome)}</span>
                        </div>
                         <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Savings Rate</span>
                            <span>{savingsPercentage.toFixed(1)}%</span>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium">Monthly Goal</span>
                                <span className="text-sm text-muted-foreground">{formatCurrency(savingsGoal)}</span>
                            </div>
                            <Progress value={goalProgress} />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
