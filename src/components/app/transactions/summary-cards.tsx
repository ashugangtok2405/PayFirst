'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, Scale, TrendingUp, TrendingDown, Repeat } from 'lucide-react'

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
    return ((current - previous) / previous) * 100
}

const ChangeIndicator = ({ value, invertColors = false }: { value: number, invertColors?: boolean }) => {
    if (value === 0 || !isFinite(value)) return <p className="text-xs text-muted-foreground">&nbsp;</p>
    let isIncrease = value > 0
    if (invertColors) isIncrease = !isIncrease

    return (
        <p className={`flex items-center text-xs font-medium ${isIncrease ? 'text-green-600' : 'text-red-600'}`}>
            {isIncrease ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {Math.abs(value).toFixed(1)}% vs last period
        </p>
    )
}

const StatCard = ({ title, value, change, icon: Icon, iconBg, trendUpIsGood = true }: { title: string, value: string, change: number, icon: React.ElementType, iconBg: string, trendUpIsGood?: boolean}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={`flex items-center justify-center size-8 rounded-lg ${iconBg}`}>
                <Icon className="size-4 text-primary-foreground" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <ChangeIndicator value={change} invertColors={!trendUpIsGood} />
        </CardContent>
    </Card>
)

export function SummaryCards({ currentSummary, previousSummary, averageDailySpend, previousAverageDailySpend }: any) {
    const incomeChange = calculatePercentageChange(currentSummary.income, previousSummary.income)
    const expenseChange = calculatePercentageChange(currentSummary.expense, previousSummary.expense)
    const netChange = calculatePercentageChange(currentSummary.net, previousSummary.net)
    const avgSpendChange = calculatePercentageChange(averageDailySpend, previousAverageDailySpend)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Income" value={formatCurrency(currentSummary.income)} change={incomeChange} icon={ArrowUp} iconBg="bg-green-500" trendUpIsGood={true} />
            <StatCard title="Total Expense" value={formatCurrency(currentSummary.expense)} change={expenseChange} icon={ArrowDown} iconBg="bg-red-500" trendUpIsGood={false} />
            <StatCard title="Net Flow" value={formatCurrency(currentSummary.net)} change={netChange} icon={Scale} iconBg="bg-blue-500" trendUpIsGood={true} />
            <StatCard title="Avg. Daily Spend" value={formatCurrency(averageDailySpend)} change={avgSpendChange} icon={Repeat} iconBg="bg-orange-500" trendUpIsGood={false} />
        </div>
    )
}
