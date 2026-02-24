'use client'

import { Landmark, Fuel, ShoppingBag, CircleDollarSign, PiggyBank, Utensils, Tv, Car } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category } from '@/lib/types'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const categoryIcons: { [key: string]: React.ElementType } = {
  'Groceries': ShoppingBag,
  'Transport': Car,
  'Entertainment': Tv,
  'Bills': Landmark,
  'Food': Utensils,
  'Shopping': ShoppingBag,
  'Utilities': Landmark,
  'Rent': Landmark,
  'Investment': PiggyBank,
  'Fuel': Fuel,
  'Others': CircleDollarSign,
  'default': CircleDollarSign,
};

const categoryColors: { [key: string]: string } = {
    'Groceries': 'bg-green-500',
    'Transport': 'bg-blue-500',
    'Entertainment': 'bg-purple-500',
    'Bills': 'bg-red-500',
    'Food': 'bg-orange-500',
    'Shopping': 'bg-pink-500',
    'Utilities': 'bg-yellow-500',
    'Rent': 'bg-red-600',
    'Investment': 'bg-indigo-500',
    'Fuel': 'bg-gray-500',
    'Others': 'bg-gray-400',
    'default': 'bg-gray-400'
}


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function CategoryBreakdown() {
    const firestore = useFirestore()
    const { user } = useUser()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null, [firestore, user]);
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

    const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user])
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

    const isLoading = loadingTransactions || loadingCategories

    const categoryBreakdown = useMemo(() => {
        if (!transactions || !categories) return [];

        const categoryMap = categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>);

        const expenses = transactions.filter(t => t.type === 'expense');
        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

        if (totalExpenses === 0) return [];

        const breakdown = expenses.reduce((acc, t) => {
            const categoryName = t.categoryId ? categoryMap[t.categoryId] : 'Others';
            if (!acc[categoryName]) {
                acc[categoryName] = 0;
            }
            acc[categoryName] += t.amount;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(breakdown).map(([name, amount]) => ({
            name,
            amount,
            percentage: Math.round((amount / totalExpenses) * 100),
            icon: categoryIcons[name] || categoryIcons.default,
            color: categoryColors[name] || categoryColors.default
        })).sort((a,b) => b.amount - a.amount);

    }, [transactions, categories])


    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="size-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : categoryBreakdown.length > 0 ? (
                    categoryBreakdown.map((category) => {
                        const Icon = category.icon
                        return (
                            <div key={category.name} className="flex items-center gap-4">
                                <div className={`flex items-center justify-center size-10 rounded-full ${category.color}`}>
                                    <Icon className="size-5 text-white" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{category.name}</span>
                                        <span className="font-semibold">{formatCurrency(category.amount)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <Progress value={category.percentage} indicatorClassName={category.color} className="h-2 w-2/3" />
                                        <span>{category.percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No expenses recorded this month.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
