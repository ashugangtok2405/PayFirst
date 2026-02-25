'use client'

import { useMemo } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { Landmark, Fuel, ShoppingBag, CircleDollarSign, PiggyBank, Utensils, Tv, Car, ArrowDown, ArrowUp, ArrowRightLeft, CreditCard as CreditCardIcon, Edit, Trash2, PlusCircle, Percent } from 'lucide-react'

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
    totalIncome: number,
}

const TransactionTypeBadge = ({ type }: { type: Transaction['type']}) => {
    const config = {
        income: { icon: ArrowUp, color: 'text-green-700 bg-green-50 border-green-200', label: 'Income' },
        expense: { icon: ArrowDown, color: 'text-red-700 bg-red-50 border-red-200', label: 'Expense' },
        transfer: { icon: ArrowRightLeft, color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Transfer' },
        credit_card_payment: { icon: CreditCardIcon, color: 'text-orange-700 bg-orange-50 border-orange-200', label: 'Payment' },
    }[type] || { icon: CircleDollarSign, color: 'text-gray-700 bg-gray-50 border-gray-200', label: 'Transaction'}

    const Icon = config.icon;
    return (
        <Badge variant="outline" className={`capitalize text-xs font-normal gap-1.5 pl-1.5 pr-2 ${config.color}`}>
            <Icon className="size-3" /> 
            {config.label}
        </Badge>
    )
}

export function TransactionList({ transactions, categories, accounts, totalIncome }: TransactionListProps) {
    const { toast } = useToast()
    const { user } = useUser()
    const firestore = useFirestore()

    const categoryMap = useMemo(() => categories.reduce((acc, cat) => ({...acc, [cat.id]: cat }), {} as Record<string, Category>), [categories]);
    const accountMap = useMemo(() => accounts.reduce((acc, accnt) => ({...acc, [accnt.id]: accnt.name }), {} as Record<string, string>), [accounts]);
    
    const groupedTransactions = useMemo(() => {
        return transactions.reduce((acc, transaction) => {
            const date = parseISO(transaction.transactionDate);
            const group = format(date, 'yyyy-MM-dd');

            if (!acc[group]) acc[group] = [];
            acc[group].push(transaction);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [transactions]);
    
    const sortedGroups = useMemo(() => Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a)), [groupedTransactions]);

    const getGroupTitle = (group: string) => {
        const date = parseISO(group);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'E, dd MMM yyyy');
    }

    const handleDelete = async (transaction: Transaction) => {
        if (!user || !firestore) return;
        
        try {
            await runFirestoreTransaction(firestore, async (tx) => {
                const txRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
                const amount = transaction.amount;
                // Reverse operations based on type
                if(transaction.fromBankAccountId) {
                    const ref = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.fromBankAccountId);
                    const accDoc = await tx.get(ref);
                    if(accDoc.exists()) tx.update(ref, { currentBalance: accDoc.data().currentBalance + amount });
                }
                if(transaction.toBankAccountId) {
                    const ref = doc(firestore, 'users', user.uid, 'bankAccounts', transaction.toBankAccountId);
                    const accDoc = await tx.get(ref);
                    if(accDoc.exists()) tx.update(ref, { currentBalance: accDoc.data().currentBalance - amount });
                }
                if(transaction.fromCreditCardId) {
                    const ref = doc(firestore, 'users', user.uid, 'creditCards', transaction.fromCreditCardId);
                    const cardDoc = await tx.get(ref);
                    if(cardDoc.exists()) tx.update(ref, { currentBalance: cardDoc.data().currentBalance - amount });
                }
                if(transaction.toCreditCardId) {
                    const ref = doc(firestore, 'users', user.uid, 'creditCards', transaction.toCreditCardId);
                    const cardDoc = await tx.get(ref);
                    if(cardDoc.exists()) tx.update(ref, { currentBalance: cardDoc.data().currentBalance + amount });
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
            <Card><CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold">No transactions found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your filters or adding a new transaction.</p>
                <AddTransactionDialog><Button className="mt-4"><PlusCircle className="mr-2 h-4 w-4"/>Add Your First Transaction</Button></AddTransactionDialog>
            </CardContent></Card>
        )
    }

    return (
        <div className="space-y-6">
            {sortedGroups.map(group => {
                const txs = groupedTransactions[group];
                const groupIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                const groupExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                const groupNet = groupIncome - groupExpense;

                return (
                    <div key={group}>
                        <div className="flex justify-between items-baseline mb-2 px-2 py-1 bg-muted/60 rounded-md">
                            <h2 className="text-base font-semibold">{getGroupTitle(group)}</h2>
                            <div className="text-sm font-semibold text-right">
                                {groupExpense > 0 && <span className="text-red-500">-{formatCurrency(groupExpense)}</span>}
                                {groupIncome > 0 && groupExpense > 0 && <span className="text-muted-foreground mx-1.5">/</span>}
                                {groupIncome > 0 && <span className="text-green-500">+{formatCurrency(groupIncome)}</span>}
                                {groupNet !== 0 && groupIncome > 0 && groupExpense > 0 && (
                                    <span className={`ml-2.5 ${groupNet > 0 ? 'text-blue-500' : 'text-orange-500'}`}>({formatCurrency(groupNet)})</span>
                                )}
                            </div>
                        </div>
                        <Card>
                            <CardContent className="p-0">
                                <Accordion type="multiple" className="w-full">
                                    {txs.map((tx) => {
                                        const category = tx.categoryId ? categoryMap[tx.categoryId] : null;
                                        const CategoryIcon = category ? (categoryIcons[category.name] || categoryIcons.default) : CircleDollarSign;
                                        const percentageOfIncome = totalIncome > 0 && tx.type === 'expense' ? (tx.amount / totalIncome) * 100 : 0;
                                        
                                        const amountConfig = {
                                            income: { sign: '+', color: 'text-green-600' },
                                            expense: { sign: '-', color: 'text-red-600' },
                                            transfer: { sign: '', color: 'text-blue-600' },
                                            credit_card_payment: { sign: '', color: 'text-orange-600' },
                                        }[tx.type] || { sign: '', color: 'text-foreground' };

                                        let accountName = 'N/A'
                                        if (tx.type === 'transfer') accountName = `From ${accountMap[tx.fromBankAccountId!] ?? '?'} to ${accountMap[tx.toBankAccountId!] ?? '?'}`
                                        else if (tx.type === 'credit_card_payment') accountName = `From ${accountMap[tx.fromBankAccountId!] ?? '?'} to ${accountMap[tx.toCreditCardId!] ?? '?'}`
                                        else if (tx.fromBankAccountId) accountName = accountMap[tx.fromBankAccountId] ?? '?'
                                        else if (tx.toBankAccountId) accountName = accountMap[tx.toBankAccountId] ?? '?'
                                        else if (tx.fromCreditCardId) accountName = accountMap[tx.fromCreditCardId] ?? '?'
                                        
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
                                                            <p className={`font-bold text-lg ${amountConfig.color}`}>{amountConfig.sign}{formatCurrency(tx.amount)}</p>
                                                            {tx.type === 'expense' && percentageOfIncome > 0.1 && (
                                                                <Badge variant="outline" className="font-normal text-xs mt-1 border-none p-0 text-muted-foreground">
                                                                    {percentageOfIncome.toFixed(1)}% of income
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4 bg-muted/30">
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm pt-4">
                                                        <div><p className="text-muted-foreground">Type</p><p className="font-medium"><TransactionTypeBadge type={tx.type} /></p></div>
                                                        <div><p className="text-muted-foreground">Date</p><p className="font-medium">{format(parseISO(tx.transactionDate), 'dd MMM yyyy, hh:mm a')}</p></div>
                                                        <div><p className="text-muted-foreground">Category</p><p className="font-medium">{category?.name || 'N/A'}</p></div>
                                                        {tx.type === 'expense' && percentageOfIncome > 0 && (
                                                            <div><p className="text-muted-foreground">% of Income</p><p className="font-medium flex items-center"><Percent className="size-3 mr-1" /> {percentageOfIncome.toFixed(1)}%</p></div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-4">
                                                        <Button variant="ghost" size="sm"><Edit className="mr-2 h-4 w-4"/> Edit</Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="mr-2 h-4 w-4"/> Delete</Button></AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the transaction and update linked account balances. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                                                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(tx)}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
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
                )
            })}
        </div>
    )
}
