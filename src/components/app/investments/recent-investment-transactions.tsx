'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import type { InvestmentTransaction, Investment } from '@/lib/types'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

export function RecentInvestmentTransactions() {
  const { user } = useUser()
  const firestore = useFirestore()

  const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'investmentTransactions'), orderBy('transactionDate', 'desc'), limit(10)) : null, [user, firestore])
  const { data: transactions, isLoading: loadingTransactions } = useCollection<InvestmentTransaction>(transactionsQuery)

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading: loadingInvestments } = useCollection<Investment>(investmentsQuery)
  
  const isLoading = loadingTransactions || loadingInvestments;

  const enrichedTransactions = useMemo(() => {
    if (!transactions || !investments) return [];
    const investmentMap = new Map(investments.map(inv => [inv.id, inv.fundName]));
    return transactions.map(tx => ({
        ...tx,
        fundName: investmentMap.get(tx.investmentId) || 'Unknown Fund'
    }));
  }, [transactions, investments]);

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
      <CardHeader>
        <CardTitle>Recent Investment Transactions</CardTitle>
        <CardDescription>Your last 10 investment activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fund Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">No investment transactions found.</TableCell>
              </TableRow>
            )}
            {enrichedTransactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">{tx.fundName}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn(tx.type === 'buy' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50', 'capitalize')}>{tx.type}</Badge>
                </TableCell>
                <TableCell>{format(new Date(tx.transactionDate), 'dd MMM, yyyy')}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(tx.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
