'use client'

import { useMemo, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUp } from 'lucide-react'
import { subMonths, format } from 'date-fns'

// MOCK DATA - To be replaced with live data
const allNetWorthData = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), 11 - i);
    return {
        month: format(date, 'MMM'),
        value: 350000 + (i * 20000) + (Math.random() - 0.5) * 30000
    }
});


const formatCurrency = (value: number) => `₹${(value / 100000).toFixed(1)}L`
const formatCurrencyTooltip = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-sm text-blue-600">Net Worth: {formatCurrencyTooltip(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

export function NetWorthTrend() {
  const [period, setPeriod] = useState('6');

  const netWorthData = useMemo(() => {
      return allNetWorthData.slice(-parseInt(period, 10));
  }, [period]);

  const currentNetWorth = netWorthData.length > 0 ? netWorthData[netWorthData.length - 1].value : 0;
  const previousNetWorth = netWorthData.length > 1 ? netWorthData[netWorthData.length - 2].value : 0;
  const growth = previousNetWorth > 0 ? ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100 : 0;

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
            <div className="flex items-center text-sm font-medium text-green-600">
                <ArrowUp className="h-4 w-4" />
                <span>{growth.toFixed(1)}% vs last month</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="-ml-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={netWorthData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
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
