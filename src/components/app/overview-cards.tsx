'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Landmark, CreditCard, ShoppingCart, Scale } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { BankAccount, CreditCard as CreditCardType, Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function OverviewCards() {
    const firestore = useFirestore()
    const { user } = useUser()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
    const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
    
    const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user])
    const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCardType>(creditCardsQuery)

    const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null, [firestore, user]);
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);
    
    const isLoading = loadingBankAccounts || loadingCreditCards || loadingTransactions;

    const totalAvailableBalance = bankAccounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) ?? 0
    const totalCreditCard = creditCards?.reduce((sum, card) => sum + card.currentBalance, 0) ?? 0
    const thisMonthExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) ?? 0
    const netPosition = totalAvailableBalance - totalCreditCard

    const overviewData = [
        { title: 'Total Available Balance', value: totalAvailableBalance, icon: Landmark, color: 'text-blue-500', bgColor: 'bg-blue-100' },
        { title: 'Total Credit Card', value: totalCreditCard, icon: CreditCard, color: 'text-red-500', bgColor: 'bg-red-100' },
        { title: 'This Month Expenses', value: thisMonthExpenses, icon: ShoppingCart, color: 'text-green-500', bgColor: 'bg-green-100' },
        { title: 'Net Position', value: netPosition, icon: Scale, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
    ]

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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <Skeleton className="size-12 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-7 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewData.map((item, index) => {
                const Icon = item.icon
                return (
                    <Card key={index}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={`flex items-center justify-center size-12 rounded-lg ${item.bgColor}`}>
                                <Icon className={`size-6 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{item.title}</p>
                                <p className="text-2xl font-bold">{formatCurrency(item.value)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
