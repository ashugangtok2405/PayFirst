'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { startOfMonth } from 'date-fns'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, ArrowRightLeft, History, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc, query, orderBy } from 'firebase/firestore'
import type { BankAccount, Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { AddTransactionDialog } from '../add-transaction-dialog'
import { TransferMoneyDialog } from './transfer-money-dialog'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function BankAccounts() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()

  const bankAccountsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null,
    [firestore, user]
  )
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const transactionsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('transactionDate', 'desc')) : null,
    [firestore, user]
  );
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const handleDelete = (accountId: string, accountName: string) => {
    if (!user) return;
    
    const hasTransactions = transactions?.some(t => t.fromBankAccountId === accountId || t.toBankAccountId === accountId);
    if (hasTransactions) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: `Cannot delete "${accountName}" as it has associated transactions. Please reassign or delete them first.`,
      })
      return;
    }
    
    const docRef = doc(firestore, 'users', user.uid, 'bankAccounts', accountId)
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Bank Account Deleted',
      description: `${accountName} has been removed from your accounts.`,
    })
  }
  
  const isLoading = loadingBankAccounts || loadingTransactions;

  const monthlyTxs = useMemo(() => {
    if (!transactions) return [];
    const startOfMonthDate = new Date(monthStart);
    return transactions.filter(t => {
        try {
           return new Date(t.transactionDate) >= startOfMonthDate;
        } catch(e) { return false }
    });
  }, [transactions, monthStart]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
        ) : bankAccounts && bankAccounts.length > 0 ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
            {bankAccounts.map((account) => {
                const accountTransactions = transactions?.filter(t => t.fromBankAccountId === account.id || t.toBankAccountId === account.id).slice(0, 5) ?? [];
                
                const monthlyInflow = monthlyTxs.filter(t => t.toBankAccountId === account.id && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const monthlyOutflow = monthlyTxs.filter(t => t.fromBankAccountId === account.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

                return (
                <AccordionItem value={account.id} key={account.id} className="border-b-0">
                    <Card className="rounded-xl">
                        <div className="p-6">
                            <AccordionTrigger className="w-full p-0 hover:no-underline">
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-semibold">{account.name}</h4>
                                                <p className="text-sm text-muted-foreground">{account.bankName}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">{formatCurrency(account.currentBalance)}</p>
                                                <p className="text-xs text-muted-foreground">Updated just now</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-between text-sm">
                                            <div>
                                                <span className="text-muted-foreground">Inflow: </span>
                                                <span className="font-medium text-green-600">{formatCurrency(monthlyInflow)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Outflow: </span>
                                                <span className="font-medium text-red-600">{formatCurrency(monthlyOutflow)}</span>
                                            </div>
                                        </div>
                                    </div>
                            </AccordionTrigger>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <AddTransactionDialog>
                                    <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Transaction</Button>
                                </AddTransactionDialog>
                                <TransferMoneyDialog>
                                    <Button size="sm" variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer</Button>
                                </TransferMoneyDialog>
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={`/dashboard/transactions?accountFilter=${account.id}`}>
                                        <History className="mr-2 h-4 w-4" /> View History
                                    </Link>
                                </Button>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-500 hover:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your
                                        bank account "{account.name}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(account.id, account.name)}>
                                        Delete
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <AccordionContent className="px-6 pb-6">
                            <h5 className="font-semibold mb-2">Recent Transactions</h5>
                            {accountTransactions.length > 0 ? (
                                <Table>
                                    <TableBody>
                                        {accountTransactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <p className="font-medium">{tx.description}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleDateString()}</p>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${tx.type === 'income' || (tx.type === 'transfer' && tx.toBankAccountId === account.id) ? 'text-green-600' : 'text-red-600'}`}>
                                                {(tx.type === 'income' || (tx.type === 'transfer' && tx.toBankAccountId === account.id)) ? '+' : '-'}{formatCurrency(tx.amount)}
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent transactions for this account.</p>
                            )}
                        </AccordionContent>
                    </Card>
                </AccordionItem>
                )})}
            </Accordion>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No bank accounts found.</p>
            <p className="text-sm text-muted-foreground">Add a new account to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
