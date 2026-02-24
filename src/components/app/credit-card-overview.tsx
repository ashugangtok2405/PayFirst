'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { CreditCard } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function CreditCardOverview() {
    const firestore = useFirestore()
    const { user } = useUser()

    const creditCardsQuery = useMemoFirebase(
        () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
        [firestore, user]
    )
    const { data: creditCards, isLoading } = useCollection<CreditCard>(creditCardsQuery)

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
                {isLoading && Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                ))}
                {!isLoading && creditCards?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">No credit cards added yet.</p>
                )}
                {!isLoading && creditCards?.map(card => {
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
