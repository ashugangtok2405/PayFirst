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
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, runTransaction, doc } from 'firebase/firestore'
import type { Investment, InvestmentTransaction, BankAccount, Transaction } from '@/lib/types'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

export function AddInvestmentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [fundName, setFundName] = useState('')
  const [fundHouse, setFundHouse] = useState('')
  const [category, setCategory] = useState<'Equity' | 'Debt' | 'Hybrid' | 'Other'>('Equity')
  const [subCategory, setSubCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [nav, setNav] = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')

  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [user, firestore])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const resetForm = () => {
    setFundName('')
    setFundHouse('')
    setCategory('Equity')
    setSubCategory('')
    setAmount('')
    setNav('')
    setSourceAccountId('')
  }

  const handleSave = async () => {
    if (!user || !fundName || !amount || !nav || !sourceAccountId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields, including source account.' })
        return
    }

    const investedAmount = parseFloat(amount)
    const currentNav = parseFloat(nav)

    if (investedAmount <= 0 || currentNav <= 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Amount and NAV must be positive numbers.' })
        return;
    }
    const units = investedAmount / currentNav

    try {
        await runTransaction(firestore, async (transaction) => {
            const now = new Date().toISOString()

            // 1. Get source account and check balance
            const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', sourceAccountId);
            const bankAccountDoc = await transaction.get(bankAccountRef);

            if (!bankAccountDoc.exists()) {
                throw new Error("Source bank account not found.");
            }
            if (bankAccountDoc.data().currentBalance < investedAmount) {
                throw new Error("Insufficient funds in the source account.");
            }

            // 2. Create investment documents
            const newInvestmentRef = doc(collection(firestore, 'users', user.uid, 'investments'));
            const investmentData: Omit<Investment, 'id'> = {
                userId: user.uid, fundName, fundHouse, category, subCategory,
                units, investedAmount, currentValue: investedAmount,
                createdAt: now, updatedAt: now,
            }
            transaction.set(newInvestmentRef, investmentData);

            const newInvTxRef = doc(collection(firestore, 'users', user.uid, 'investmentTransactions'));
            const invTxData: Omit<InvestmentTransaction, 'id'> = {
                userId: user.uid, investmentId: newInvestmentRef.id, type: 'buy',
                transactionDate: now, amount: investedAmount, nav: currentNav, units,
            }
            transaction.set(newInvTxRef, invTxData);
            
            // 3. Create a general ledger transaction
            const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
            const ledgerTxData: Omit<Transaction, 'id'> = {
                userId: user.uid,
                type: 'investment',
                amount: investedAmount,
                description: `Investment in ${fundName}`,
                transactionDate: now,
                fromBankAccountId: sourceAccountId,
            }
            transaction.set(newTransactionRef, ledgerTxData)

            // 4. Update bank account balance
            const newBalance = bankAccountDoc.data().currentBalance - investedAmount;
            transaction.update(bankAccountRef, { currentBalance: newBalance, updatedAt: now });

        })
      
        toast({ title: 'Investment Added', description: `${fundName} has been added to your portfolio.` })
        resetForm()
        setOpen(false)
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not save investment.' })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Investment</DialogTitle>
          <DialogDescription>Add a new lump-sum mutual fund investment.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fund-name" className="text-right">Fund Name</Label>
            <Input id="fund-name" value={fundName} onChange={e => setFundName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fund-house" className="text-right">Fund House</Label>
            <Input id="fund-house" value={fundHouse} onChange={e => setFundHouse(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as any)}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Equity">Equity</SelectItem>
                <SelectItem value="Debt">Debt</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sub-category" className="text-right">Sub-category</Label>
            <Input id="sub-category" placeholder="e.g. Large Cap" value={subCategory} onChange={e => setSubCategory(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">Amount</Label>
            <Input id="amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="nav" className="text-right">NAV</Label>
            <Input id="nav" type="number" value={nav} onChange={e => setNav(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source-account" className="text-right">Source</Label>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId} disabled={loadingBankAccounts}>
              <SelectTrigger id="source-account" className="col-span-3"><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={loadingBankAccounts}>Save Investment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
