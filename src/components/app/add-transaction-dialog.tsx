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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Calendar as CalendarIcon,
  PlusCircle,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  useFirestore,
  useUser,
  addDocumentNonBlocking,
} from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, CreditCard, Category, Transaction } from '@/lib/types'

type TransactionType = 'expense' | 'income' | 'transfer' | 'credit_card_payment'

// Dummy data to populate the dropdowns for UI demonstration
const dummyCategories: Category[] = [
    { id: 'cat-exp-1', userId: 'dummy', name: 'Groceries', type: 'expense', isDefault: true },
    { id: 'cat-exp-2', userId: 'dummy', name: 'Transport', type: 'expense', isDefault: true },
    { id: 'cat-exp-3', userId: 'dummy', name: 'Entertainment', type: 'expense', isDefault: true },
    { id: 'cat-exp-4', userId: 'dummy', name: 'Bills', type: 'expense', isDefault: true },
    { id: 'cat-exp-5', userId: 'dummy', name: 'Food', type: 'expense', isDefault: true },
    { id: 'cat-exp-6', userId: 'dummy', name: 'Shopping', type: 'expense', isDefault: true },
    { id: 'cat-exp-7', userId: 'dummy', name: 'Utilities', type: 'expense', isDefault: true },
    { id: 'cat-exp-8', userId: 'dummy', name: 'Rent', type: 'expense', isDefault: true },
    { id: 'cat-inc-1', userId: 'dummy', name: 'Salary', type: 'income', isDefault: true },
    { id: 'cat-inc-2', userId: 'dummy', name: 'Freelance', type: 'income', isDefault: true },
    { id: 'cat-inc-3', userId: 'dummy', name: 'Investment', type: 'income', isDefault: true },
    { id: 'cat-inc-4', userId: 'dummy', name: 'Other', type: 'income', isDefault: true },
  ];

const dummyBankAccounts: BankAccount[] = [
    { id: 'acc1', userId: 'dummy', name: 'HDFC Savings', bankName: 'HDFC Bank', currentBalance: 525000, currency: 'INR', isSavingsAccount: true },
    { id: 'acc2', userId: 'dummy', name: 'ICICI Current', bankName: 'ICICI Bank', currentBalance: 315500, currency: 'INR', isSavingsAccount: false },
  ];

const dummyCreditCards: CreditCard[] = [
    { id: 'cc1', userId: 'dummy', name: 'HDFC Millennia', issuer: 'HDFC Bank', lastFourDigits: '1111', currentBalance: 45200, creditLimit: 150000, apr: 15, statementDueDate: new Date().toISOString() },
    { id: 'cc2', userId: 'dummy', name: 'ICICI Amazon Pay', issuer: 'ICICI Bank', lastFourDigits: '2222', currentBalance: 15000, creditLimit: 200000, apr: 16, statementDueDate: new Date().toISOString() },
  ];


export function AddTransactionDialog() {
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


  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  // Using dummy data for UI demonstration
  const bankAccounts = dummyBankAccounts;
  const creditCards = dummyCreditCards;
  const categories = dummyCategories;

  const expenseCategories = useMemo(() => categories?.filter(c => c.type === 'expense') ?? [], [categories])
  const incomeCategories = useMemo(() => categories?.filter(c => c.type === 'income') ?? [], [categories])

  const resetForm = useCallback(() => {
    setAmount('')
    setNotes('')
    setCategoryId('')
    setAccountId('')
    setFromAccountId('')
    setToAccountId('')
    setToCreditCardId('')
    // Keep date as is for convenience
  }, [])
  
  useEffect(() => {
    resetForm()
  }, [activeTab, resetForm])

  const handleSubmit = () => {
    if (!user || !firestore || !date || !amount) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required fields.' })
      return
    }

    let transactionData: Partial<Transaction> = {
      userId: user.uid,
      type: activeTab,
      amount: parseFloat(amount),
      transactionDate: date.toISOString(),
      description: notes || `New ${activeTab.replace('_', ' ')}`,
    }

    try {
      switch (activeTab) {
        case 'expense':
          if (!accountId || !categoryId) throw new Error("Account and category are required.");
          if (bankAccounts?.some(b => b.id === accountId)) {
            transactionData.fromBankAccountId = accountId;
          } else if (creditCards?.some(c => c.id === accountId)) {
            transactionData.fromCreditCardId = accountId;
          }
          transactionData.categoryId = categoryId
          break
        
        case 'income':
          if (!accountId || !categoryId) throw new Error("Account and source are required.");
          transactionData.toBankAccountId = accountId
          transactionData.categoryId = categoryId
          break
        
        case 'transfer':
          if (!fromAccountId || !toAccountId) throw new Error("Both 'from' and 'to' accounts are required.");
          if (fromAccountId === toAccountId) throw new Error("'From' and 'to' accounts cannot be the same.");
          transactionData.fromBankAccountId = fromAccountId
          transactionData.toBankAccountId = toAccountId
          break

        case 'credit_card_payment':
          if (!fromAccountId || !toCreditCardId) throw new Error("A source bank account and a credit card are required.");
          transactionData.fromBankAccountId = fromAccountId;
          transactionData.toCreditCardId = toCreditCardId;
          transactionData.description = notes || `Payment for ${creditCards?.find(c => c.id === toCreditCardId)?.name}`
          break

        default:
          throw new Error("Invalid transaction type.")
      }

      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'transactions'), transactionData)
      
      toast({
        title: 'Transaction Added',
        description: `Your ${activeTab.replace('_', ' ')} has been successfully recorded.`,
      })
      setOpen(false)
      resetForm()

    } catch(error: any) {
      toast({ variant: 'destructive', title: 'Validation Error', description: error.message })
    }
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
        onPointerDownOutside={(e) => {
          if ((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault()
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
                <Label>Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
             <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input id="notes" placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {activeTab === 'expense' && 'Add Expense'}
              {activeTab === 'income' && 'Add Income'}
              {activeTab === 'transfer' && 'Confirm Transfer'}
              {activeTab === 'credit_card_payment' && 'Make Payment'}
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
