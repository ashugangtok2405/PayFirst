'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TRANSACTIONS } from '@/lib/data'

export function SpendingChart() {
  const now = new Date()
  const monthlyExpenses = TRANSACTIONS.filter(
    (t) => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth()
  )

  const spendingByCategory = monthlyExpenses.reduce((acc, transaction) => {
    const { category, amount } = transaction
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += amount
    return acc
  }, {} as { [key: string]: number })

  const chartData = Object.entries(spendingByCategory).map(([name, total]) => ({
    name,
    total,
  })).sort((a, b) => b.total - a.total);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
