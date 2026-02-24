'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, TrendingUp, Wallet, Landmark, CreditCard } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const summaryData = [
  { title: 'Total Assets', value: 840500, change: '+2.5%', changeType: 'increase', icon: Landmark, chartData: [{v:300}, {v:400}, {v:350}, {v:500}, {v:450}, {v:600}], color: 'hsl(var(--primary))' },
  { title: 'Total Liabilities', value: 75200, change: '+1.2%', changeType: 'increase', icon: CreditCard, chartData: [{v:200}, {v:250}, {v:220}, {v:280}, {v:260}, {v:300}], color: 'hsl(var(--destructive))' },
  { title: 'Net Worth', value: 765300, change: '+3.1%', changeType: 'increase', icon: Wallet, chartData: [{v:400}, {v:420}, {v:410}, {v:450}, {v:440}, {v:480}], color: 'hsl(var(--chart-2))' },
]

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function NetWorthSummary() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {summaryData.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between">
                <div>
                    <div className="text-3xl font-bold">{formatCurrency(item.value)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                        <span className={`flex items-center ${item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                           {item.changeType === 'increase' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />} 
                           {item.change}
                        </span>
                        <span className="ml-2">vs last month</span>
                    </p>
                </div>
                <div className="h-16 w-28">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={item.chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id={`color-${item.title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={item.color} stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor={item.color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area 
                                type="monotone" 
                                dataKey="v" 
                                stroke={item.color}
                                strokeWidth={2}
                                fill={`url(#color-${item.title.replace(/\s+/g, '')})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
