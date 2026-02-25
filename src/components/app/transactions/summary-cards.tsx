'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Scale, TrendingUp, TrendingDown, Repeat } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    if (current === 0 && previous > 0) return -100
    if (previous === current) return 0
    return ((current - previous) / Math.abs(previous)) * 100
}

const ChangeIndicator = ({ value, invertColors = false, prefix = "vs last period" }: { value: number, invertColors?: boolean, prefix?: string }) => {
    if (!isFinite(value) || value === 0) return <p className="text-xs text-muted-foreground">&nbsp;</p>
    let isIncrease = value > 0
    if (invertColors) isIncrease = !isIncrease

    return (
        <p className={cn("flex items-center text-xs font-medium", isIncrease ? 'text-green-600' : 'text-red-600')}>
            {isIncrease ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {Math.abs(value).toFixed(1)}% {prefix}
        </p>
    )
}

export function SummaryCards({ currentSummary, previousSummary, averageDailySpend, previousAverageDailySpend, daysInPeriod }: any) {
    const incomeChange = calculatePercentageChange(currentSummary.income, previousSummary.income)
    const expenseChange = calculatePercentageChange(currentSummary.expense, previousSummary.expense)
    
    const projectedMonthlySpend = averageDailySpend * 30;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <ArrowUp className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(currentSummary.income)}</div>
                    <ChangeIndicator value={incomeChange} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expense</CardTitle>
                    <ArrowDown className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(currentSummary.expense)}</div>
                    <ChangeIndicator value={expenseChange} invertColors />
                </CardContent>
            </Card>
             <Card className={cn(currentSummary.net >= 0 ? 'bg-blue-50/50' : 'bg-orange-50/50')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
                    <Scale className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className={cn("text-3xl font-bold", currentSummary.net >= 0 ? 'text-blue-600' : 'text-orange-500')}>{formatCurrency(currentSummary.net)}</div>
                    <Badge variant={currentSummary.net >= 0 ? 'default' : 'destructive'} className={cn("text-xs font-normal", currentSummary.net >= 0 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800')}>
                        {currentSummary.net >= 0 ? 'Positive' : 'Negative'}
                    </Badge>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
                    <Repeat className="size-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(averageDailySpend)}</div>
                    <p className="text-xs text-muted-foreground">Projected: {formatCurrency(projectedMonthlySpend)}/mo</p>
                </CardContent>
            </Card>
        </div>
    )
}
