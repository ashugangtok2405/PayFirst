'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Investment } from '@/lib/types'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
  }).format(amount)
}

export function PortfolioOverview() {
  const { user } = useUser()
  const firestore = useFirestore()

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery)

  const portfolio = useMemo(() => {
    if (!investments) return []
    return investments.map(inv => {
      const pnl = inv.currentValue - inv.investedAmount
      const pnlPercent = inv.investedAmount > 0 ? (pnl / inv.investedAmount) * 100 : 0
      const avgNav = inv.units > 0 ? inv.investedAmount / inv.units : 0
      return { ...inv, pnl, pnlPercent, avgNav }
    })
  }, [investments])

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
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>A detailed look at your holdings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fund Name</TableHead>
              <TableHead className="text-right">Invested</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">P&L</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolio.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">No investments found.</TableCell>
              </TableRow>
            )}
            {portfolio.map(item => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.fundName}</div>
                  <div className="text-sm text-muted-foreground">{item.fundHouse}</div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.investedAmount)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(item.currentValue)}</TableCell>
                <TableCell className={cn("text-right font-medium", item.pnl >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {formatCurrency(item.pnl)} ({item.pnlPercent.toFixed(2)}%)
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
