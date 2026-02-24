'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const creditCards = [
    { id: '1', name: 'Visa Rewards', issuer: 'Chase', currentBalance: 1250.50, creditLimit: 5000 },
    { id: '2', name: 'Amex Gold', issuer: 'American Express', currentBalance: 800.10, creditLimit: 10000 },
    { id: '3', name: 'Mastercard Platinum', issuer: 'Citi', currentBalance: 400.00, creditLimit: 2500 },
];

export function CreditCardOverview() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    const getUsageColor = (usage: number) => {
        if (usage < 50) return 'bg-green-500'
        if (usage < 80) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Card Overview</CardTitle>
                <CardDescription>Your outstanding balances and credit utilization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {creditCards.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No credit cards added yet.</p>
                )}
                {creditCards.map(card => {
                    const usage = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0
                    return (
                        <div key={card.id}>
                            <div className="flex justify-between mb-1">
                                <span className="font-medium">{card.name} ({card.issuer})</span>
                                <span className="text-muted-foreground">{formatCurrency(card.currentBalance)} / {formatCurrency(card.creditLimit)}</span>
                            </div>
                            <Progress value={usage} indicatorClassName={getUsageColor(usage)} />
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
