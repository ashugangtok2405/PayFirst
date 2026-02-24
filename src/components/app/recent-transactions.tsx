'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const recentTransactions = [
  { id: '1', description: 'Monthly Salary', transactionDate: new Date().toISOString(), type: 'income', amount: 80000 },
  { id: '2', description: 'HDFC Credit Card Bill', transactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', amount: 24800 },
  { id: '3', description: 'Fuel', transactionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', amount: 12400 },
  { id: '4', description: 'Zomato Order', transactionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', amount: 850 },
  { id: '5', description: 'Shopping', transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'expense', amount: 6800 },
];

export function RecentTransactions() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    };

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
                        {recentTransactions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">No recent transactions.</TableCell>
                            </TableRow>
                        )}
                        {recentTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>
                                    <div className="font-medium">{transaction.description}</div>
                                    <div className="text-sm text-muted-foreground">{new Date(transaction.transactionDate).toLocaleDateString()}</div>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-500' : ''}`}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
