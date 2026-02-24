'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Landmark, CreditCard, ChevronDown, PlusCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, CreditCard as CreditCardType } from '@/lib/types'

export function AddAccountDialog() {
  const [open, setOpen] = useState(false)
  const [accountType, setAccountType] = useState('bank')
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  // Bank Account State
  const [bankAccountName, setBankAccountName] = useState('')
  const [bankName, setBankName] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [isSavingsAccount, setIsSavingsAccount] = useState(false)
  
  // Credit Card State
  const [cardName, setCardName] = useState('')
  const [cardIssuer, setCardIssuer] = useState('')
  const [creditLimit, setCreditLimit] = useState('')
  const [cardCurrentBalance, setCardCurrentBalance] = useState('')
  const [apr, setApr] = useState('')
  const [statementDay, setStatementDay] = useState('')

  const handleAddAccount = () => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to add an account." });
        return;
    }

    if (accountType === 'bank') {
        const bankAccount: Omit<BankAccount, 'id' | 'userId' | 'currency'> = {
            name: bankAccountName,
            bankName: bankName,
            currentBalance: parseFloat(openingBalance) || 0,
            isSavingsAccount: isSavingsAccount,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'bankAccounts'), { ...bankAccount, userId: user.uid, currency: 'INR' });
        toast({ title: 'Account Added', description: `Your new bank account has been added.` })
    } else {
        const creditCard: Omit<CreditCardType, 'id' | 'userId' | 'lastFourDigits' | 'statementDueDate'> = {
            name: cardName,
            issuer: cardIssuer,
            creditLimit: parseFloat(creditLimit) || 0,
            currentBalance: parseFloat(cardCurrentBalance) || 0,
            apr: parseFloat(apr) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        
        const dueDate = new Date();
        dueDate.setDate(parseInt(statementDay, 10));

        addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'creditCards'), { ...creditCard, userId: user.uid, lastFourDigits: '0000', statementDueDate: dueDate.toISOString() });
        toast({ title: 'Account Added', description: `Your new credit card has been added.` })
    }
    setOpen(false)
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
          <DialogDescription>
            Connect a new bank account or credit card to start tracking.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            <Tabs value={accountType} onValueChange={setAccountType} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                    <TabsTrigger value="bank" className="h-20 flex flex-col gap-2 rounded-lg data-[state=active]:shadow-lg">
                        <Landmark className="h-6 w-6"/>
                        <span className="font-semibold">Bank Account</span>
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="h-20 flex flex-col gap-2 rounded-lg data-[state=active]:shadow-lg">
                        <CreditCard className="h-6 w-6"/>
                        <span className="font-semibold">Credit Card</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="bank" className="py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-acc-name">Account Name</Label>
                            <Input id="bank-acc-name" placeholder="e.g. My Primary Savings" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="bank-name">Bank Name</Label>
                            <Input id="bank-name" placeholder="e.g. HDFC Bank" value={bankName} onChange={e => setBankName(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-acc-type">Account Type</Label>
                            <Select onValueChange={(v) => setIsSavingsAccount(v === 'savings')}>
                                <SelectTrigger id="bank-acc-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="savings">Savings</SelectItem>
                                    <SelectItem value="current">Current</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="opening-balance">Opening Balance</Label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                                <Input id="opening-balance" type="number" placeholder="0.00" className="pl-7" value={openingBalance} onChange={e => setOpeningBalance(e.target.value)} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="bank-currency">Currency</Label>
                             <Input id="bank-currency" value="INR (Indian Rupee)" disabled />
                        </div>
                    </div>
                     <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <ChevronDown className="h-4 w-4" /> Advanced Settings
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2">
                            <div className="p-4 border rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="bank-net-worth" className="flex flex-col gap-0.5">
                                        <span>Include in Net Worth</span>
                                        <span className="font-normal text-xs text-muted-foreground">This account balance will be added to your total assets.</span>
                                    </Label>
                                    <Switch id="bank-net-worth" defaultChecked />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>
                <TabsContent value="credit" className="py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cc-name">Card Name</Label>
                            <Input id="cc-name" placeholder="e.g. Amazon Pay ICICI" value={cardName} onChange={e => setCardName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cc-bank-name">Bank Name</Label>
                            <Input id="cc-bank-name" placeholder="e.g. ICICI Bank" value={cardIssuer} onChange={e => setCardIssuer(e.target.value)} />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="cc-limit">Credit Limit</Label>
                             <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                                <Input id="cc-limit" type="number" placeholder="1,00,000" className="pl-7" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cc-outstanding">Current Outstanding</Label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                                <Input id="cc-outstanding" type="number" placeholder="0.00" className="pl-7" value={cardCurrentBalance} onChange={e => setCardCurrentBalance(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="cc-billing-date">Statement Date</Label>
                            <Select onValueChange={setStatementDay}>
                                <SelectTrigger id="cc-billing-date"><SelectValue placeholder="Select day of month" /></SelectTrigger>
                                <SelectContent>
                                    {days.map(day => <SelectItem key={day} value={day.toString()}>{day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cc-apr">Interest Rate (APR %)</Label>
                            <Input id="cc-apr" type="number" placeholder="e.g. 14.99" value={apr} onChange={e => setApr(e.target.value)} />
                        </div>
                    </div>
                     <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <ChevronDown className="h-4 w-4" /> Advanced Settings
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-4 animate-in fade-in-0 slide-in-from-top-2">
                            <div className="p-4 border rounded-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="cc-net-worth" className="flex flex-col gap-0.5">
                                        <span>Include in Net Worth</span>
                                        <span className="font-normal text-xs text-muted-foreground">This card's balance will be counted as a liability.</span>
                                    </Label>
                                    <Switch id="cc-net-worth" defaultChecked />
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </TabsContent>
            </Tabs>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleAddAccount}>
            Add Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
