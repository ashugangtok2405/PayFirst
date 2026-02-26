'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import type { Transaction, CreditCard } from '@/lib/types'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

export function ViewStatementDialog({ children, card }: { children: React.ReactNode, card: CreditCard }) {
    const [open, setOpen] = useState(false)
    const firestore = useFirestore()
    const { user } = useUser()

    const { monthStart, monthEnd } = useMemo(() => {
        const now = new Date()
        return {
            monthStart: startOfMonth(now),
            monthEnd: endOfMonth(now),
        }
    }, [])

    const transactionsQuery = useMemoFirebase(() => user ? query(
        collection(firestore, 'users', user.uid, 'transactions'), 
        where('transactionDate', '>=', monthStart.toISOString()),
        where('transactionDate', '<=', monthEnd.toISOString()),
        orderBy('transactionDate', 'desc')
        ) : null, [user?.uid, firestore, monthStart, monthEnd]
    )
    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery)

    const statementData = useMemo(() => {
        if (!transactions) return { expenses: [], payments: [], totalSpent: 0, totalPaid: 0 };
        
        const expenses = transactions.filter(t => t.fromCreditCardId === card.id)
        const payments = transactions.filter(t => t.toCreditCardId === card.id && t.type === 'credit_card_payment')
        
        const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0)
        const totalPaid = payments.reduce((sum, t) => sum + t.amount, 0)

        return { expenses, payments, totalSpent, totalPaid }
    }, [transactions, card.id])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{card.name} Statement</DialogTitle>
                    <DialogDescription>
                        {format(monthStart, 'MMMM yyyy')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex justify-between items-center"><span className="text-sm text-muted-foreground">Current Outstanding</span><span className="text-lg font-bold">{formatCurrency(card.currentBalance)}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Spent This Month</span><span>{formatCurrency(statementData.totalSpent)}</span></div>
                        <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Paid This Month</span><span>{formatCurrency(statementData.totalPaid)}</span></div>
                    </div>
                    <ScrollArea className="h-72">
                        <div className="pr-4 space-y-4">
                        {isLoading ? <Skeleton className="h-24 w-full" /> : (
                            <>
                            <div>
                                <h4 className="font-semibold mb-2">Expenses</h4>
                                {statementData.expenses.length > 0 ? (
                                    statementData.expenses.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                            <div>
                                                <p className="font-medium text-sm">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(tx.transactionDate), 'dd MMM')}</p>
                                            </div>
                                            <p className="font-medium text-sm">{formatCurrency(tx.amount)}</p>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-muted-foreground text-center py-4">No expenses this month.</p>}
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Payments</h4>
                                {statementData.payments.length > 0 ? (
                                    statementData.payments.map(tx => (
                                        <div key={tx.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                            <div>
                                                <p className="font-medium text-sm text-green-600">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(tx.transactionDate), 'dd MMM')}</p>
                                            </div>
                                            <p className="font-medium text-sm text-green-600">-{formatCurrency(tx.amount)}</p>
                                        </div>
                                    ))
                                ) : <p className="text-sm text-muted-foreground text-center py-4">No payments this month.</p>}
                            </div>
                            </>
                        )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
