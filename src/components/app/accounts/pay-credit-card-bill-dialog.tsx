'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, runTransaction } from 'firebase/firestore'
import type { BankAccount, CreditCard } from '@/lib/types'
import { CreditCard as CreditCardIcon } from 'lucide-react'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

export function PayCreditCardBillDialog({ children, card }: { children: React.ReactNode, card: CreditCard }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [fromAccountId, setFromAccountId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user?.uid])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  useEffect(() => {
    if (open) {
      setAmount('')
      setFromAccountId('')
      setIsSubmitting(false)
    }
  }, [open])

  const handlePayment = async () => {
    if (!user || !fromAccountId || !amount) {
      toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' })
      return
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Payment amount must be positive.' })
      return
    }
    if (paymentAmount > card.currentBalance) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: `Payment cannot exceed outstanding balance of ${formatCurrency(card.currentBalance)}.` })
      return
    }
    
    setIsSubmitting(true)

    try {
      await runTransaction(firestore, async (transaction) => {
        const cardRef = doc(firestore, 'users', user.uid, 'creditCards', card.id)
        const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId)
        const newTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'))
        
        const cardDoc = await transaction.get(cardRef)
        const bankAccountDoc = await transaction.get(bankAccountRef)

        if (!cardDoc.exists()) throw new Error('Credit card not found.')
        if (!bankAccountDoc.exists()) throw new Error('Bank account not found.')
        
        const currentCardData = cardDoc.data()
        const currentBankData = bankAccountDoc.data()

        if (paymentAmount > currentCardData.currentBalance) {
            throw new Error(`Payment amount exceeds current outstanding balance of ${formatCurrency(currentCardData.currentBalance)}.`)
        }
        if (currentBankData.currentBalance < paymentAmount) {
            throw new Error(`Insufficient funds in ${currentBankData.name}.`)
        }

        // Update card and bank balances
        transaction.update(cardRef, { currentBalance: currentCardData.currentBalance - paymentAmount, updatedAt: new Date().toISOString() })
        transaction.update(bankAccountRef, { currentBalance: currentBankData.currentBalance - paymentAmount, updatedAt: new Date().toISOString() })
        
        // Create transaction record
        transaction.set(newTransactionRef, {
            userId: user.uid,
            type: 'credit_card_payment',
            amount: paymentAmount,
            description: `Payment for ${card.name}`,
            transactionDate: new Date().toISOString(),
            fromBankAccountId: fromAccountId,
            toCreditCardId: card.id,
        })
      })

      toast({ title: 'Payment Successful', description: `${formatCurrency(paymentAmount)} paid for ${card.name}.` })
      setOpen(false)
    } catch (error: any) {
      console.error("Payment failed:", error)
      toast({ variant: 'destructive', title: 'Payment Failed', description: error.message || 'An unexpected error occurred.' })
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Bill for {card.name}</DialogTitle>
          <DialogDescription>Outstanding Balance: {formatCurrency(card.currentBalance)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                <Input id="amount" type="number" placeholder={card.currentBalance.toString()} value={amount} onChange={e => setAmount(e.target.value)} className="pl-7" />
            </div>
            <div className="flex justify-end gap-2 mt-2">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setAmount((card.currentBalance * 0.05).toFixed(2))}>Min. Due</Button>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setAmount(card.currentBalance.toString())}>Full Amount</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-account">Pay From</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId} disabled={loadingBankAccounts}>
              <SelectTrigger id="from-account"><SelectValue placeholder="Select bank account" /></SelectTrigger>
              <SelectContent>
                {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handlePayment} disabled={isSubmitting || loadingBankAccounts}>
            {isSubmitting ? "Processing..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
