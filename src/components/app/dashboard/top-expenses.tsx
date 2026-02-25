'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ShoppingBag, Utensils, Car, Tv, Landmark, Fuel, CircleDollarSign, PiggyBank } from 'lucide-react'

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category } from '@/lib/types'
import { startOfMonth } from 'date-fns'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

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
    'Salary': CircleDollarSign,
    'Freelance': CircleDollarSign,
    'Other': CircleDollarSign,
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
    'Salary': 'bg-teal-500',
    'Freelance': 'bg-cyan-500',
    'Other': 'bg-gray-400',
    'default': 'bg-gray-400'
}


export function TopExpenses() {
    const { user } = useUser()
    const firestore = useFirestore()

    const startOfCurrentMonth = useMemo(() => startOfMonth(new Date()), [])

    const transactionsQuery = useMemoFirebase(
        () => user ? query(
            collection(firestore, 'users', user.uid, 'transactions'),
            where('transactionDate', '>=', startOfCurrentMonth.toISOString())
        ) : null,
        [firestore, user, startOfCurrentMonth]
    )
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)
    
    const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user])
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

    const isLoading = loadingTransactions || loadingCategories

    const topExpenses = useMemo(() => {
        if (!transactions || transactions.length === 0 || !categories) return [];

        const expenseTransactions = transactions.filter(t => t.type === 'expense');

        if (expenseTransactions.length === 0) return [];

        const categoryMap = categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>);

        const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

        const breakdown = expenseTransactions.reduce((acc, t) => {
            const categoryName = t.categoryId ? categoryMap[t.categoryId] : 'Other';
            if (categoryName) {
                if (!acc[categoryName]) {
                    acc[categoryName] = 0;
                }
                acc[categoryName] += t.amount;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(breakdown)
            .map(([name, amount]) => ({
                name,
                amount,
                percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3);

    }, [transactions, categories])


    const renderLoading = () => (
        <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-3 w-10" />
                    </div>
                </div>
            ))}
        </div>
    );

    const renderEmpty = () => (
        <div className="text-center py-10">
            <p className="text-muted-foreground">No expenses recorded this month.</p>
        </div>
    );

    const renderContent = () => (
        <div className="space-y-6">
            {topExpenses && topExpenses.map((category) => {
                const Icon = categoryIcons[category.name] || categoryIcons.default
                const color = categoryColors[category.name] || categoryColors.default
                return (
                <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{category.name}</span>
                        </div>
                        <span>{formatCurrency(category.amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Progress value={category.percentage} indicatorClassName={color} className="h-2 flex-1" />
                        <span className="text-xs font-semibold w-10 text-right">{category.percentage.toFixed(0)}%</span>
                    </div>
                </div>
                )
            })}
        </div>
    )

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Top Expenses</CardTitle>
        <CardDescription>Your biggest spending categories this month.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? renderLoading() : !topExpenses || topExpenses.length === 0 ? renderEmpty() : renderContent()}
      </CardContent>
    </Card>
  )
}
