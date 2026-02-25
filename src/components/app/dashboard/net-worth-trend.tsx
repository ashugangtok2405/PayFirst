'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { subMonths, format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import type { BankAccount, CreditCard, Transaction } from '@/lib/types'

const formatCurrency = (value: number) => `₹${(value / 100000).toFixed(1)}L`
const formatCurrencyTooltip = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-primary">Net Worth: {formatCurrencyTooltip(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };


export function NetWorthTrend() {
  const [period, setPeriod] = useState('6');
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)
  
  const twelveMonthsAgo = useMemo(() => startOfMonth(subMonths(new Date(), 11)), []);

  const transactionsQuery = useMemoFirebase(() => user ? query(
      collection(firestore, 'users', user.uid, 'transactions'), 
      where('transactionDate', '>=', twelveMonthsAgo.toISOString()),
      orderBy('transactionDate', 'desc')
  ) : null, [firestore, user, twelveMonthsAgo]);
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const isLoading = loadingBankAccounts || loadingCreditCards || loadingTransactions

  const allNetWorthData = useMemo(() => {
    if (isLoading || !bankAccounts || !creditCards || !transactions) return null;

    const currentTotalAssets = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
    const currentTotalLiabilities = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
    let runningNetWorth = currentTotalAssets - currentTotalLiabilities;

    const monthlyData: {month: string; value: number}[] = [];

    // Loop backwards from the current month for 12 months
    for (let i = 0; i < 12; i++) {
        const targetMonth = subMonths(new Date(), i);

        // For all but the most recent month (i=0), we need to adjust the runningNetWorth
        if (i > 0) {
            const monthToSubtract = subMonths(new Date(), i - 1);
            const monthStart = startOfMonth(monthToSubtract);
            const monthEnd = endOfMonth(monthToSubtract);

            const txsInMonth = transactions.filter(t => {
                try {
                    const txDate = parseISO(t.transactionDate);
                    return txDate >= monthStart && txDate <= monthEnd;
                } catch(e) { return false; }
            });
            
            const income = txsInMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expense = txsInMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const netFlow = income - expense;
            
            runningNetWorth -= netFlow;
        }

        monthlyData.push({
            month: format(targetMonth, 'MMM'),
            value: runningNetWorth
        });
    }

    return monthlyData.reverse(); // Reverse to get chronological order for the chart
  }, [isLoading, bankAccounts, creditCards, transactions]);


  const chartData = useMemo(() => {
      if (!allNetWorthData) return [];
      return allNetWorthData.slice(-parseInt(period, 10));
  }, [period, allNetWorthData]);

  const currentNetWorth = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const previousNetWorth = chartData.length > 1 ? chartData[chartData.length - 2].value : 0;
  const growth = previousNetWorth !== 0 ? ((currentNetWorth - previousNetWorth) / Math.abs(previousNetWorth)) * 100 : currentNetWorth > 0 ? 100 : 0;

  if (isLoading) {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                    <Skeleton className="h-10 w-[150px]" />
                </div>
                <div className="mt-4">
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-5 w-28 mt-2" />
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="w-full h-[200px]" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-xl">Net Worth</CardTitle>
                <CardDescription>Growth over time</CardDescription>
            </div>
             <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Last 6 Months" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="6">Last 6 Months</SelectItem>
                    <SelectItem value="12">Last 12 Months</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="mt-4">
            <p className="text-3xl font-bold">{formatCurrencyTooltip(currentNetWorth)}</p>
            <div className={`flex items-center text-sm font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growth >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span>{isFinite(growth) ? `${Math.abs(growth).toFixed(1)}% vs last month` : 'vs last month'}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="-ml-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
             <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}/>
            <Area type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" fill="url(#colorNetWorth)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
