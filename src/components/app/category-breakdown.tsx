'use client'

import { Landmark, Fuel, ShoppingBag, CircleDollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const categories = [
  { name: 'EMI', amount: 24800, percentage: 27, icon: Landmark, color: 'bg-green-500' },
  { name: 'Investment', amount: 16200, percentage: 54, icon: CircleDollarSign, color: 'bg-orange-500' },
  { name: 'Fuel', amount: 12400, percentage: 14, icon: Fuel, color: 'bg-blue-500' },
  { name: 'Shopping', amount: 6800, percentage: 13, icon: ShoppingBag, color: 'bg-sky-500' },
  { name: 'Others', amount: 3200, percentage: 5, icon: CircleDollarSign, color: 'bg-red-500' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function CategoryBreakdown() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {categories.map((category) => {
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
                })}
            </CardContent>
        </Card>
    )
}
