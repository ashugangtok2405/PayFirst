'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, CreditCard, WalletCards } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { CreditCard as CreditCardType } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function CreditCardSummary() {
  const firestore = useFirestore()
  const { user } = useUser()

  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user?.uid])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCardType>(creditCardsQuery)

  const { totalLimit, totalOutstanding, totalAvailable } = useMemo(() => {
    if (!creditCards) return { totalLimit: 0, totalOutstanding: 0, totalAvailable: 0 };
    
    const totalLimit = creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
    const totalOutstanding = creditCards.reduce((sum, card) => sum + card.currentBalance, 0);
    const totalAvailable = totalLimit - totalOutstanding;
    
    return { totalLimit, totalOutstanding, totalAvailable };
  }, [creditCards]);


  const summaryData = [
    { title: 'Total Limit', value: totalLimit, icon: Landmark },
    { title: 'Total Used', value: totalOutstanding, icon: CreditCard },
    { title: 'Total Available', value: totalAvailable, icon: WalletCards },
  ]
  
  const isLoading = loadingCreditCards

  if (isLoading) {
      return (
          <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-5 rounded-full" />
                      </CardHeader>
                      <CardContent>
                          <Skeleton className="h-8 w-36 mt-2" />
                          <Skeleton className="h-3 w-28 mt-2" />
                      </CardContent>
                  </Card>
              ))}
          </div>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {summaryData.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <Icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(item.value)}</div>
                <p className="text-xs text-muted-foreground">Across all cards</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
