'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function SavingsProgress() {
    const savingsGoal = 5000;
    const monthlyIncome = 6500;
    const monthlyExpenses = 3120.45;
    const amountSaved = monthlyIncome - monthlyExpenses;
    const savingsPercentage = monthlyIncome > 0 ? (amountSaved / monthlyIncome) * 100 : 0;
    const goalProgress = savingsGoal > 0 ? (amountSaved / savingsGoal) * 100 : 0;
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Savings Progress</CardTitle>
                <CardDescription>Your saving activity this month.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <>
                    <div className="flex justify-between text-lg font-medium">
                        <span>Saved this month</span>
                        <span className={amountSaved >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(amountSaved)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Monthly Income</span>
                        <span>{formatCurrency(monthlyIncome)}</span>
                    </div>
                         <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Savings Rate</span>
                            <span>{savingsPercentage.toFixed(1)}%</span>
                        </div>
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Monthly Goal</span>
                            <span className="text-sm text-muted-foreground">{formatCurrency(savingsGoal)}</span>
                        </div>
                        <Progress value={goalProgress} />
                    </div>
                </>
            </CardContent>
        </Card>
    )
}
