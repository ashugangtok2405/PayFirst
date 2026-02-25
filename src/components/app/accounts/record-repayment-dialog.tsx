'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser } from '@/firebase'
import { collection, doc, runTransaction } from 'firebase/firestore'
import type { BankAccount, PersonalDebt, Repayment } from '@/lib/types'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

export function RecordRepaymentDialog({ children, debt }: { children: React.ReactNode, debt: PersonalDebt }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [repaymentDate, setRepaymentDate] = useState(format(new Date(), 'dd/MM/yyyy'))
  const [notes, setNotes] = useState('')
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  
  const handlePayment = async () => {
    if (!user || !amount || !repaymentDate) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' })
        return
    }

    let parsedDate: Date;
    try {
        const dateParts = repaymentDate.split('/');
        if (dateParts.length !== 3) throw new Error();
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const year = parseInt(dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2], 10);
        parsedDate = new Date(year, month, day);
        if (isNaN(parsedDate.getTime())) throw new Error();
    } catch {
        toast({ variant: 'destructive', title: 'Invalid Date', description: 'Please use DD/MM/YYYY format.' });
        return;
    }

    const repaymentAmount = parseFloat(amount);
    if (repaymentAmount <= 0) {
        toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Amount must be positive.' })
        return
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const debtRef = doc(firestore, 'users', user.uid, 'personalDebts', debt.id);
            const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', debt.linkedAccountId);
            const repaymentRef = doc(collection(firestore, 'users', user.uid, 'personalDebts', debt.id, 'repayments'));

            const debtDoc = await transaction.get(debtRef);
            const bankAccountDoc = await transaction.get(bankAccountRef);
            if (!debtDoc.exists() || !bankAccountDoc.exists()) throw new Error("Debt or linked account not found.");
            
            const currentDebt = debtDoc.data() as PersonalDebt;
            const currentBank = bankAccountDoc.data() as BankAccount;

            if (repaymentAmount > currentDebt.remainingAmount) throw new Error(`Repayment cannot exceed remaining amount of ${formatCurrency(currentDebt.remainingAmount)}`);
            
            const newRemaining = currentDebt.remainingAmount - repaymentAmount;
            const newStatus = newRemaining <= 0 ? 'closed' : 'active';
            
            let newBankBalance;
            if(debt.type === 'lent') {
                newBankBalance = currentBank.currentBalance + repaymentAmount;
            } else { // borrowed
                newBankBalance = currentBank.currentBalance - repaymentAmount;
                if (newBankBalance < 0) throw new Error("Insufficient funds for repayment.");
            }

            // Update bank balance
            transaction.update(bankAccountRef, { currentBalance: newBankBalance });

            // Update debt
            transaction.update(debtRef, { remainingAmount: newRemaining, status: newStatus, updatedAt: new Date().toISOString() });
            
            // Create repayment record
            const newRepayment: Omit<Repayment, 'id'> = {
                debtId: debt.id, userId: user.uid, amount: repaymentAmount,
                repaymentDate: parsedDate.toISOString(), notes: notes || ''
            }
            transaction.set(repaymentRef, newRepayment);
        });

        toast({ title: 'Repayment Recorded', description: `${formatCurrency(repaymentAmount)} has been successfully recorded.` });
        setOpen(false);

    } catch (error: any) {
        console.error("Repayment failed: ", error);
        toast({ variant: 'destructive', title: 'Repayment Failed', description: error.message || 'An unexpected error occurred.' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Repayment</DialogTitle>
          <DialogDescription>
            For {debt.type === 'lent' ? 'money you lent to' : 'money you borrowed from'} <strong>{debt.personName}</strong>.
            Remaining: {formatCurrency(debt.remainingAmount)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" placeholder={formatCurrency(debt.remainingAmount)} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
           <div className="space-y-2">
              <Label htmlFor="repayment-date">Repayment Date</Label>
              <Input
                id="repayment-date"
                value={repaymentDate}
                onChange={(e) => setRepaymentDate(e.target.value)}
                placeholder="DD/MM/YYYY"
              />
           </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" placeholder="e.g., Partial payment" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handlePayment}>Confirm Repayment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
