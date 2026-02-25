'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PlusCircle,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
} from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase'
import { collection, doc, runTransaction } from 'firebase/firestore'
import type { BankAccount, CreditCard, Category, Transaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

type TransactionType = 'expense' | 'income' | 'transfer' | 'credit_card_payment'

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('expense')
  
  // Common state
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'dd/MM/yy'))
  const [notes, setNotes] = useState('')

  // Tab-specific state
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('') // For expense 'from' or income 'to'
  
  const [fromAccountId, setFromAccountId] = useState('') // For transfer 'from' & cc payment 'from'
  const [toAccountId, setToAccountId] = useState('') // For transfer 'to'
  const [toCreditCardId, setToCreditCardId] = useState('') // For cc payment 'to'

  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
  
  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user])
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

  const expenseCategories = useMemo(() => categories?.filter(c => c.type === 'expense') ?? [], [categories])
  const incomeCategories = useMemo(() => categories?.filter(c => c.type === 'income') ?? [], [categories])

  const isLoading = loadingBankAccounts || loadingCreditCards || loadingCategories

  const resetForm = useCallback(() => {
    setAmount('')
    setNotes('')
    setCategoryId('')
    setAccountId('')
    setFromAccountId('')
    setToAccountId('')
    setToCreditCardId('')
    setDate(format(new Date(), 'dd/MM/yy'))
  }, [])
  
  useEffect(() => {
    resetForm()
  }, [activeTab, resetForm])

  const handleSubmit = async () => {
    if (!user || !firestore || !date || !amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required fields.' })
      return
    }

    let parsedDate: Date;
    try {
        const dateParts = date.split('/');
        if (dateParts.length !== 3 || dateParts[2].length !== 2) throw new Error();
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2], 10) + 2000;
        parsedDate = new Date(year, month, day);
        if (isNaN(parsedDate.getTime())) throw new Error();
    } catch {
        toast({ variant: 'destructive', title: 'Invalid Date', description: 'Please use DD/MM/YY format.' });
        return;
    }
    
    const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
    const numericAmount = parseFloat(amount);

    try {
      await runTransaction(firestore, async (transaction) => {
        let transactionData: Partial<Transaction> = {
          userId: user.uid,
          type: activeTab,
          amount: numericAmount,
          transactionDate: parsedDate.toISOString(),
          description: notes || `New ${activeTab.replace('_', ' ')}`,
        }

        switch (activeTab) {
          case 'expense':
            if (!accountId || !categoryId) throw new Error("Account and category are required.");
            
            if (bankAccounts?.some(b => b.id === accountId)) {
              transactionData.fromBankAccountId = accountId;
              const accountRef = doc(firestore, 'users', user.uid, 'bankAccounts', accountId);
              const accountDoc = await transaction.get(accountRef);
              if (!accountDoc.exists()) throw new Error("Bank account not found.");
              const newBalance = accountDoc.data().currentBalance - numericAmount;
              transaction.update(accountRef, { currentBalance: newBalance, updatedAt: parsedDate.toISOString() });
            } else if (creditCards?.some(c => c.id === accountId)) {
              transactionData.fromCreditCardId = accountId;
              const cardRef = doc(firestore, 'users', user.uid, 'creditCards', accountId);
              const cardDoc = await transaction.get(cardRef);
              if (!cardDoc.exists()) throw new Error("Credit card not found.");
              const newBalance = cardDoc.data().currentBalance + numericAmount;
              transaction.update(cardRef, { currentBalance: newBalance, updatedAt: parsedDate.toISOString() });
            }
            transactionData.categoryId = categoryId
            break
        
          case 'income':
            if (!accountId || !categoryId) throw new Error("Account and source are required.");
            transactionData.toBankAccountId = accountId;
            const accountRef = doc(firestore, 'users', user.uid, 'bankAccounts', accountId);
            const accountDoc = await transaction.get(accountRef);
            if (!accountDoc.exists()) throw new Error("Bank account not found.");
            const newBalance = accountDoc.data().currentBalance + numericAmount;
            transaction.update(accountRef, { currentBalance: newBalance, updatedAt: parsedDate.toISOString() });
            transactionData.categoryId = categoryId;
            break
        
          case 'transfer':
            if (!fromAccountId || !toAccountId) throw new Error("Both 'from' and 'to' accounts are required.");
            if (fromAccountId === toAccountId) throw new Error("'From' and 'to' accounts cannot be the same.");
            transactionData.fromBankAccountId = fromAccountId;
            transactionData.toBankAccountId = toAccountId;
            
            const fromAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId);
            const fromAccountDoc = await transaction.get(fromAccountRef);
            if (!fromAccountDoc.exists()) throw new Error("Source account not found.");
            const newFromBalance = fromAccountDoc.data().currentBalance - numericAmount;
            transaction.update(fromAccountRef, { currentBalance: newFromBalance, updatedAt: parsedDate.toISOString() });

            const toAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', toAccountId);
            const toAccountDoc = await transaction.get(toAccountRef);
            if (!toAccountDoc.exists()) throw new Error("Destination account not found.");
            const newToBalance = toAccountDoc.data().currentBalance + numericAmount;
            transaction.update(toAccountRef, { currentBalance: newToBalance, updatedAt: parsedDate.toISOString() });
            break

          case 'credit_card_payment':
            if (!fromAccountId || !toCreditCardId) throw new Error("A source bank account and a credit card are required.");
            transactionData.fromBankAccountId = fromAccountId;
            transactionData.toCreditCardId = toCreditCardId;
            transactionData.description = notes || `Payment for ${creditCards?.find(c => c.id === toCreditCardId)?.name}`

            const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId);
            const bankAccountDoc = await transaction.get(bankAccountRef);
            if (!bankAccountDoc.exists()) throw new Error("Bank account not found.");
            const newBankBalance = bankAccountDoc.data().currentBalance - numericAmount;
            transaction.update(bankAccountRef, { currentBalance: newBankBalance, updatedAt: parsedDate.toISOString() });

            const cardRef = doc(firestore, 'users', user.uid, 'creditCards', toCreditCardId);
            const cardDoc = await transaction.get(cardRef);
            if (!cardDoc.exists()) throw new Error("Credit card not found.");
            const newCardBalance = cardDoc.data().currentBalance - numericAmount;
            transaction.update(cardRef, { currentBalance: newCardBalance, updatedAt: parsedDate.toISOString() });
            break

          default:
            throw new Error("Invalid transaction type.")
        }
        
        transaction.set(newTransactionRef, transactionData);
      });

      toast({
        title: 'Transaction Added',
        description: `Your ${activeTab.replace('_', ' ')} has been successfully recorded.`,
      })
      setOpen(false)
      resetForm()

    } catch(error: any) {
      console.error("Transaction failed: ", error);
      toast({ variant: 'destructive', title: 'Transaction Failed', description: error.message })
    }
  }


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="py-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )
    }

    return (
      <div className="py-4 space-y-4">
        <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
              <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-7"/>
            </div>
        </div>

        <TabsContent value="expense" className="space-y-4 m-0">
            <div className="space-y-2">
                <Label htmlFor="expense-category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="expense-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                        {expenseCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="expense-account">Paid From</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="expense-account"><SelectValue placeholder="Select an account or card" /></SelectTrigger>
                    <SelectContent>
                        {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} (Bank)</SelectItem>)}
                        {creditCards?.map(card => <SelectItem key={acc.id} value={card.id}>{card.name} (Card)</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </TabsContent>

        <TabsContent value="income" className="space-y-4 m-0">
          <div className="space-y-2">
              <Label htmlFor="income-category">Source</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="income-category"><SelectValue placeholder="Select a source" /></SelectTrigger>
                  <SelectContent>
                      {incomeCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
          <div className="space-y-2">
              <Label htmlFor="income-account">Deposit To</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="income-account"><SelectValue placeholder="Select an account" /></SelectTrigger>
                  <SelectContent>
                      {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
              </Select>
          </div>
        </TabsContent>

         <TabsContent value="transfer" className="space-y-4 m-0">
            <div className="space-y-2">
                <Label htmlFor="transfer-from">From Account</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                    <SelectTrigger id="transfer-from"><SelectValue placeholder="Select source account" /></SelectTrigger>
                    <SelectContent>
                        {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="transfer-to">To Account</Label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                    <SelectTrigger id="transfer-to"><SelectValue placeholder="Select destination account" /></SelectTrigger>
                    <SelectContent>
                        {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </TabsContent>

        <TabsContent value="credit_card_payment" className="space-y-4 m-0">
            <div className="space-y-2">
                <Label htmlFor="cc-pay-from">Pay From</Label>
                <Select value={fromAccountId} onValueChange={setFromAccountId}>
                    <SelectTrigger id="cc-pay-from"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                    <SelectContent>
                        {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="cc-pay-to">Pay To Card</Label>
                <Select value={toCreditCardId} onValueChange={setToCreditCardId}>
                    <SelectTrigger id="cc-pay-to"><SelectValue placeholder="Select credit card" /></SelectTrigger>
                    <SelectContent>
                        {creditCards?.map(card => <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </TabsContent>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input 
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="DD/MM/YY"
          />
        </div>
         <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          if (e.target instanceof HTMLElement && e.target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Log a new income, expense, or transfer.</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TransactionType)} className="pt-4">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            <TabsTrigger value="expense" className="flex-col h-16 gap-1"><ArrowDown className="h-5 w-5 text-red-500"/>Expense</TabsTrigger>
            <TabsTrigger value="income" className="flex-col h-16 gap-1"><ArrowUp className="h-5 w-5 text-green-500"/>Income</TabsTrigger>
            <TabsTrigger value="transfer" className="flex-col h-16 gap-1"><ArrowRightLeft className="h-5 w-5 text-blue-500"/>Transfer</TabsTrigger>
            <TabsTrigger value="credit_card_payment" className="flex-col h-16 gap-1 text-center"><CreditCardIcon className="h-5 w-5 text-orange-500"/>CC Payment</TabsTrigger>
          </TabsList>
          
          {renderContent()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Loading...' : 
                activeTab === 'expense' ? 'Add Expense' :
                activeTab === 'income' ? 'Add Income' :
                activeTab === 'transfer' ? 'Confirm Transfer' :
                'Make Payment'
              }
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
