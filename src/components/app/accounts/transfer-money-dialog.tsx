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
import { ArrowRightLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, runTransaction } from 'firebase/firestore'
import type { BankAccount, Transaction } from '@/lib/types'

export function TransferMoneyDialog() {
  const [open, setOpen] = useState(false)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading } = useCollection<BankAccount>(bankAccountsQuery)

  const handleTransfer = async () => {
    if (!user || !fromAccountId || !toAccountId || !amount || !date) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' })
        return
    }
    if (fromAccountId === toAccountId) {
        toast({ variant: 'destructive', title: 'Invalid Selection', description: 'From and To accounts cannot be the same.' })
        return
    }

    const transferAmount = parseFloat(amount)
    if (transferAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Transfer amount must be positive.' })
      return
    }

    setIsSubmitting(true)

    try {
      await runTransaction(firestore, async (transaction) => {
        const fromAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId)
        const toAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', toAccountId)
        const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'))

        const fromAccountDoc = await transaction.get(fromAccountRef)
        const toAccountDoc = await transaction.get(toAccountRef)

        if (!fromAccountDoc.exists()) throw new Error("Source account not found.")
        if (!toAccountDoc.exists()) throw new Error("Destination account not found.")
        
        const fromAccountData = fromAccountDoc.data()
        const toAccountData = toAccountDoc.data()

        if (fromAccountData.currentBalance < transferAmount) {
            throw new Error(`Insufficient funds in ${fromAccountData.name}.`)
        }

        const newFromBalance = fromAccountData.currentBalance - transferAmount
        const newToBalance = toAccountData.currentBalance + transferAmount
        const timestamp = new Date().toISOString()

        transaction.update(fromAccountRef, { currentBalance: newFromBalance, updatedAt: timestamp })
        transaction.update(toAccountRef, { currentBalance: newToBalance, updatedAt: timestamp })

        const transactionData: Omit<Transaction, 'id'> = {
            userId: user.uid,
            type: 'transfer',
            amount: transferAmount,
            fromBankAccountId: fromAccountId,
            toBankAccountId: toAccountId,
            transactionDate: new Date(date).toISOString(),
            description: notes || 'Fund Transfer',
        }
        transaction.set(newTransactionRef, transactionData)
      })

      toast({
        title: 'Transfer Successful',
        description: 'The money has been transferred between your accounts.',
      })
      setOpen(false)
      setFromAccountId('')
      setToAccountId('')
      setAmount('')
      setNotes('')

    } catch (error: any) {
      console.error("Transfer failed:", error)
      toast({ variant: 'destructive', title: 'Transfer Failed', description: error.message || 'An unexpected error occurred.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setFromAccountId('');
        setToAccountId('');
        setAmount('');
        setNotes('');
        setIsSubmitting(false);
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Money
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>Move funds between your accounts.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-account">From Account</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId} disabled={isLoading}>
                <SelectTrigger id="from-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-account">To Account</Label>
              <Select value={toAccountId} onValueChange={setToAccountId} disabled={isLoading}>
                <SelectTrigger id="to-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" placeholder="₹0.00" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" placeholder="e.g., For monthly investment" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleTransfer} disabled={isLoading || isSubmitting}>
            {isSubmitting ? "Processing..." : isLoading ? "Loading..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
