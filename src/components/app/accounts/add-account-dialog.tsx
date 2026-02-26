'use client'

import { useState, useEffect } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Landmark, CreditCard, ChevronDown, FileText, Handshake, CalendarIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CustomCalendar } from '@/components/app/shared/custom-calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, addDoc, doc, runTransaction, updateDoc } from 'firebase/firestore'
import type { BankAccount, CreditCard as CreditCardType, Loan, PersonalDebt, Transaction } from '@/lib/types'

type AccountData = BankAccount | CreditCardType | Loan | PersonalDebt;

interface AddAccountDialogProps {
  children: React.ReactNode;
  mode?: 'add' | 'edit';
  account?: AccountData;
  accountType: 'bank' | 'credit' | 'loan' | 'personal_debt';
}


export function AddAccountDialog({ children, mode = 'add', account, accountType: initialAccountType }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [accountType, setAccountType] = useState(initialAccountType)
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const [debtDueDatePopoverOpen, setDebtDueDatePopoverOpen] = useState(false);


  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const emptyState = {
    bankAccountName: '', bankName: '', openingBalance: '', isSavingsAccount: false,
    cardName: '', cardIssuer: '', creditLimit: '', cardCurrentBalance: '', apr: '', statementDay: '',
    loanName: '', loanOriginalAmount: '', loanOutstanding: '', loanInterestRate: '', loanEmiAmount: '', loanTenure: '', loanNextDueDay: '',
    debtPersonName: '', debtType: 'lent', debtAmount: '', debtLinkedAccountId: '', debtDueDate: undefined as Date | undefined, debtInterestRate: '',
  }

  const [formState, setFormState] = useState(emptyState)

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && account) {
        setAccountType(initialAccountType)
        const data = account as any;
        const newState: any = {};
        switch (initialAccountType) {
          case 'bank':
            newState.bankAccountName = data.name;
            newState.bankName = data.bankName;
            newState.openingBalance = data.currentBalance.toString();
            newState.isSavingsAccount = data.isSavingsAccount;
            break;
          case 'credit':
            newState.cardName = data.name;
            newState.cardIssuer = data.issuer;
            newState.creditLimit = data.creditLimit.toString();
            newState.cardCurrentBalance = data.currentBalance.toString();
            newState.apr = data.apr.toString();
            newState.statementDay = new Date(data.statementDueDate).getDate().toString();
            break;
          case 'loan':
            newState.loanName = data.name;
            newState.loanOriginalAmount = data.originalAmount.toString();
            newState.loanOutstanding = data.outstanding.toString();
            newState.loanInterestRate = data.interestRate.toString();
            newState.loanEmiAmount = data.emiAmount.toString();
            newState.loanTenure = data.tenureMonths.toString();
            newState.loanNextDueDay = new Date(data.nextDueDate).getDate().toString();
            break;
          case 'personal_debt':
            newState.debtPersonName = data.personName;
            newState.debtType = data.type;
            newState.debtAmount = data.originalAmount.toString();
            newState.debtLinkedAccountId = data.linkedAccountId;
            newState.debtDueDate = data.dueDate ? new Date(data.dueDate) : undefined;
            newState.debtInterestRate = data.interestRate?.toString() ?? '';
            break;
        }
        setFormState(s => ({...s, ...newState}));
      } else {
        setFormState(emptyState);
        setAccountType(initialAccountType);
      }
    }
  }, [open, mode, account, initialAccountType])


  const handleInputChange = (field: keyof typeof formState, value: any) => {
    setFormState(prev => ({...prev, [field]: value}))
  }

  const handleSaveAccount = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to add an account." });
        return;
    }

    const now = new Date().toISOString();

    try {
        const docRef = mode === 'edit' && account ? doc(firestore, 'users', user.uid, `${initialAccountType}s`, account.id) : null;
        
        if (accountType === 'bank') {
            const bankAccountData: Partial<BankAccount> = {
                userId: user.uid, name: formState.bankAccountName, bankName: formState.bankName,
                currentBalance: parseFloat(formState.openingBalance) || 0, isSavingsAccount: formState.isSavingsAccount,
                currency: 'INR', updatedAt: now,
            }
            if (mode === 'add') {
                await addDoc(collection(firestore, 'users', user.uid, 'bankAccounts'), {...bankAccountData, createdAt: now});
            } else if (docRef) {
                await updateDoc(docRef, bankAccountData);
            }
        } else if (accountType === 'credit') {
            const dueDate = new Date();
            if (formState.statementDay) dueDate.setDate(parseInt(formState.statementDay, 10));
            const creditCardData: Partial<CreditCardType> = {
                userId: user.uid, name: formState.cardName, issuer: formState.cardIssuer,
                creditLimit: parseFloat(formState.creditLimit) || 0, currentBalance: parseFloat(formState.cardCurrentBalance) || 0,
                apr: parseFloat(formState.apr) || 0, statementDueDate: dueDate.toISOString(),
                updatedAt: now,
            }
            if(mode === 'add') {
                await addDoc(collection(firestore, 'users', user.uid, 'creditCards'), {...creditCardData, lastFourDigits: '0000', createdAt: now});
            } else if (docRef) {
                await updateDoc(docRef, creditCardData);
            }
        } else if (accountType === 'loan') {
            const dueDate = new Date();
            if (formState.loanNextDueDay) dueDate.setDate(parseInt(formState.loanNextDueDay, 10));
            const loanData: Partial<Loan> = {
                userId: user.uid, name: formState.loanName, originalAmount: parseFloat(formState.loanOriginalAmount) || 0,
                outstanding: parseFloat(formState.loanOutstanding) || parseFloat(formState.loanOriginalAmount) || 0,
                interestRate: parseFloat(formState.loanInterestRate) || 0, emiAmount: parseFloat(formState.loanEmiAmount) || 0,
                tenureMonths: parseInt(formState.loanTenure) || 0,
                nextDueDate: dueDate.toISOString(), updatedAt: now,
            }
            if(mode === 'edit') {
              const originalLoan = account as Loan;
              const tenureRemaining = originalLoan.tenureMonths - (originalLoan.tenureMonths - originalLoan.remainingMonths);
              loanData.remainingMonths = tenureRemaining;
            } else {
              loanData.remainingMonths = parseInt(formState.loanTenure) || 0;
            }

            if(mode === 'add') {
                await addDoc(collection(firestore, 'users', user.uid, 'loans'), {...loanData, active: true, createdAt: now});
            } else if (docRef) {
                await updateDoc(docRef, loanData);
            }
        } else if (accountType === 'personal_debt') {
             if (mode === 'edit') {
                toast({ variant: 'destructive', title: 'Not Supported', description: 'Editing personal debt is not yet supported.' });
                return;
            }
            if (!formState.debtLinkedAccountId || !formState.debtPersonName || !formState.debtAmount) throw new Error("Please fill all required fields for the debt.");

            const debtAmountNum = parseFloat(formState.debtAmount);
            await runTransaction(firestore, async (transaction) => {
                const newDebtRef = doc(collection(firestore, 'users', user.uid, 'personalDebts'));
                const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', formState.debtLinkedAccountId);
                const bankAccountDoc = await transaction.get(bankAccountRef);
                if (!bankAccountDoc.exists()) throw new Error("Linked bank account not found.");
                
                const newDebt: Omit<PersonalDebt, 'id'> = {
                    userId: user.uid, personName: formState.debtPersonName, type: formState.debtType as 'lent' | 'borrowed',
                    originalAmount: debtAmountNum, remainingAmount: debtAmountNum, status: 'active',
                    interestRate: parseFloat(formState.debtInterestRate) || 0, dueDate: formState.debtDueDate?.toISOString() || null,
                    linkedAccountId: formState.debtLinkedAccountId, createdAt: now, updatedAt: now,
                }
                transaction.set(newDebtRef, newDebt);

                let newBalance;
                let transactionData: Omit<Transaction, 'id'>;
                if (formState.debtType === 'lent') {
                    newBalance = bankAccountDoc.data().currentBalance - debtAmountNum;
                    if (newBalance < 0) throw new Error("Insufficient funds in linked account.");
                    transactionData = {
                        userId: user.uid, type: 'debt_lent', amount: debtAmountNum,
                        description: `Lent to ${formState.debtPersonName}`, transactionDate: now,
                        fromBankAccountId: formState.debtLinkedAccountId,
                    }
                } else {
                    newBalance = bankAccountDoc.data().currentBalance + debtAmountNum;
                    transactionData = {
                        userId: user.uid, type: 'debt_borrowed', amount: debtAmountNum,
                        description: `Borrowed from ${formState.debtPersonName}`, transactionDate: now,
                        toBankAccountId: formState.debtLinkedAccountId,
                    }
                }
                transaction.update(bankAccountRef, { currentBalance: newBalance });
                const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
                transaction.set(newTransactionRef, transactionData);
            });
        }
        toast({ title: mode === 'add' ? 'Account Added' : 'Account Updated' })
        setOpen(false)
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not save account.' });
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col" onInteractOutside={(e) => {
          if (e.target instanceof HTMLElement && e.target.closest('[data-radix-popper-content-wrapper]')) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Account' : 'Edit Account'}</DialogTitle>
          <DialogDescription>{mode === 'add' ? 'Connect a new account to start tracking your finances.' : 'Update the details for your account.'}</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            <Tabs value={accountType} onValueChange={setAccountType} className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
                    <TabsTrigger value="bank" disabled={mode === 'edit'} className="h-20 flex flex-col gap-2 rounded-lg data-[state=active]:shadow-lg"><Landmark className="h-6 w-6"/>Bank Account</TabsTrigger>
                    <TabsTrigger value="credit" disabled={mode === 'edit'} className="h-20 flex flex-col gap-2 rounded-lg data-[state=active]:shadow-lg"><CreditCard className="h-6 w-6"/>Credit Card</TabsTrigger>
                    <TabsTrigger value="loan" disabled={mode === 'edit'} className="h-20 flex flex-col gap-2 rounded-lg data-[state=active]:shadow-lg"><FileText className="h-6 w-6"/>Loan / EMI</TabsTrigger>
                    <TabsTrigger value="personal_debt" disabled={mode === 'edit'} className="h-20 flex flex-col gap-2 rounded-lg data-[state=active]:shadow-lg"><Handshake className="h-6 w-6"/>Personal Debt</TabsTrigger>
                </TabsList>
                <TabsContent value="bank" className="py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="bank-acc-name">Account Name</Label><Input id="bank-acc-name" placeholder="e.g. My Primary Savings" value={formState.bankAccountName} onChange={e => handleInputChange('bankAccountName', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="bank-name">Bank Name</Label><Input id="bank-name" placeholder="e.g. HDFC Bank" value={formState.bankName} onChange={e => handleInputChange('bankName', e.target.value)} /></div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label htmlFor="bank-acc-type">Account Type</Label><Select value={formState.isSavingsAccount ? 'savings' : 'current'} onValueChange={(v) => handleInputChange('isSavingsAccount', v === 'savings')}><SelectTrigger id="bank-acc-type"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="savings">Savings</SelectItem><SelectItem value="current">Current</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="opening-balance">{mode === 'add' ? 'Opening Balance' : 'Current Balance'}</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="opening-balance" type="number" placeholder="0.00" className="pl-7" value={formState.openingBalance} onChange={e => handleInputChange('openingBalance', e.target.value)} /></div></div>
                        <div className="space-y-2"><Label htmlFor="bank-currency">Currency</Label><Input id="bank-currency" value="INR (Indian Rupee)" disabled /></div>
                    </div>
                     <Collapsible><CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary"><ChevronDown className="h-4 w-4" /> Advanced Settings</CollapsibleTrigger><CollapsibleContent className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2"><div className="p-4 border rounded-lg space-y-4"><div className="flex items-center justify-between"><Label htmlFor="bank-net-worth" className="flex flex-col gap-0.5"><span>Include in Net Worth</span><span className="font-normal text-xs text-muted-foreground">This account balance will be added to your total assets.</span></Label><Switch id="bank-net-worth" defaultChecked /></div></div></CollapsibleContent></Collapsible>
                </TabsContent>
                <TabsContent value="credit" className="py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="cc-name">Card Name</Label><Input id="cc-name" placeholder="e.g. Amazon Pay ICICI" value={formState.cardName} onChange={e => handleInputChange('cardName', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="cc-bank-name">Bank Name</Label><Input id="cc-bank-name" placeholder="e.g. ICICI Bank" value={formState.cardIssuer} onChange={e => handleInputChange('cardIssuer', e.target.value)} /></div></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="cc-limit">Credit Limit</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="cc-limit" type="number" placeholder="1,00,000" className="pl-7" value={formState.creditLimit} onChange={e => handleInputChange('creditLimit', e.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="cc-outstanding">Current Outstanding</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="cc-outstanding" type="number" placeholder="0.00" className="pl-7" value={formState.cardCurrentBalance} onChange={e => handleInputChange('cardCurrentBalance', e.target.value)} /></div></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="cc-billing-date">Statement Date</Label><Select value={formState.statementDay} onValueChange={(v) => handleInputChange('statementDay', v)}><SelectTrigger id="cc-billing-date"><SelectValue placeholder="Select day of month" /></SelectTrigger><SelectContent>{days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="cc-apr">Interest Rate (APR %)</Label><Input id="cc-apr" type="number" placeholder="e.g. 14.99" value={formState.apr} onChange={e => handleInputChange('apr', e.target.value)} /></div></div>
                     <Collapsible><CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary"><ChevronDown className="h-4 w-4" /> Advanced Settings</CollapsibleTrigger><CollapsibleContent className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2"><div className="p-4 border rounded-lg space-y-4"><div className="flex items-center justify-between"><Label htmlFor="cc-net-worth" className="flex flex-col gap-0.5"><span>Include in Net Worth</span><span className="font-normal text-xs text-muted-foreground">This card's balance will be counted as a liability.</span></Label><Switch id="cc-net-worth" defaultChecked /></div></div></CollapsibleContent></Collapsible>
                </TabsContent>
                <TabsContent value="loan" className="py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="loan-name">Loan Name</Label><Input id="loan-name" placeholder="e.g. Home Loan" value={formState.loanName} onChange={e => handleInputChange('loanName', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="loan-amount">Original Loan Amount</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="loan-amount" type="number" placeholder="e.g. 50,00,000" className="pl-7" value={formState.loanOriginalAmount} onChange={e => handleInputChange('loanOriginalAmount', e.target.value)} disabled={mode === 'edit'} /></div></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="loan-outstanding">Current Outstanding Principal</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="loan-outstanding" type="number" placeholder="If different from original amount" className="pl-7" value={formState.loanOutstanding} onChange={e => handleInputChange('loanOutstanding', e.target.value)} /></div></div><div className="space-y-2"><Label htmlFor="loan-emi">EMI Amount</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="loan-emi" type="number" placeholder="e.g. 45,000" className="pl-7" value={formState.loanEmiAmount} onChange={e => handleInputChange('loanEmiAmount', e.target.value)} /></div></div></div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="loan-interest-rate">Interest Rate (p.a. %)</Label><Input id="loan-interest-rate" type="number" placeholder="e.g. 8.5" value={formState.loanInterestRate} onChange={e => handleInputChange('loanInterestRate', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="loan-tenure">Tenure (in months)</Label><Input id="loan-tenure" type="number" placeholder="e.g. 240" value={formState.loanTenure} onChange={e => handleInputChange('loanTenure', e.target.value)} disabled={mode === 'edit'}/></div><div className="space-y-2"><Label htmlFor="loan-due-day">Next Due Day</Label><Select value={formState.loanNextDueDay} onValueChange={(v) => handleInputChange('loanNextDueDay', v)}><SelectTrigger id="loan-due-day"><SelectValue placeholder="Select day of month" /></SelectTrigger><SelectContent>{days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}</SelectContent></Select></div></div>
                </TabsContent>
                <TabsContent value="personal_debt" className="py-4 space-y-6">
                    <div className="space-y-2"><Label htmlFor="debt-person">Person's Name</Label><Input id="debt-person" placeholder="e.g. John Doe" value={formState.debtPersonName} onChange={e => handleInputChange('debtPersonName', e.target.value)} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Type</Label><Select value={formState.debtType} onValueChange={(v) => handleInputChange('debtType', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lent">I Lent Money</SelectItem><SelectItem value="borrowed">I Borrowed Money</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="debt-amount">Amount</Label><div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span><Input id="debt-amount" type="number" placeholder="0.00" className="pl-7" value={formState.debtAmount} onChange={e => handleInputChange('debtAmount', e.target.value)} /></div></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="debt-linked-account">Linked Bank Account</Label><Select value={formState.debtLinkedAccountId} onValueChange={(v) => handleInputChange('debtLinkedAccountId', v)} disabled={loadingBankAccounts}><SelectTrigger id="debt-linked-account"><SelectValue placeholder="Select bank account" /></SelectTrigger><SelectContent>{bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="debt-due-date">Due Date (Optional)</Label>
                            <Popover open={debtDueDatePopoverOpen} onOpenChange={setDebtDueDatePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn("w-full justify-start text-left font-normal", !formState.debtDueDate && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formState.debtDueDate ? format(formState.debtDueDate, "PPP") : <span>Pick a due date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <CustomCalendar
                                        selectedDate={formState.debtDueDate}
                                        onSelectDate={(date) => {
                                          handleInputChange('debtDueDate', date)
                                          setDebtDueDatePopoverOpen(false)
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2"><Label htmlFor="debt-interest">Interest Rate (p.a. %, optional)</Label><Input id="debt-interest" type="number" placeholder="e.g. 5" value={formState.debtInterestRate} onChange={e => handleInputChange('debtInterestRate', e.target.value)} /></div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSaveAccount}>{mode === 'add' ? 'Add Account' : 'Save Changes'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
