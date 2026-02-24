'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category } from '@/lib/types'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function SpendingChart() {
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

        return Object.entries(spending).map(([name, total]) => ({
            name,
            total,
        })).sort((a, b) => b.total - a.total);

    }, [monthlyExpenses, categoriesMap])

    const isLoading = isLoadingTransactions || isLoadingCategories;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                {isLoading && <Skeleton className="h-4 w-48 mt-1" />}
                {!isLoading && !spendingByCategory.length && <CardDescription>No spending data for this month yet.</CardDescription>}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[350px] w-full flex items-center justify-center">
                       <Skeleton className="h-full w-full" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={spendingByCategory}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
