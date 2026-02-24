'use client'

import {
  File,
  ListFilter,
} from "lucide-react"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { AddTransactionDialog } from "@/components/app/add-transaction-dialog"
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

function TransactionsTable({ type }: { type: 'all' | 'income' | 'expenses' }) {
    const firestore = useFirestore()
    const { user } = useUser()

    const transactionsQuery = useMemoFirebase(() => {
        if (!user) return null
        const baseQuery = collection(firestore, 'users', user.uid, 'transactions')
        if (type === 'all') {
            return baseQuery
        }
        return query(baseQuery, where('type', '==', type === 'income' ? 'income' : 'expense'))
    }, [firestore, user, type])
    
    const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery)

    const categoriesQuery = useMemoFirebase(
      () => user ? collection(firestore, 'users', user.uid, 'categories') : null,
      [firestore, user]
    )
    const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery)

    const categoryMap = useMemo(() => {
        if (!categories) return new Map<string, string>()
        return new Map(categories.map(cat => [cat.id, cat.name]))
    }, [categories])

    const isLoading = isLoadingTransactions || isLoadingCategories

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    return (
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              A list of all your recent financial activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-8" /></TableCell>
                    </TableRow>
                ))}
                {!isLoading && transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.description}</TableCell>
                    <TableCell className="hidden md:table-cell">{categoryMap.get(transaction.categoryId) ?? 'Uncategorized'}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>{transaction.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-500' : ''}`}>
                      {transaction.type === 'income' ? '+$' : '-$'}{formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && transactions?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No transactions yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    )
}

export default function TransactionsPage() {
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Category</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>
                Amount
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <AddTransactionDialog />
        </div>
      </div>
      <TabsContent value="all">
        <TransactionsTable type="all" />
      </TabsContent>
      <TabsContent value="income">
         <TransactionsTable type="income" />
      </TabsContent>
      <TabsContent value="expenses">
         <TransactionsTable type="expenses" />
      </TabsContent>
    </Tabs>
  )
}
