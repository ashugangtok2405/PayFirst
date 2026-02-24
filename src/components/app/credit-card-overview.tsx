'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { CreditCard as CreditCardType } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function CreditCardOverview() {
    const firestore = useFirestore()
    const { user } = useUser()

    const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user])
    const { data: creditCards, isLoading } = useCollection<CreditCardType>(creditCardsQuery)

    const cardColors = ['bg-blue-600', 'bg-green-500', 'bg-yellow-400', 'bg-red-500'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Card Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                             <div key={i}>
                                <div className="flex items-center mb-2">
                                    <Skeleton className="w-10 h-10 rounded-full mr-4" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                    <Skeleton className="h-4 w-10" />
                                </div>
                                <Skeleton className="h-2 w-full" />
                            </div>
                        ))}
                    </div>
                ) : creditCards && creditCards.length > 0 ? (
                    creditCards.map((card, index) => {
                        const utilization = card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0;
                        return (
                        <div key={card.id}>
                            <div className="flex items-center mb-2">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-xs mr-4">{card.name.substring(0,2)}</div>
                                <div className="flex-1">
                                <div className="flex justify-between font-medium">
                                        <span>{card.name}</span>
                                        <span>{formatCurrency(card.currentBalance)}</span>
                                </div>
                                </div>
                                <div className="w-16 text-right text-sm text-muted-foreground">{utilization.toFixed(0)}%</div>
                            </div>
                            <Progress value={utilization} indicatorClassName={cardColors[index % cardColors.length]} className="h-2"/>
                        </div>
                    )})
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">No credit cards found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
