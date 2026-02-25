'use client'

import { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth } from 'date-fns'

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import type { Transaction, Category, BankAccount, CreditCard } from '@/lib/types'

import { SummaryCards } from '@/components/app/transactions/summary-cards'
import { TransactionFilters } from '@/components/app/transactions/transaction-filters'
import { TransactionList } from '@/components/app/transactions/transaction-list'
import { Skeleton } from '@/components/ui/skeleton'

export default function TransactionsPage() {
  // State for filters
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [typeFilter, setTypeFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Firestore data fetching
  const { user } = useUser()
  const firestore = useFirestore()

  const transactionsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('transactionDate', 'desc')) : null,
    [firestore, user]
  )
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const categoriesQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'categories') : null,
    [firestore, user]
  )
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

  const bankAccountsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null,
    [firestore, user]
  )
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
    [firestore, user]
  )
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
            const transactionDate = new Date(t.transactionDate);
            if (isNaN(transactionDate.getTime())) return false; // Invalid date
            
            const dateMatch = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
            const typeMatch = typeFilter === 'all' || t.type === typeFilter;
            
            const accountMatch = accountFilter === 'all' || 
                t.fromBankAccountId === accountFilter || 
                t.toBankAccountId === accountFilter ||
                t.fromCreditCardId === accountFilter ||
                t.toCreditCardId === accountFilter;

            const searchMatch = searchTerm === '' ||
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.amount.toString().includes(searchTerm) ||
                categories?.find(c => c.id === t.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase());

            return dateMatch && typeMatch && accountMatch && searchMatch;
        } catch (e) {
            return false;
        }
    });
  }, [transactions, dateRange, typeFilter, accountFilter, searchTerm, categories])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-semibold">Transactions</h1>
            <p className="text-muted-foreground">View and manage your financial activity.</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>
            <Skeleton className="h-16 rounded-xl" />
             <div className="space-y-4">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
            </div>
        </div>
      ) : (
        <>
            <SummaryCards transactions={filteredTransactions} />
            <TransactionFilters
                accounts={accounts}
                categories={categories ?? []}
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
            />
        </>
      )}
    </div>
  )
}
