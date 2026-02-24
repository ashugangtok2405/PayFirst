'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, CreditCard, Wallet, Scale } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { BankAccount, CreditCard as CreditCardType, Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function OverviewCards() {
    const firestore = useFirestore()
    const { user } = useUser()

    const bankAccountsQuery = useMemoFirebase(
        () => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null,
        [firestore, user]
    )
    const { data: bankAccounts, isLoading: isLoadingAccounts } = useCollection<BankAccount>(bankAccountsQuery)

    const creditCardsQuery = useMemoFirebase(
        () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
        [firestore, user]
    )
    const { data: creditCards, isLoading: isLoadingCards } = useCollection<CreditCardType>(creditCardsQuery)
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const transactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null,
        [firestore, user]
    )
    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery)

    const totalBalance = bankAccounts?.reduce((sum, account) => sum + account.currentBalance, 0) ?? 0;
    const totalDebt = creditCards?.reduce((sum, card) => sum + card.currentBalance, 0) ?? 0;
    const monthlyExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) ?? 0;
    const netPosition = totalBalance - totalDebt;

    const isLoading = isLoadingAccounts || isLoadingCards || isLoadingTransactions;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-5 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Available Balance</CardTitle>
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                    <p className="text-xs text-muted-foreground">Across all bank accounts</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Credit Outstanding</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
                    <p className="text-xs text-muted-foreground">Total outstanding balance</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</div>
                    <p className="text-xs text-muted-foreground">in the last 30 days</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Position</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(netPosition)}</div>
                    <p className="text-xs text-muted-foreground">Bank Balance - Credit</p>
                </CardContent>
            </Card>
        </div>
    )
}
