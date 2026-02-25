'use client'

import React from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Wallet, Flame, ShieldAlert, Target, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

// MOCK DATA - To be replaced with live data
const cashSparkline = [ { pv: 2400 }, { pv: 1398 }, { pv: 9800 }, { pv: 3908 }, { pv: 4800 }, { pv: 3800 }, { pv: 4300 } ]
const kpiData = {
  availableCash: { value: 125430.50, change: 2.1, changeType: 'increase' as const },
  burnRate: { value: 4520, moneyLastsDays: 27, change: 15, changeType: 'increase' as const },
  creditRisk: { value: 78500, utilization: 42, nextDueDate: 'in 5 days' },
  savingsRate: { value: 18, savedThisMonth: 15800, onTrack: true }
}

const formatCurrency = (amount: number, compact=false) => {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: compact ? 'compact': 'standard',
        compactDisplay: 'short'
    })
    return formatter.format(amount)
}

const Sparkline = ({ data, color }: { data: any[], color: string }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id={`color-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.4} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="pv" stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${color})`} />
    </AreaChart>
  </ResponsiveContainer>
);

const kpiCards = [
    { 
        title: 'Available Cash', 
        icon: Wallet, 
        iconColor: 'text-blue-500', 
        bgColor: 'bg-blue-50',
        data: kpiData.availableCash,
        renderContent: (data: typeof kpiData.availableCash) => (
            <>
                <p className="text-3xl font-bold">{formatCurrency(data.value)}</p>
                <div className={`flex items-center text-sm font-medium ${data.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {data.changeType === 'increase' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    <span>{data.change.toFixed(1)}% this month</span>
                </div>
            </>
        ),
        renderFooter: () => <Sparkline data={cashSparkline} color="hsl(var(--primary))" />
    },
    { 
        title: 'Monthly Burn Rate', 
        icon: Flame, 
        iconColor: 'text-orange-500', 
        bgColor: 'bg-orange-50',
        data: kpiData.burnRate,
        renderContent: (data: typeof kpiData.burnRate) => (
            <>
                <p className="text-3xl font-bold">{formatCurrency(data.value)} <span className="text-lg font-normal text-muted-foreground">/ day</span></p>
                 <div className={`flex items-center text-sm font-medium ${data.changeType === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                    {data.changeType === 'increase' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                    <span>{data.change}% vs last month</span>
                </div>
            </>
        ),
        renderFooter: () => <p className="text-xs text-muted-foreground">At this rate, your money lasts {kpiData.burnRate.moneyLastsDays} days</p>
    },
    { 
        title: 'Credit Risk', 
        icon: ShieldAlert, 
        iconColor: 'text-red-500', 
        bgColor: 'bg-red-50',
        data: kpiData.creditRisk,
        renderContent: (data: typeof kpiData.creditRisk) => (
            <>
                <p className="text-3xl font-bold">{formatCurrency(data.value)}</p>
                <p className="text-sm text-muted-foreground">Next due date <span className="font-semibold text-foreground">{data.nextDueDate}</span></p>
            </>
        ),
        renderFooter: () => (
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Utilization</span>
                    <span className="font-bold">{kpiData.creditRisk.utilization}%</span>
                </div>
                <Progress value={kpiData.creditRisk.utilization} indicatorClassName="bg-red-500" className="h-2" />
            </div>
        )
    },
    { 
        title: 'Savings Intelligence', 
        icon: Target, 
        iconColor: 'text-green-500', 
        bgColor: 'bg-green-50',
        data: kpiData.savingsRate,
        renderContent: (data: typeof kpiData.savingsRate) => (
            <>
                <p className="text-3xl font-bold">{data.value}% <span className="text-lg font-normal text-muted-foreground">rate</span></p>
                <p className="text-sm text-muted-foreground">Saved <span className="font-semibold text-foreground">{formatCurrency(data.savedThisMonth, true)}</span> this month</p>
            </>
        ),
        renderFooter: () => (
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>You're on track this month!</span>
            </div>
        )
    },
]

export function KpiSummary() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi, i) => (
        <Card key={i} className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {kpi.renderContent(kpi.data as any)}
            <div className="pt-2">
                {kpi.renderFooter && kpi.renderFooter()}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
