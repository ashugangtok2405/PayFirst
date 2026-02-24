'use client'

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category } from '@/lib/types'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function CategoryBreakdown() {
    const firestore = useFirestore()
    const { user } = useUser()

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const transactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('type', '==', 'expense'), where('transactionDate', '>=', startOfMonth)) : null,
        [firestore, user]
    )
    const { data: monthlyExpenses, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery)

    const categoriesQuery = useMemoFirebase(
        () => user ? collection(firestore, 'users', user.uid, 'categories') : null,
        [firestore, user]
    )
    const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery)

    const categoriesMap = useMemo(() => {
        if (!categories) return {}
        return categories.reduce((acc, category) => {
            acc[category.id] = category.name
            return acc
        }, {} as { [key: string]: string })
    }, [categories])

    const spendingByCategory = useMemo(() => {
        if (!monthlyExpenses) return []
        const spending = monthlyExpenses.reduce((acc, transaction) => {
            const categoryName = categoriesMap[transaction.categoryId] || 'Uncategorized'
            if (!acc[categoryName]) {
                acc[categoryName] = 0
            }
            acc[categoryName] += transaction.amount
            return acc
        }, {} as { [key: string]: number })

        return Object.entries(spending).map(([name, value]) => ({
            name,
            value,
        })).sort((a, b) => b.value - a.value);

    }, [monthlyExpenses, categoriesMap])

    const isLoading = isLoadingTransactions || isLoadingCategories;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Your spending by category this month.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="h-[300px] w-full flex items-center justify-center">
                       <Skeleton className="h-full w-full" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Pie
                                data={spendingByCategory}
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
                                    if (percent === 0) return null;
                                    return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}
                            >
                                {spendingByCategory.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend wrapperStyle={{fontSize: "0.8rem"}} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
