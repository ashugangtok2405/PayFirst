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
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, Transaction } from '@/lib/types'

export function TransferMoneyDialog() {
  const [open, setOpen] = useState(false)
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10))
  const [notes, setNotes] = useState('')
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading } = useCollection<BankAccount>(bankAccountsQuery)

  const handleTransfer = () => {
    if (!user || !fromAccountId || !toAccountId || !amount || !date) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' })
        return
    }
    if (fromAccountId === toAccountId) {
        toast({ variant: 'destructive', title: 'Invalid Selection', description: 'From and To accounts cannot be the same.' })
        return
    }

    const transactionData: Partial<Transaction> = {
        userId: user.uid,
        type: 'transfer',
        amount: parseFloat(amount),
        fromBankAccountId,
        toBankAccountId,
        transactionDate: new Date(date).toISOString(),
        description: notes || 'Fund Transfer',
    }

    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'transactions'), transactionData)

    toast({
      title: 'Transfer Successful',
      description: 'The money has been transferred between your accounts.',
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button type="submit" onClick={handleTransfer} disabled={isLoading}>
            {isLoading ? "Loading..." : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
