'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import type { Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function RecentTransactions() {
    const firestore = useFirestore()
    const { user } = useUser()

    const recentTransactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('transactionDate', 'desc'), limit(6)) : null,
        [firestore, user]
    )
    const { data: recentTransactions, isLoading } = useCollection<Transaction>(recentTransactionsQuery)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>An overview of your latest financial activity.</CardDescription>
                </div>
                <Button asChild size="sm" className="ml-auto gap-1">
                    <Link href="/dashboard/transactions">
                        View All
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={2}><Skeleton className="h-8" /></TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && recentTransactions?.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <div className="font-medium">{transaction.description}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(transaction.transactionDate).toLocaleDateString()}</div>
                                </TableCell>
                                <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-500' : ''}`}>
                                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                </TableCell>
                            </TableRow>
                        ))}
                        {!isLoading && recentTransactions?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">No recent transactions.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
