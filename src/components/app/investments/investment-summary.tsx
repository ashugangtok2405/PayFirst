'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, PiggyBank, CircleDollarSign } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Investment } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function InvestmentSummary() {
  const { user } = useUser()
  const firestore = useFirestore()

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery)

  const summary = useMemo(() => {
    if (!investments) return { totalInvested: 0, currentValue: 0, overallGain: 0, overallGainPercent: 0 }

    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0)
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0)
    const overallGain = currentValue - totalInvested
    const overallGainPercent = totalInvested > 0 ? (overallGain / totalInvested) * 100 : 0

    return { totalInvested, currentValue, overallGain, overallGainPercent }
  }, [investments])

  const summaryCards = [
    { title: 'Total Invested', value: summary.totalInvested, icon: PiggyBank },
    { title: 'Current Value', value: summary.currentValue, icon: CircleDollarSign },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(item.value)}</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall P&L</CardTitle>
          {summary.overallGain >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
        </CardHeader>
        <CardContent>
          <div className={cn("text-3xl font-bold", summary.overallGain >= 0 ? 'text-green-600' : 'text-red-600')}>{formatCurrency(summary.overallGain)}</div>
          <p className="text-xs text-muted-foreground">This is your absolute profit or loss.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overall Return %</CardTitle>
          {summary.overallGainPercent >= 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
        </CardHeader>
        <CardContent>
          <div className={cn("text-3xl font-bold", summary.overallGainPercent >= 0 ? 'text-green-600' : 'text-red-600')}>{summary.overallGainPercent.toFixed(2)}%</div>
          <p className="text-xs text-muted-foreground">This is your absolute return.</p>
        </CardContent>
      </Card>
    </div>
  )
}
