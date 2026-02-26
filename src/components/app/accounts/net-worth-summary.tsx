'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Landmark, CreditCard } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, CreditCard as CreditCardType, Loan, PersonalDebt } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function NetWorthSummary() {
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user?.uid])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCardType>(creditCardsQuery)

  const loansQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'loans') : null, [firestore, user?.uid])
  const { data: loans, isLoading: loadingLoans } = useCollection<Loan>(loansQuery)

  const personalDebtsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'personalDebts') : null, [firestore, user?.uid])
  const { data: personalDebts, isLoading: loadingPersonalDebts } = useCollection<PersonalDebt>(personalDebtsQuery)

  const totalAssets = (bankAccounts?.reduce((acc, account) => acc + account.currentBalance, 0) ?? 0)
    + (personalDebts?.filter(d => d.type === 'lent' && d.status === 'active').reduce((acc, debt) => acc + debt.remainingAmount, 0) ?? 0)

  const totalLiabilities = (creditCards?.reduce((acc, card) => acc + card.currentBalance, 0) ?? 0) 
    + (loans?.reduce((acc, loan) => acc + loan.outstanding, 0) ?? 0)
    + (personalDebts?.filter(d => d.type === 'borrowed' && d.status === 'active').reduce((acc, debt) => acc + debt.remainingAmount, 0) ?? 0)
  
  const netWorth = totalAssets - totalLiabilities

  const summaryData = [
    { title: 'Total Assets', value: totalAssets, icon: Landmark },
    { title: 'Total Liabilities', value: totalLiabilities, icon: CreditCard },
    { title: 'Net Worth', value: netWorth, icon: Wallet },
  ]
  
  const isLoading = loadingBankAccounts || loadingCreditCards || loadingLoans || loadingPersonalDebts

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
                <p className="text-xs text-muted-foreground">Updated just now</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
