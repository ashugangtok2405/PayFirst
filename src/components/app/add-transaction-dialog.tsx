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
import {
  PlusCircle,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  ChevronDown,
  PiggyBank,
} from 'lucide-react'
import { addDays, addWeeks, addMonths, addYears, isAfter, format, parseISO } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import {
  useFirestore,
  useUser,
  useCollection,
  useMemoFirebase,
} from '@/firebase'
import { collection, doc, runTransaction, DocumentReference, DocumentSnapshot, addDoc } from 'firebase/firestore'
import type { BankAccount, CreditCard, Category, Transaction, RecurringTransaction } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

type TransactionType = 'expense' | 'income' | 'transfer' | 'credit_card_payment' | 'investment'
type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function AddTransactionDialog({ children, mode = 'add', transaction }: { children: React.ReactNode, mode?: 'add' | 'edit', transaction?: Transaction }) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TransactionType>('expense')
  
  // Common state
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [notes, setNotes] = useState('')

  // Tab-specific state
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('') // For expense 'from' or income 'to'
  
  const [fromAccountId, setFromAccountId] = useState('') // For transfer 'from' & cc payment 'from'
  const [toAccountId, setToAccountId] = useState('') // For transfer 'to'
  const [toCreditCardId, setToCreditCardId] = useState('') // For cc payment 'to'
  const [investmentSourceAccountId, setInvestmentSourceAccountId] = useState('');


  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [endDate, setEndDate] = useState<string>('')
  const [autoCreate, setAutoCreate] = useState(true)

  // New Category State
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);


  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
  
  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user?.uid])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user?.uid])
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
    setInvestmentSourceAccountId('');
    setDate(new Date().toISOString().substring(0, 10))
    setIsRecurring(false)
    setFrequency('monthly')
    setEndDate('')
    setAutoCreate(true)
    setActiveTab('expense');
    setShowNewCategoryInput(false);
    setNewCategoryName('');
  }, [])
  
  useEffect(() => {
    if (open) {
      if(mode === 'edit' && transaction) {
        setActiveTab(transaction.type as TransactionType);
        setAmount(transaction.amount.toString());
        setDate(format(parseISO(transaction.transactionDate), 'yyyy-MM-dd'));
        setNotes(transaction.description || '');
        setCategoryId(transaction.categoryId || '');
        setIsRecurring(!!transaction.recurringTransactionId);
        
        switch (transaction.type) {
            case 'expense':
                setAccountId(transaction.fromBankAccountId || transaction.fromCreditCardId || '');
                break;
            case 'income':
                setAccountId(transaction.toBankAccountId || '');
                break;
            case 'transfer':
                setFromAccountId(transaction.fromBankAccountId || '');
                setToAccountId(transaction.toBankAccountId || '');
                break;
            case 'credit_card_payment':
                setFromAccountId(transaction.fromBankAccountId || '');
                setToCreditCardId(transaction.toCreditCardId || '');
                break;
            case 'investment':
                setInvestmentSourceAccountId(transaction.fromBankAccountId || '');
                break;
        }

        if (transaction.recurringTransactionId) {
          setIsRecurring(false);
        }
      } else {
        resetForm();
      }
    }
  }, [open, mode, transaction, resetForm]);

  useEffect(() => {
    // Reset recurring fields if tab changes to one that doesn't support it
    if (isRecurring && (activeTab === 'transfer' || activeTab === 'credit_card_payment' || activeTab === 'investment')) {
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

  const handleCategoryChange = (value: string) => {
    if (value === 'add-new') {
        setShowNewCategoryInput(true);
        setCategoryId(''); // Unselect any category
    } else {
        setShowNewCategoryInput(false);
        setNewCategoryName('');
        setCategoryId(value);
    }
  };

  const handleAddNewCategory = async () => {
    if (!user || !firestore || !newCategoryName.trim()) {
        toast({ title: "Category name cannot be empty.", variant: "destructive" });
        return;
    }

    setIsAddingCategory(true);
    const categoryType = activeTab === 'income' ? 'income' : 'expense';

    const existingCategory = categories?.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && c.type === categoryType);
    if (existingCategory) {
        toast({ title: "Category already exists.", description: `"${existingCategory.name}" is already in your list.`, variant: "destructive" });
        setIsAddingCategory(false);
        return;
    }

    try {
        const newCategoryData = {
            userId: user.uid,
            name: newCategoryName.trim(),
            type: categoryType,
            isDefault: false
        };
        const newDocRef = await addDoc(collection(firestore, 'users', user.uid, 'categories'), newCategoryData);
        
        toast({ title: "Category Added", description: `"${newCategoryName.trim()}" has been added.` });

        setCategoryId(newDocRef.id);
        setShowNewCategoryInput(false);
        setNewCategoryName('');

    } catch (error: any) {
        toast({ title: "Error adding category", description: error.message, variant: "destructive" });
    } finally {
        setIsAddingCategory(false);
    }
  }

  const handleSubmit = async () => {
    if (!user || !firestore || !date || !amount) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all required fields.' });
        return;
    }
    
    if (showNewCategoryInput) {
        toast({ variant: 'destructive', title: 'Unsaved Category', description: 'Please add your new category before saving the transaction.' });
        return;
    }

    if (isRecurring && mode === 'edit') {
        toast({ variant: 'destructive', title: 'Not Supported', description: 'Editing recurring transactions is not supported yet.' });
        return;
    }

    const numericAmount = parseFloat(amount);

    try {
        await runTransaction(firestore, async (tx) => {
            const refsToRead = new Map<string, DocumentReference>();

            let originalTxRef: DocumentReference | null = null;
            if (mode === 'edit' && transaction) {
                originalTxRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
                refsToRead.set('originalTx', originalTxRef);
                if (transaction.fromBankAccountId) refsToRead.set(`bank-${transaction.fromBankAccountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', transaction.fromBankAccountId));
                if (transaction.toBankAccountId) refsToRead.set(`bank-${transaction.toBankAccountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', transaction.toBankAccountId));
                if (transaction.fromCreditCardId) refsToRead.set(`card-${transaction.fromCreditCardId}`, doc(firestore, 'users', user.uid, 'creditCards', transaction.fromCreditCardId));
                if (transaction.toCreditCardId) refsToRead.set(`card-${transaction.toCreditCardId}`, doc(firestore, 'users', user.uid, 'creditCards', transaction.toCreditCardId));
            }

            switch (activeTab) {
                case 'expense':
                    if (bankAccounts?.some(b => b.id === accountId)) refsToRead.set(`bank-${accountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', accountId));
                    else if (creditCards?.some(c => c.id === accountId)) refsToRead.set(`card-${accountId}`, doc(firestore, 'users', user.uid, 'creditCards', accountId));
                    break;
                case 'income':
                    refsToRead.set(`bank-${accountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', accountId));
                    break;
                case 'transfer':
                    refsToRead.set(`bank-${fromAccountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId));
                    refsToRead.set(`bank-${toAccountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', toAccountId));
                    break;
                case 'credit_card_payment':
                    refsToRead.set(`bank-${fromAccountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId));
                    refsToRead.set(`card-${toCreditCardId}`, doc(firestore, 'users', user.uid, 'creditCards', toCreditCardId));
                    break;
                case 'investment':
                    refsToRead.set(`bank-${investmentSourceAccountId}`, doc(firestore, 'users', user.uid, 'bankAccounts', investmentSourceAccountId));
                    break;
            }

            const readDocs = await Promise.all(Array.from(refsToRead.values()).map(ref => tx.get(ref)));
            const docMap = new Map<string, DocumentSnapshot>();
            Array.from(refsToRead.keys()).forEach((key, index) => docMap.set(key, readDocs[index]));

            const balancesToWrite = new Map<DocumentReference, { currentBalance: number }>();

            if (mode === 'edit' && transaction) {
                const originalTxDoc = docMap.get('originalTx');
                if (!originalTxDoc?.exists()) throw new Error("Original transaction not found for edit.");
                const originalTx = originalTxDoc.data() as Transaction;

                const updateBalance = (docKey: string, amountChange: number) => {
                    const docSnap = docMap.get(docKey);
                    if (docSnap?.exists()) {
                        const currentBalance = (balancesToWrite.get(docSnap.ref) || docSnap.data()).currentBalance;
                        balancesToWrite.set(docSnap.ref, { currentBalance: currentBalance + amountChange });
                    }
                };

                if (originalTx.fromBankAccountId) updateBalance(`bank-${originalTx.fromBankAccountId}`, originalTx.amount);
                if (originalTx.toBankAccountId) updateBalance(`bank-${originalTx.toBankAccountId}`, -originalTx.amount);
                if (originalTx.fromCreditCardId) updateBalance(`card-${originalTx.fromCreditCardId}`, -originalTx.amount);
                if (originalTx.toCreditCardId) updateBalance(`card-${originalTx.toCreditCardId}`, originalTx.amount);
            }

            const transactionData: Partial<Transaction> = {
                userId: user.uid, type: activeTab, amount: numericAmount,
                transactionDate: new Date(date).toISOString(),
                description: notes || `New ${activeTab.replace(/_/g, ' ')}`,
            };
            
            switch (activeTab) {
              case 'expense':
                  if (!accountId || !categoryId) throw new Error("Account and category are required.");
                  transactionData.categoryId = categoryId;
                  const bankDocSnap = docMap.get(`bank-${accountId}`);
                  const cardDocSnap = docMap.get(`card-${accountId}`);

                  if (bankDocSnap?.exists()) {
                      transactionData.fromBankAccountId = accountId;
                      const currentBalance = (balancesToWrite.get(bankDocSnap.ref) || bankDocSnap.data()).currentBalance;
                      balancesToWrite.set(bankDocSnap.ref, { currentBalance: currentBalance - numericAmount });
                  } else if (cardDocSnap?.exists()) {
                      transactionData.fromCreditCardId = accountId;
                      const currentBalance = (balancesToWrite.get(cardDocSnap.ref) || cardDocSnap.data()).currentBalance;
                      balancesToWrite.set(cardDocSnap.ref, { currentBalance: currentBalance + numericAmount });
                  } else {
                      throw new Error("Source account/card not found.");
                  }
                  break;
              case 'income':
                  if (!accountId || !categoryId) throw new Error("Account and category are required.");
                  const toAccDoc = docMap.get(`bank-${accountId}`);
                  if (!toAccDoc?.exists()) throw new Error("Destination account not found.");
                  transactionData.toBankAccountId = accountId;
                  transactionData.categoryId = categoryId;
                  const currentBalance = (balancesToWrite.get(toAccDoc.ref) || toAccDoc.data()).currentBalance;
                  balancesToWrite.set(toAccDoc.ref, { currentBalance: currentBalance + numericAmount });
                  break;
              case 'transfer':
                   if (!fromAccountId || !toAccountId) throw new Error("Both 'from' and 'to' accounts are required.");
                   if (fromAccountId === toAccountId) throw new Error("'From' and 'to' accounts cannot be the same.");
                  const fromAccDoc = docMap.get(`bank-${fromAccountId}`);
                  const toAccDocTransfer = docMap.get(`bank-${toAccountId}`);
                  if (!fromAccDoc?.exists() || !toAccDocTransfer?.exists()) throw new Error("One or both transfer accounts not found.");

                  transactionData.fromBankAccountId = fromAccountId;
                  transactionData.toBankAccountId = toAccountId;
                  
                  const fromBalance = (balancesToWrite.get(fromAccDoc.ref) || fromAccDoc.data()).currentBalance;
                  balancesToWrite.set(fromAccDoc.ref, { currentBalance: fromBalance - numericAmount });
                  
                  const toBalance = (balancesToWrite.get(toAccDocTransfer.ref) || toAccDocTransfer.data()).currentBalance;
                  balancesToWrite.set(toAccDocTransfer.ref, { currentBalance: toBalance + numericAmount });
                  break;
              case 'credit_card_payment':
                  if (!fromAccountId || !toCreditCardId) throw new Error("A source bank account and a credit card are required.");
                  const bankPayDoc = docMap.get(`bank-${fromAccountId}`);
                  const cardPayDoc = docMap.get(`card-${toCreditCardId}`);
                  if (!bankPayDoc?.exists() || !cardPayDoc?.exists()) throw new Error("Bank account or credit card not found.");

                  transactionData.fromBankAccountId = fromAccountId;
                  transactionData.toCreditCardId = toCreditCardId;
                  transactionData.description = notes || `Payment for ${creditCards?.find(c => c.id === toCreditCardId)?.name}`;

                  const bankPayBalance = (balancesToWrite.get(bankPayDoc.ref) || bankPayDoc.data()).currentBalance;
                  balancesToWrite.set(bankPayDoc.ref, { currentBalance: bankPayBalance - numericAmount });

                  const cardPayBalance = (balancesToWrite.get(cardPayDoc.ref) || cardPayDoc.data()).currentBalance;
                  balancesToWrite.set(cardPayDoc.ref, { currentBalance: cardPayBalance - numericAmount });
                  break;
                case 'investment':
                    if (!investmentSourceAccountId) throw new Error("Source account is required for an investment.");
                    const investmentSourceAccDoc = docMap.get(`bank-${investmentSourceAccountId}`);
                    if (!investmentSourceAccDoc?.exists()) throw new Error("Source account not found.");
                    
                    transactionData.fromBankAccountId = investmentSourceAccountId;
                    const invSourceBalance = (balancesToWrite.get(investmentSourceAccDoc.ref) || investmentSourceAccDoc.data()).currentBalance;
                    if (invSourceBalance < numericAmount) throw new Error("Insufficient funds for investment.");
                    balancesToWrite.set(investmentSourceAccDoc.ref, { currentBalance: invSourceBalance - numericAmount });
                    break;
            }

            for (const [ref, balanceData] of balancesToWrite.entries()) {
                tx.update(ref, balanceData);
            }

            if (isRecurring && mode === 'add') {
                const newRecurringTransactionRef = doc(collection(firestore, 'users', user.uid, 'recurringTransactions'));
                transactionData.recurringTransactionId = newRecurringTransactionRef.id;
                const recurringData: Omit<RecurringTransaction, 'id'> = {
                    userId: user.uid, description: transactionData.description!, amount: transactionData.amount!,
                    type: transactionData.type as 'income' | 'expense', // Investment is not recurring
                    frequency, startDate: transactionData.transactionDate!,
                    endDate: endDate ? new Date(endDate).toISOString() : undefined, lastGeneratedDate: transactionData.transactionDate!,
                    nextGenerationDate: getNextGenerationDate(new Date(date), frequency).toISOString(),
                    autoCreate, active: true, createdAt: new Date().toISOString(), categoryId: transactionData.categoryId,
                    fromBankAccountId: transactionData.fromBankAccountId, toBankAccountId: transactionData.toBankAccountId,
                    fromCreditCardId: transactionData.fromCreditCardId, toCreditCardId: transactionData.toCreditCardId,
                }
                tx.set(newRecurringTransactionRef, recurringData);
            }

            if (mode === 'edit' && originalTxRef) {
                tx.update(originalTxRef, transactionData);
            } else {
                const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
                tx.set(newTransactionRef, transactionData);
            }
        });

        toast({
            title: mode === 'edit' ? 'Transaction Updated' : (isRecurring ? 'Recurring Transaction Saved' : 'Transaction Added'),
            description: `Your ${activeTab.replace(/_/g, ' ')} has been successfully recorded.`,
        });
        setOpen(false);

    } catch (error: any) {
        console.error("Transaction failed: ", error);
        toast({ variant: 'destructive', title: 'Transaction Failed', description: error.message });
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

    const supportsRecurring = (activeTab === 'expense' || activeTab === 'income') && mode === 'add';

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
                <Select value={categoryId} onValueChange={handleCategoryChange} disabled={mode==='edit' && !!transaction?.recurringTransactionId}>
                    <SelectTrigger id="expense-category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                        {expenseCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                        <SelectItem value="add-new">
                            <span className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" /> Add New Category
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {showNewCategoryInput && activeTab === 'expense' && (
                <div className="flex animate-in fade-in-0 slide-in-from-top-2 items-center gap-2">
                    <Input 
                        placeholder="New expense category"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={handleAddNewCategory} disabled={isAddingCategory}>
                        {isAddingCategory ? 'Adding...' : 'Add'}
                    </Button>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="expense-account">Paid From</Label>
                <Select value={accountId} onValueChange={setAccountId} disabled={mode==='edit' && !!transaction?.recurringTransactionId}>
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
              <Select value={categoryId} onValueChange={handleCategoryChange} disabled={mode==='edit' && !!transaction?.recurringTransactionId}>
                  <SelectTrigger id="income-category"><SelectValue placeholder="Select a source" /></SelectTrigger>
                  <SelectContent>
                      {incomeCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      <SelectItem value="add-new">
                          <span className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" /> Add New Source
                          </span>
                      </SelectItem>
                  </SelectContent>
              </Select>
          </div>
          {showNewCategoryInput && activeTab === 'income' && (
                <div className="flex animate-in fade-in-0 slide-in-from-top-2 items-center gap-2">
                    <Input 
                        placeholder="New income source"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={handleAddNewCategory} disabled={isAddingCategory}>
                        {isAddingCategory ? 'Adding...' : 'Add'}
                    </Button>
                </div>
            )}
          <div className="space-y-2">
              <Label htmlFor="income-account">Deposit To</Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={mode==='edit' && !!transaction?.recurringTransactionId}>
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

        <TabsContent value="investment" className="space-y-4 m-0">
            <div className="space-y-2">
                <Label htmlFor="investment-source">Source Account</Label>
                <Select value={investmentSourceAccountId} onValueChange={setInvestmentSourceAccountId}>
                    <SelectTrigger id="investment-source"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                    <SelectContent>
                        {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </TabsContent>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
         <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input id="notes" placeholder="Add a note..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

        {supportsRecurring && (
            <Collapsible open={isRecurring} onOpenChange={setIsRecurring}>
                <div className="flex items-center space-x-2">
                    <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(Boolean(checked))} />
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
                            <Input 
                              id="end-date"
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              min={date}
                            />
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
      >
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>{mode === 'edit' ? 'Modify your existing transaction.' : 'Log a new income, expense, or transfer.'}</DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TransactionType)} className="pt-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto p-1">
            <TabsTrigger value="expense" className="flex-col h-16 gap-1" disabled={mode==='edit'}><ArrowDown className="h-5 w-5 text-red-500"/>Expense</TabsTrigger>
            <TabsTrigger value="income" className="flex-col h-16 gap-1" disabled={mode==='edit'}><ArrowUp className="h-5 w-5 text-green-500"/>Income</TabsTrigger>
            <TabsTrigger value="transfer" className="flex-col h-16 gap-1" disabled={mode==='edit'}><ArrowRightLeft className="h-5 w-5 text-blue-500"/>Transfer</TabsTrigger>
            <TabsTrigger value="credit_card_payment" className="flex-col h-16 gap-1 text-center" disabled={mode==='edit'}><CreditCardIcon className="h-5 w-5 text-orange-500"/>CC Payment</TabsTrigger>
            <TabsTrigger value="investment" className="flex-col h-16 gap-1 text-center" disabled={mode==='edit'}><PiggyBank className="h-5 w-5 text-indigo-500"/>Investment</TabsTrigger>
          </TabsList>
          
          {renderContent()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSubmit} disabled={isLoading || isAddingCategory}>
              {isLoading || isAddingCategory ? 'Loading...' : mode === 'edit' ? 'Save Changes' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
