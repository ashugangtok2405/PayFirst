'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, BadgeIndianRupee, Banknote } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Loan } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

export function LoanSummary() {
  const firestore = useFirestore()
  const { user } = useUser()

  const loansQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'loans') : null, [firestore, user?.uid])
  const { data: loans, isLoading: loadingLoans } = useCollection<Loan>(loansQuery)

  const { totalOriginal, totalOutstanding, totalEmi } = useMemo(() => {
    if (!loans) return { totalOriginal: 0, totalOutstanding: 0, totalEmi: 0 };
    
    const activeLoans = loans.filter(l => l.active);
    const totalOriginal = activeLoans.reduce((sum, loan) => sum + loan.originalAmount, 0);
    const totalOutstanding = activeLoans.reduce((sum, loan) => sum + loan.outstanding, 0);
    const totalEmi = activeLoans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    
    return { totalOriginal, totalOutstanding, totalEmi };
  }, [loans]);


  const summaryData = [
    { title: 'Total Sanctioned', value: totalOriginal, icon: Banknote },
    { title: 'Total Outstanding', value: totalOutstanding, icon: FileText },
    { title: 'Total Monthly EMI', value: totalEmi, icon: BadgeIndianRupee },
  ]
  
  const isLoading = loadingLoans

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
                <p className="text-xs text-muted-foreground">Across all active loans</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
