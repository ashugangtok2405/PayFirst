'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const monthlySpending = [
  { name: 'Jan', total: 2400 },
  { name: 'Feb', total: 2210 },
  { name: 'Mar', total: 2290 },
  { name: 'Apr', total: 2000 },
  { name: 'May', total: 2181 },
  { name: 'Jun', total: 2500 },
];

export function SpendingChart() {
    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Spending Overview</CardTitle>
                <CardDescription>Your spending trend for the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={monthlySpending}>
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
