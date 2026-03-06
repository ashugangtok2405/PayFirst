'use client'

import { useMemo } from 'react'
import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Investment } from '@/lib/types'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PortfolioAllocation() {
  const { user } = useUser()
  const firestore = useFirestore()

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading } = useCollection<Investment>(investmentsQuery)

  const chartData = useMemo(() => {
    if (!investments) return []
    const allocation = investments.reduce((acc, inv) => {
      const category = inv.category
      acc[category] = (acc[category] || 0) + inv.currentValue
      return acc
    }, {} as Record<string, number>)

    return Object.entries(allocation).map(([name, value]) => ({ name, value }))
  }, [investments])

  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-48 w-full rounded-full" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
        <CardDescription>Your assets distribution by category.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="12">
                            {`${(percent * 100).toFixed(0)}%`}
                        </text>
                    );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)} />
              <Legend iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
            <p className="text-center text-sm text-muted-foreground py-10">No allocation data to display.</p>
        )}
      </CardContent>
    </Card>
  )
}
