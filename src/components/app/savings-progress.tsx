'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp } from 'lucide-react'

export function SavingsProgress() {
    const monthlyIncome = 80000;
    const savedThisMonth = 12000;
    const goal = 16000;

    const goalProgress = goal > 0 ? (savedThisMonth / goal) * 100 : 0;
    const leftToGo = goal - savedThisMonth;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Savings Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Income</span>
                    <span className="font-semibold">{formatCurrency(monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Saved this month</span>
                    <span className="font-semibold">{formatCurrency(savedThisMonth)}</span>
                </div>
                
                <Progress value={goalProgress} className="h-4 rounded-full" indicatorClassName="bg-green-500 rounded-full" />

                <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-medium">
                        {`+${formatCurrency(leftToGo)} to go`}
                    </span>
                    <span className="text-muted-foreground flex items-center">
                        Goal: {formatCurrency(goal)} <TrendingUp className="ml-1 h-4 w-4 text-green-500" />
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
