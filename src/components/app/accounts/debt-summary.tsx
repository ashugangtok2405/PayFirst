'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownLeft, Scale } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { PersonalDebt } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function DebtSummary() {
  const firestore = useFirestore()
  const { user } = useUser()

  const personalDebtsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'personalDebts') : null, [firestore, user?.uid])
  const { data: personalDebts, isLoading: loadingDebts } = useCollection<PersonalDebt>(personalDebtsQuery)

  const { totalLent, totalBorrowed, netPosition } = useMemo(() => {
    if (!personalDebts) return { totalLent: 0, totalBorrowed: 0, netPosition: 0 };
    
    const activeDebts = personalDebts.filter(d => d.status === 'active');
    const totalLent = activeDebts.filter(d => d.type === 'lent').reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const totalBorrowed = activeDebts.filter(d => d.type === 'borrowed').reduce((sum, debt) => sum + debt.remainingAmount, 0);
    const netPosition = totalLent - totalBorrowed;
    
    return { totalLent, totalBorrowed, netPosition };
  }, [personalDebts]);


  const summaryData = [
    { title: 'Total You Lent', value: totalLent, icon: ArrowUpRight, className: 'text-green-600' },
    { title: 'Total You Borrowed', value: totalBorrowed, icon: ArrowDownLeft, className: 'text-red-600' },
    { title: 'Net Position', value: netPosition, icon: Scale, className: netPosition >= 0 ? 'text-blue-600' : 'text-orange-500' },
  ]
  
  const isLoading = loadingDebts

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
                <div className={cn("text-3xl font-bold", item.className)}>{formatCurrency(item.value)}</div>
                <p className="text-xs text-muted-foreground">
                    {item.title === 'Net Position' ? (item.value >= 0 ? 'You are net positive' : 'You are net negative') : 'Across all active debts'}
                </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
