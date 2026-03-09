'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import type { Transaction, Category } from '@/lib/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export function RecentTransactions() {
  const { user } = useUser()
  const firestore = useFirestore()

  const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('transactionDate', 'desc'), limit(10)) : null, [user, firestore])
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [user, firestore])
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)
  
  const isLoading = loadingTransactions || loadingCategories;

  const enrichedTransactions = useMemo(() => {
    if (!transactions || !categories) return [];
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));
    return transactions.map(tx => ({
        ...tx,
        categoryName: tx.categoryId ? categoryMap.get(tx.categoryId) || 'Uncategorized' : 'Uncategorized'
    }));
  }, [transactions, categories]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your last 10 financial activities.</CardDescription>
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
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">No transactions found.</TableCell>
              </TableRow>
            )}
            {enrichedTransactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.description}</TableCell>
                <TableCell><Badge variant="outline" className="font-normal">{tx.categoryName}</Badge></TableCell>
                <TableCell>{format(new Date(tx.transactionDate), 'dd MMM, yyyy')}</TableCell>
                <TableCell className={cn(
                    "text-right font-semibold",
                    tx.type === 'income' || tx.type === 'debt_borrowed' || tx.type === 'debt_repayment_in' ? 'text-green-600' : 'text-red-600'
                )}>
                  {tx.type === 'income' || tx.type === 'debt_borrowed' || tx.type === 'debt_repayment_in' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
