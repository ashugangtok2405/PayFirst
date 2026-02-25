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
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  PlusCircle,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  ChevronDown,
  CalendarIcon,
} from 'lucide-react'
import { format, addDays, addWeeks, addMonths, addYears, parse } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
  addDocumentNonBlocking,
} from '@/firebase'
import { collection, doc, runTransaction } from 'firebase/firestore'
import type { BankAccount, CreditCard, Category, Transaction, RecurringTransaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

type TransactionType = 'expense' | 'income' | 'transfer' | 'credit_card_payment'
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('expense')
  
  // Common state
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState('')

  // Tab-specific state
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('') // For expense 'from' or income 'to'
  
  const [fromAccountId, setFromAccountId] = useState('') // For transfer 'from' & cc payment 'from'
  const [toAccountId, setToAccountId] = useState('') // For transfer 'to'
  const [toCreditCardId, setToCreditCardId] = useState('') // For cc payment 'to'

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [autoCreate, setAutoCreate] = useState(true)

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
    setDate(new Date())
    setIsRecurring(false)
    setFrequency('monthly')
    setEndDate(undefined)
    setAutoCreate(true)
  }, [])
  
  useEffect(() => {
    if (open) {
        resetForm()
    }
  }, [open, resetForm])

  useEffect(() => {
    // Reset recurring fields if tab changes to one that doesn't support it
    if (isRecurring && (activeTab === 'transfer' || activeTab === 'credit_card_payment')) {
        setIsRecurring(false)
    }
  }, [activeTab, isRecurring])

  const getNextGenerationDate = (startDate: Date, frequency: Frequency): Date => {
    switch (frequency) {
      case 'daily': return addDays(startDate, 1);
      case 'weekly': return addWeeks(startDate, 1);
      case 'monthly': return addMonths(startDate, 1);
      case 'yearly': return addYears(startDate, 1);
      default: return addMonths(startDate, 1);
    }
  }

  const handleSubmit = async () => {
    if (!user || !firestore || !date || !amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required fields.' })
      return
    }
    
    const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
    const numericAmount = parseFloat(amount);
    const newRecurringTransactionRef = isRecurring ? doc(collection(firestore, 'users', user.uid, 'recurringTransactions')) : null;

    try {
      await runTransaction(firestore, async (transaction) => {
        let transactionData: Partial<Transaction> = {
          userId: user.uid,
          type: activeTab,
          amount: numericAmount,
          transactionDate: date.toISOString(),
          description: notes || `New ${activeTab.replace('_', ' ')}`,
        }

        if (isRecurring && newRecurringTransactionRef) {
          transactionData.recurringTransactionId = newRecurringTransactionRef.id;
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
              transaction.update(accountRef, { currentBalance: newBalance, updatedAt: date.toISOString() });
            } else if (creditCards?.some(c => c.id === accountId)) {
              transactionData.fromCreditCardId = accountId;
              const cardRef = doc(firestore, 'users', user.uid, 'creditCards', accountId);
              const cardDoc = await transaction.get(cardRef);
              if (!cardDoc.exists()) throw new Error("Credit card not found.");
              const newBalance = cardDoc.data().currentBalance + numericAmount;
              transaction.update(cardRef, { currentBalance: newBalance, updatedAt: date.toISOString() });
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
            transaction.update(accountRef, { currentBalance: newBalance, updatedAt: date.toISOString() });
            transactionData.categoryId = categoryId;
            break
        
          case 'transfer':
            if (!fromAccountId || !toAccountId) throw new Error("Both 'from' and 'to' accounts are required.");
            if (fromAccountId === toAccountId) throw new Error("'From' and 'to' accounts cannot be the same.");
            transactionData.fromBankAccountId = fromAccountId;
            transactionData.toBankAccountId = toAccountId;
            
            const fromAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId);
            const toAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', toAccountId);
            
            const fromAccountDoc = await transaction.get(fromAccountRef);
            const toAccountDoc = await transaction.get(toAccountRef);

            if (!fromAccountDoc.exists()) throw new Error("Source account not found.");
            if (!toAccountDoc.exists()) throw new Error("Destination account not found.");

            const newFromBalance = fromAccountDoc.data().currentBalance - numericAmount;
            transaction.update(fromAccountRef, { currentBalance: newFromBalance, updatedAt: date.toISOString() });

            const newToBalance = toAccountDoc.data().currentBalance + numericAmount;
            transaction.update(toAccountRef, { currentBalance: newToBalance, updatedAt: date.toISOString() });
            break

          case 'credit_card_payment':
            if (!fromAccountId || !toCreditCardId) throw new Error("A source bank account and a credit card are required.");
            transactionData.fromBankAccountId = fromAccountId;
            transactionData.toCreditCardId = toCreditCardId;
            transactionData.description = notes || `Payment for ${creditCards?.find(c => c.id === toCreditCardId)?.name}`

            const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId);
            const cardRef = doc(firestore, 'users', user.uid, 'creditCards', toCreditCardId);

            const bankAccountDoc = await transaction.get(bankAccountRef);
            const cardDoc = await transaction.get(cardRef);

            if (!bankAccountDoc.exists()) throw new Error("Bank account not found.");
            if (!cardDoc.exists()) throw new Error("Credit card not found.");

            const newBankBalance = bankAccountDoc.data().currentBalance - numericAmount;
            transaction.update(bankAccountRef, { currentBalance: newBankBalance, updatedAt: date.toISOString() });

            const newCardBalance = cardDoc.data().currentBalance - numericAmount;
            transaction.update(cardRef, { currentBalance: newCardBalance, updatedAt: date.toISOString() });
            break

          default:
            throw new Error("Invalid transaction type.")
        }
        
        transaction.set(newTransactionRef, transactionData);

        if (isRecurring && newRecurringTransactionRef) {
            const recurringData: Omit<RecurringTransaction, 'id'> = {
                userId: user.uid,
                description: transactionData.description!,
                amount: transactionData.amount!,
                type: transactionData.type!,
                frequency,
                startDate: transactionData.transactionDate,
                endDate: endDate?.toISOString(),
                lastGeneratedDate: transactionData.transactionDate,
                nextGenerationDate: getNextGenerationDate(date, frequency).toISOString(),
                autoCreate,
                active: true,
                createdAt: new Date().toISOString(),
                categoryId: transactionData.categoryId,
                fromBankAccountId: transactionData.fromBankAccountId,
                toBankAccountId: transactionData.toBankAccountId,
                fromCreditCardId: transactionData.fromCreditCardId,
                toCreditCardId: transactionData.toCreditCardId,
            }
            transaction.set(newRecurringTransactionRef, recurringData);
        }
      });

      toast({
        title: isRecurring ? 'Recurring Transaction Saved' : 'Transaction Added',
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

    const supportsRecurring = activeTab === 'expense' || activeTab === 'income';

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
                        {creditCards?.map(card => <SelectItem key={card.id} value={card.id}>{card.name} (Card)</SelectItem>)}
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
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'LLL dd, y') : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus/></PopoverContent>
            </Popover>
        </div>
         <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

        {supportsRecurring && (
            <Collapsible open={isRecurring} onOpenChange={setIsRecurring}>
                <div className="flex items-center space-x-2">
                    <Checkbox id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                    <label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Make this recurring
                    </label>
                </div>
                <CollapsibleContent className="space-y-4 pt-4 animate-in fade-in-0 zoom-in-95">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                                <SelectTrigger id="frequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end-date">End Date (Optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, 'LLL dd, y') : <span>Never</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus/></PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <Label>Auto-create transaction</Label>
                            <p className="text-xs text-muted-foreground">If enabled, transactions will be created automatically.</p>
                        </div>
                        <Switch checked={autoCreate} onCheckedChange={setAutoCreate} />
                    </div>
                </CollapsibleContent>
            </Collapsible>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
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
