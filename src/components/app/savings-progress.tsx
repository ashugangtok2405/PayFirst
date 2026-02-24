'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, BankAccount } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function SavingsProgress() {
    const firestore = useFirestore()
    const { user } = useUser()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null, [firestore, user]);
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
    const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery);
    
    const isLoading = loadingTransactions || loadingBankAccounts;

    const monthlyIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) ?? 0;
    
    const savingsAccountsIds = bankAccounts?.filter(acc => acc.isSavingsAccount).map(acc => acc.id) ?? [];
    
    const savedThisMonth = transactions?.filter(t => t.type === 'transfer' && t.toBankAccountId && savingsAccountsIds.includes(t.toBankAccountId)).reduce((sum, t) => sum + t.amount, 0) ?? 0;

    const goal = monthlyIncome * 0.2; // Assuming a 20% savings goal
    const goalProgress = goal > 0 ? (savedThisMonth / goal) * 100 : 0;
    const leftToGo = goal > savedThisMonth ? goal - savedThisMonth : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-3/5" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Savings Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Income</span>
                    <span className="font-semibold">{formatCurrency(monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Saved this month</span>
                    <span className="font-semibold">{formatCurrency(savedThisMonth)}</span>
                </div>
                
                <Progress value={goalProgress} className="h-4 rounded-full" indicatorClassName="bg-green-500 rounded-full" />

                <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                        {`+${formatCurrency(leftToGo)} to go`}
                    </span>
                    <span className="text-muted-foreground flex items-center">
                        Goal: {formatCurrency(goal)} <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
