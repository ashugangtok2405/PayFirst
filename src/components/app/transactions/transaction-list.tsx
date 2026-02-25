'use client'

import { useMemo } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { Landmark, Fuel, ShoppingBag, CircleDollarSign, PiggyBank, Utensils, Tv, Car, ArrowDown, ArrowUp, ArrowRightLeft, CreditCard as CreditCardIcon, Edit, Trash2, PlusCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useUser, useFirestore } from '@/firebase'
import { doc, runTransaction as runFirestoreTransaction } from 'firebase/firestore'
import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'

import type { Transaction, Category } from '@/lib/types'

const categoryIcons: { [key: string]: React.ElementType } = {
  'Groceries': ShoppingBag, 'Transport': Car, 'Entertainment': Tv, 'Bills': Landmark, 'Food': Utensils, 'Shopping': ShoppingBag,
  'Utilities': Landmark, 'Rent': Landmark, 'Investment': PiggyBank, 'Fuel': Fuel, 'Salary': CircleDollarSign, 'Freelance': CircleDollarSign,
  'Other': CircleDollarSign, 'default': CircleDollarSign,
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)
}

interface TransactionListProps {
    transactions: Transaction[],
    categories: Category[],
    accounts: {id: string, name: string}[],
}

export function TransactionList({ transactions, categories, accounts }: TransactionListProps) {
    const { toast } = useToast()
    const { user } = useUser()
    const firestore = useFirestore()

    const categoryMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat;
            return acc;
        }, {} as Record<string, Category>);
    }, [categories]);

    const accountMap = useMemo(() => {
        return accounts.reduce((acc, accnt) => {
            acc[accnt.id] = accnt.name;
            return acc;
        }, {} as Record<string, string>);
    }, [accounts]);
    
    const groupedTransactions = useMemo(() => {
        return transactions.reduce((acc, transaction) => {
            const date = parseISO(transaction.transactionDate);
            let group: string;
            if (isToday(date)) {
                group = 'Today';
            } else if (isYesterday(date)) {
                group = 'Yesterday';
            } else {
                group = format(date, 'MMMM yyyy');
            }

            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(transaction);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [transactions]);

    const handleDelete = async (transaction: Transaction) => {
        if (!user || !firestore) return;
        
        try {
            await runFirestoreTransaction(firestore, async (tx) => {
                const txRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
                
                const amount = transaction.amount;
                // Reverse expense from bank
                if(transaction.type === 'expense' && transaction.fromBankAccountId) {
                    const accRef = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.fromBankAccountId);
                    const accDoc = await tx.get(accRef);
                    if(accDoc.exists()) tx.update(accRef, { currentBalance: accDoc.data().currentBalance + amount });
                }
                // Reverse expense from card
                if(transaction.type === 'expense' && transaction.fromCreditCardId) {
                    const cardRef = doc(firestore, 'users', user.uid, 'creditCards', transaction.fromCreditCardId);
                    const cardDoc = await tx.get(cardRef);
                    if(cardDoc.exists()) tx.update(cardRef, { currentBalance: cardDoc.data().currentBalance - amount });
                }
                // Reverse income
                if(transaction.type === 'income' && transaction.toBankAccountId) {
                    const accRef = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.toBankAccountId);
                    const accDoc = await tx.get(accRef);
                    if(accDoc.exists()) tx.update(accRef, { currentBalance: accDoc.data().currentBalance - amount });
                }
                // Reverse transfer
                if(transaction.type === 'transfer' && transaction.fromBankAccountId && transaction.toBankAccountId) {
                    const fromAccRef = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.fromBankAccountId);
                    const fromAccDoc = await tx.get(fromAccRef);
                    if(fromAccDoc.exists()) tx.update(fromAccRef, { currentBalance: fromAccDoc.data().currentBalance + amount });

                    const toAccRef = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.toBankAccountId);
                    const toAccDoc = await tx.get(toAccRef);
                    if(toAccDoc.exists()) tx.update(toAccRef, { currentBalance: toAccDoc.data().currentBalance - amount });
                }
                // Reverse credit card payment
                if(transaction.type === 'credit_card_payment' && transaction.fromBankAccountId && transaction.toCreditCardId) {
                    const fromAccRef = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.fromBankAccountId);
                    const fromAccDoc = await tx.get(fromAccRef);
                    if(fromAccDoc.exists()) tx.update(fromAccRef, { currentBalance: fromAccDoc.data().currentBalance + amount });

                    const toCardRef = doc(firestore, 'users', user.uid, 'creditCards', transaction.toCreditCardId);
                    const toCardDoc = await tx.get(toCardRef);
                    if(toCardDoc.exists()) tx.update(toCardRef, { currentBalance: toCardDoc.data().currentBalance + amount });
                }

                tx.delete(txRef);
            });
            toast({ title: "Transaction Deleted", description: "The transaction has been removed and account balances updated." });
        } catch(error: any) {
            console.error("Failed to delete transaction:", error);
            toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
        }
    }

    if (transactions.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <h3 className="text-xl font-semibold">No transactions found</h3>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters or adding a new transaction.</p>
                    <AddTransactionDialog>
                        <Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/>Add Your First Transaction</Button>
                    </AddTransactionDialog>
                </CardContent>
            </Card>
        )
    }

    const TransactionTypeIcon = ({ type }: { type: Transaction['type']}) => {
        switch (type) {
            case 'income': return <ArrowUp className="size-4 text-green-500"/>
            case 'expense': return <ArrowDown className="size-4 text-red-500"/>
            case 'transfer': return <ArrowRightLeft className="size-4 text-blue-500"/>
            case 'credit_card_payment': return <CreditCardIcon className="size-4 text-orange-500"/>
            default: return null
        }
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([group, txs]) => (
                <div key={group}>
                    <h2 className="text-lg font-semibold mb-2 px-1">{group}</h2>
                    <Card>
                        <CardContent className="p-0">
                             <Accordion type="multiple" className="w-full">
                                {txs.map((tx) => {
                                    const category = tx.categoryId ? categoryMap[tx.categoryId] : null;
                                    const CategoryIcon = category ? (categoryIcons[category.name] || categoryIcons.default) : CircleDollarSign;
                                    const isIncome = tx.type === 'income';
                                    const isTransfer = tx.type === 'transfer' || tx.type === 'credit_card_payment';
                                    
                                    let amountSign = '-';
                                    let amountColor = 'text-foreground';

                                    if (isIncome) {
                                        amountSign = '+';
                                        amountColor = 'text-green-600';
                                    } else if (tx.type === 'expense') {
                                        amountSign = '-';
                                        amountColor = 'text-red-600';
                                    } else if (isTransfer) {
                                        amountSign = '';
                                        amountColor = 'text-blue-600';
                                    }
                                    
                                    let accountName = 'N/A'
                                    if (tx.type === 'transfer') {
                                        accountName = `From ${accountMap[tx.fromBankAccountId!] ?? '?'} to ${accountMap[tx.toBankAccountId!] ?? '?'}`
                                    } else if (tx.type === 'credit_card_payment') {
                                        accountName = `From ${accountMap[tx.fromBankAccountId!] ?? '?'} to ${accountMap[tx.toCreditCardId!] ?? '?'}`
                                    } else if (tx.fromBankAccountId) {
                                        accountName = accountMap[tx.fromBankAccountId] ?? 'Unknown Account'
                                    } else if(tx.toBankAccountId) {
                                        accountName = accountMap[tx.toBankAccountId] ?? 'Unknown Account'
                                    } else if(tx.fromCreditCardId) {
                                        accountName = accountMap[tx.fromCreditCardId] ?? 'Unknown Card'
                                    }
                                    
                                    return (
                                        <AccordionItem value={tx.id} key={tx.id} className="border-b last:border-b-0">
                                            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline rounded-lg">
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="bg-muted p-2 rounded-full"><CategoryIcon className="size-5 text-muted-foreground" /></div>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-semibold">{tx.description}</p>
                                                        <p className="text-sm text-muted-foreground">{accountName}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`font-bold ${amountColor}`}>{amountSign}{formatCurrency(tx.amount)}</p>
                                                        <p className="text-sm text-muted-foreground">{format(parseISO(tx.transactionDate), 'MMM dd')}</p>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 pb-4 bg-muted/30">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4">
                                                    <div><Badge variant="outline" className="capitalize flex gap-2 items-center"><TransactionTypeIcon type={tx.type} /> {tx.type.replace(/_/g, ' ')}</Badge></div>
                                                    <div><p className="text-muted-foreground">Category</p><p className="font-medium">{category?.name || 'N/A'}</p></div>
                                                    <div>
                                                        <p className="text-muted-foreground">From</p>
                                                        <p className="font-medium">{tx.fromBankAccountId ? accountMap[tx.fromBankAccountId] : (tx.fromCreditCardId ? accountMap[tx.fromCreditCardId] : 'N/A')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">To</p>
                                                        <p className="font-medium">{tx.toBankAccountId ? accountMap[tx.toBankAccountId] : (tx.toCreditCardId ? accountMap[tx.toCreditCardId] : 'N/A')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-4">
                                                    <Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete the transaction and update linked account balances. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(tx)}>Confirm Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )
                                })}
                             </Accordion>
                        </CardContent>
                    </Card>
                </div>
            ))}
        </div>
    )
}
