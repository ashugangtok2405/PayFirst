'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Scale, TrendingUp, TrendingDown } from 'lucide-react'
import type { Transaction } from '@/lib/types'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

interface SummaryCardsProps {
    transactions: Transaction[],
    previousTransactions: Transaction[]
}

const calculateSummary = (transactions: Transaction[]) => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const net = income - expense
    return { income, expense, net }
}

const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
}

const ChangeIndicator = ({ value }: { value: number }) => {
    if (value === 0 || !isFinite(value)) {
        return null;
    }
    const isIncrease = value > 0;
    return (
        <p className={`flex items-center text-xs font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
            {isIncrease ? <TrendingUp className="mr-1 h-4 w-4" /> : <TrendingDown className="mr-1 h-4 w-4" />}
            {Math.abs(value).toFixed(1)}% vs last period
        </p>
    )
}

export function SummaryCards({ transactions, previousTransactions }: SummaryCardsProps) {
    const currentSummary = useMemo(() => calculateSummary(transactions), [transactions])
    const previousSummary = useMemo(() => calculateSummary(previousTransactions), [previousTransactions])

    const incomeChange = calculatePercentageChange(currentSummary.income, previousSummary.income)
    const expenseChange = calculatePercentageChange(currentSummary.expense, previousSummary.expense)
    const netChange = calculatePercentageChange(currentSummary.net, previousSummary.net)

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <ArrowUp className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-600">{formatCurrency(currentSummary.income)}</div>
                    <ChangeIndicator value={incomeChange} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                    <ArrowDown className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-600">{formatCurrency(currentSummary.expense)}</div>
                    <ChangeIndicator value={expenseChange * -1} /> 
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
                    <Scale className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold ${currentSummary.net >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(currentSummary.net)}
                    </div>
                    <ChangeIndicator value={netChange} />
                </CardContent>
            </Card>
        </div>
    )
}
