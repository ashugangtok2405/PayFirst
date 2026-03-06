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
import { useFirestore, useUser } from '@/firebase'
import { collection, addDoc, runTransaction, doc } from 'firebase/firestore'
import type { Investment, InvestmentTransaction } from '@/lib/types'

export function AddInvestmentDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [fundName, setFundName] = useState('')
  const [fundHouse, setFundHouse] = useState('')
  const [category, setCategory] = useState<'Equity' | 'Debt' | 'Hybrid' | 'Other'>('Equity')
  const [subCategory, setSubCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [nav, setNav] = useState('')

  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const handleSave = async () => {
    if (!user || !fundName || !amount || !nav) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' })
        return
    }

    const investedAmount = parseFloat(amount)
    const currentNav = parseFloat(nav)
    const units = investedAmount / currentNav

    try {
        await runTransaction(firestore, async (transaction) => {
            const now = new Date().toISOString()

            const newInvestmentRef = doc(collection(firestore, 'users', user.uid, 'investments'));
            
            const investmentData: Omit<Investment, 'id'> = {
                userId: user.uid,
                fundName,
                fundHouse,
                category,
                subCategory,
                units,
                investedAmount,
                currentValue: investedAmount, // Initially current value is invested amount
                createdAt: now,
                updatedAt: now,
            }
            transaction.set(newInvestmentRef, investmentData);

            const newTxRef = doc(collection(firestore, 'users', user.uid, 'investmentTransactions'));
            const txData: Omit<InvestmentTransaction, 'id'> = {
                userId: user.uid,
                investmentId: newInvestmentRef.id,
                type: 'buy',
                transactionDate: now,
                amount: investedAmount,
                nav: currentNav,
                units,
            }
            transaction.set(newTxRef, txData);
        })
      
        toast({ title: 'Investment Added', description: `${fundName} has been added to your portfolio.` })
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Investment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
