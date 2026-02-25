'use client'

import React, { useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Flame, ShieldAlert, Target, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { BankAccount, CreditCard, Transaction } from '@/lib/types'
import { startOfMonth, differenceInDays, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number, compact = false) => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
    compactDisplay: 'short',
  })
  return formatter.format(amount)
}

const Sparkline = ({ data, color }: { data: any[]; color: string }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.4} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="pv"
        stroke={color}
        strokeWidth={2}
        fillOpacity={1}
        fill={`url(#color-${color})`}
      />
    </AreaChart>
  </ResponsiveContainer>
)

export function KpiSummary() {
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null),
    [firestore, user]
  )
  const { data: bankAccounts, isLoading: loadingBankAccounts } =
    useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'creditCards') : null),
    [firestore, user]
  )
  const { data: creditCards, isLoading: loadingCreditCards } =
    useCollection<CreditCard>(creditCardsQuery)

  const startOfCurrentMonth = useMemo(() => startOfMonth(new Date()), [])
  const transactionsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'transactions'),
            where('transactionDate', '>=', startOfCurrentMonth.toISOString())
          )
        : null,
    [firestore, user, startOfCurrentMonth]
  )
  const { data: transactions, isLoading: loadingTransactions } =
    useCollection<Transaction>(transactionsQuery)

  const isLoading =
    loadingBankAccounts || loadingCreditCards || loadingTransactions

  const metrics = useMemo(() => {
    const now = new Date()
    const currentMonthTransactions = transactions ?? []

    // 1. Available Cash
    const availableCash =
      bankAccounts?.reduce((sum, acc) => sum + acc.currentBalance, 0) ?? 0

    // Income & Expense for current month
    const totalIncome = currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // 2. Monthly Burn Rate
    const daysElapsed = differenceInDays(now, startOfMonth(now)) + 1
    const burnRate = daysElapsed > 0 ? totalExpense / daysElapsed : 0
    const moneyLastsDays = burnRate > 0 ? availableCash / burnRate : Infinity

    // 3. Credit Risk & 4. Utilization
    const creditRisk =
      creditCards?.reduce((sum, card) => sum + card.currentBalance, 0) ?? 0
    const totalCreditLimit =
      creditCards?.reduce((sum, card) => sum + card.creditLimit, 0) ?? 0
    const utilization =
      totalCreditLimit > 0 ? (creditRisk / totalCreditLimit) * 100 : 0

    // 5. Next Due Date
    let nextDueDate: Date | null = null
    let daysUntilDue: number | null = null
    if (creditCards) {
      creditCards.forEach((card) => {
        try {
          const dueDate = parseISO(card.statementDueDate)
          if (dueDate >= now) {
            if (!nextDueDate || dueDate < nextDueDate) {
              nextDueDate = dueDate
            }
          }
        } catch (e) {
          /* ignore invalid dates */
        }
      })
      if (nextDueDate) {
        daysUntilDue = differenceInDays(nextDueDate, now)
      }
    }
    const nextDueDateString =
      daysUntilDue !== null
        ? daysUntilDue === 0
          ? 'today'
          : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`
        : 'N/A'

    // 6. Savings Intelligence
    const savings = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0
    const onTrack = savingsRate >= 20 // Assuming 20% savings rate is the goal

    // MOCK DATA for sparkline - To be replaced with historical data fetching
    const cashSparkline = [
      { pv: 2400 }, { pv: 1398 }, { pv: 9800 }, { pv: 3908 },
      { pv: 4800 }, { pv: 3800 }, { pv: 4300 },
    ]

    return {
      availableCash,
      burnRate,
      moneyLastsDays,
      creditRisk,
      utilization,
      nextDueDateString,
      savingsRate,
      savedThisMonth: savings,
      onTrack,
      cashSparkline,
    }
  }, [bankAccounts, creditCards, transactions])

  const kpiCards = [
    {
      title: 'Available Cash',
      icon: Wallet,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50',
      renderContent: () => (
        <>
          <p className="text-3xl font-bold">
            {formatCurrency(metrics.availableCash)}
          </p>
          <div className="text-sm text-muted-foreground h-5">
            Total liquid money available.
          </div>
        </>
      ),
      renderFooter: () => (
        <Sparkline data={metrics.cashSparkline} color="hsl(var(--primary))" />
      ),
    },
    {
      title: 'Avg. Daily Burn',
      icon: Flame,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-50',
      renderContent: () => (
        <>
          <p className="text-3xl font-bold">
            {formatCurrency(metrics.burnRate)}
          </p>
          <div className="text-sm text-muted-foreground h-5">
            Avg. spend this month.
          </div>
        </>
      ),
      renderFooter: () => (
        <p className="text-xs text-muted-foreground">
          {isFinite(metrics.moneyLastsDays)
            ? `At this rate, cash lasts ~${Math.floor(metrics.moneyLastsDays)} days`
            : 'No spending this month.'}
        </p>
      ),
    },
    {
      title: 'Credit Risk',
      icon: ShieldAlert,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50',
      renderContent: () => (
        <>
          <p className="text-3xl font-bold">
            {formatCurrency(metrics.creditRisk)}
          </p>
          <p className="text-sm text-muted-foreground h-5">
            Next due{' '}
            <span className="font-semibold text-foreground">
              {metrics.nextDueDateString}
            </span>
          </p>
        </>
      ),
      renderFooter: () => (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium">Utilization</span>
            <span className="font-bold">{metrics.utilization.toFixed(0)}%</span>
          </div>
          <Progress
            value={metrics.utilization}
            indicatorClassName="bg-red-500"
            className="h-2"
          />
        </div>
      ),
    },
    {
      title: 'Savings Intelligence',
      icon: Target,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50',
      renderContent: () => (
        <>
          <p className="text-3xl font-bold">
            {metrics.savingsRate.toFixed(0)}%{' '}
            <span className="text-lg font-normal text-muted-foreground">
              rate
            </span>
          </p>
          <p className="text-sm text-muted-foreground h-5">
            Saved{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(metrics.savedThisMonth, true)}
            </span>{' '}
            this month
          </p>
        </>
      ),
      renderFooter: () =>
        metrics.onTrack ? (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <TrendingUp className="h-4 w-4" />
            <span>You're on track this month!</span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Goal is to save at least 20% of income.
          </p>
        ),
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
              <div className="pt-2">
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi, i) => (
        <Card
          key={i}
          className="rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${kpi.bgColor}`}
            >
              <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpi.renderContent()}
            <div className="pt-2">{kpi.renderFooter && kpi.renderFooter()}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
