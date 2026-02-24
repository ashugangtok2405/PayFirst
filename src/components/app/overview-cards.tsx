'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, CreditCard, ShoppingCart, Scale } from 'lucide-react'

const overviewData = [
    { title: 'Total Available Balance', value: 142500, icon: Landmark, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { title: 'Total Credit Card', value: 68200, icon: CreditCard, color: 'text-red-500', bgColor: 'bg-red-100' },
    { title: 'This Month Expenses', value: 54300, icon: ShoppingCart, color: 'text-green-500', bgColor: 'bg-green-100' },
    { title: 'Net Position', value: 74300, icon: Scale, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
]

export function OverviewCards() {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewData.map((item, index) => {
                const Icon = item.icon
                return (
                    <Card key={index}>
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={`flex items-center justify-center size-12 rounded-lg ${item.bgColor}`}>
                                <Icon className={`size-6 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{item.title}</p>
                                <p className="text-2xl font-bold">{formatCurrency(item.value)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
