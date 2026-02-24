'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const creditCards = [
    { id: '1', name: 'HDFC', balance: 24800, percentage: 45, color: 'bg-blue-600' },
    { id: '2', name: 'ICICI', balance: 16200, percentage: 54, color: 'bg-green-500' },
    { id: '3', name: 'SBI', balance: 12400, percentage: 31, color: 'bg-yellow-400' },
    { id: '4', name: 'Axis', balance: 14800, percentage: 74, color: 'bg-red-500' },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function CreditCardOverview() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Card Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {creditCards.map(card => (
                    <div key={card.id}>
                        <div className="flex items-center mb-2">
                             <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-xs mr-4">{card.name.substring(0,2)}</div>
                            <div className="flex-1">
                               <div className="flex justify-between font-medium">
                                    <span>{card.name}</span>
                                    <span>{formatCurrency(card.balance)}</span>
                               </div>
                            </div>
                            <div className="w-16 text-right text-sm text-muted-foreground">{card.percentage}%</div>
                        </div>
                        <Progress value={card.percentage} indicatorClassName={card.color} className="h-2"/>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
