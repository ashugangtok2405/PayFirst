'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ShoppingBag, Utensils, Car } from 'lucide-react'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

// MOCK DATA
const topExpensesData = [
  { name: 'Food & Dining', amount: 12500, percentage: 35, icon: Utensils, color: 'bg-orange-500' },
  { name: 'Shopping', amount: 8200, percentage: 23, icon: ShoppingBag, color: 'bg-pink-500' },
  { name: 'Transport', amount: 5600, percentage: 16, icon: Car, color: 'bg-blue-500' },
]

const totalExpenses = topExpensesData.reduce((sum, item) => sum + item.amount, 0)

export function TopExpenses() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Top Expenses</CardTitle>
        <CardDescription>Your biggest spending categories this month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {topExpensesData.map((category) => {
          const Icon = category.icon
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
                <Progress value={category.percentage} indicatorClassName={category.color} className="h-2 flex-1" />
                <span className="text-xs font-semibold w-10 text-right">{category.percentage}%</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
