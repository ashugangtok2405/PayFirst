'use client'

import { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns'

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import type { Transaction, Category, BankAccount, CreditCard } from '@/lib/types'

import { SummaryCards } from '@/components/app/transactions/summary-cards'
import { TransactionFilters } from '@/components/app/transactions/transaction-filters'
import { TransactionList } from '@/components/app/transactions/transaction-list'
import { SmartInsights } from '@/components/app/transactions/smart-insights'
import { Skeleton } from '@/components/ui/skeleton'

export default function TransactionsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [typeFilter, setTypeFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { user } = useUser()
  const firestore = useFirestore()

  const transactionsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('transactionDate', 'desc')) : null,
    [firestore, user]
  )
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user])
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)

  const isLoading = loadingTransactions || loadingCategories || loadingBankAccounts || loadingCreditCards

  const accounts = useMemo(() => {
    if (!bankAccounts || !creditCards) return []
    return [
      ...bankAccounts.map(a => ({ id: a.id, name: a.name, type: 'bank' })),
      ...creditCards.map(c => ({ id: c.id, name: c.name, type: 'card' }))
    ]
  }, [bankAccounts, creditCards])
  
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    return transactions.filter(t => {
      try {
        const transactionDate = new Date(t.transactionDate)
        const dateMatch = transactionDate >= dateRange.from && transactionDate <= dateRange.to
        const typeMatch = typeFilter === 'all' || t.type === typeFilter
        const accountMatch = accountFilter === 'all' || t.fromBankAccountId === accountFilter || t.toBankAccountId === accountFilter || t.fromCreditCardId === accountFilter || t.toCreditCardId === accountFilter
        const searchMatch = searchTerm === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.amount.toString().includes(searchTerm) || categories?.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
        return dateMatch && typeMatch && accountMatch && searchMatch
      } catch (e) { return false }
    })
  }, [transactions, dateRange, typeFilter, accountFilter, searchTerm, categories])

  const previousPeriodTransactions = useMemo(() => {
    if (!transactions) return []
    const diff = dateRange.to.getTime() - dateRange.from.getTime()
    const prevFrom = new Date(dateRange.from.getTime() - diff - (24 * 60 * 60 * 1000))
    const prevTo = new Date(dateRange.from.getTime() - (24 * 60 * 60 * 1000))
    return transactions.filter(t => {
      try {
        const transactionDate = new Date(t.transactionDate)
        return transactionDate >= prevFrom && transactionDate <= prevTo
      } catch (e) { return false }
    })
  }, [transactions, dateRange])

  const { currentSummary, previousSummary, daysInPeriod, previousDaysInPeriod } = useMemo(() => {
    const calculateSummary = (txs: Transaction[]) => ({
      income: txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
      net: txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    });

    const current = calculateSummary(filteredTransactions)
    const previous = calculateSummary(previousPeriodTransactions)
    
    const numDays = Math.max(1, (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24) + 1)
    
    const diff = dateRange.to.getTime() - dateRange.from.getTime()
    const prevNumDays = Math.max(1, diff / (1000 * 60 * 60 * 24) + 1)

    return { currentSummary: current, previousSummary: previous, daysInPeriod: numDays, previousDaysInPeriod: prevNumDays }
  }, [filteredTransactions, previousPeriodTransactions, dateRange])
  
  const averageDailySpend = currentSummary.expense / daysInPeriod;
  const previousAverageDailySpend = previousSummary.expense / previousDaysInPeriod;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="text-muted-foreground">Analyze and manage your financial activity.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          <SummaryCards 
            currentSummary={currentSummary}
            previousSummary={previousSummary}
            averageDailySpend={averageDailySpend}
            previousAverageDailySpend={previousAverageDailySpend}
          />
          <SmartInsights
            transactions={filteredTransactions}
            previousTransactions={previousPeriodTransactions}
            categories={categories ?? []}
            creditCards={creditCards ?? []}
            currentSummary={currentSummary}
          />
          <TransactionFilters
            accounts={accounts}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            accountFilter={accountFilter}
            setAccountFilter={setAccountFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
          <TransactionList 
            transactions={filteredTransactions}
            categories={categories ?? []}
            accounts={accounts}
            totalIncome={currentSummary.income}
          />
        </>
      )}
    </div>
  )
}
