'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser } from '@/firebase'
import { collection, doc, runTransaction } from 'firebase/firestore'
import type { BankAccount, PersonalDebt, Repayment } from '@/lib/types'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

export function RecordRepaymentDialog({ children, debt }: { children: React.ReactNode, debt: PersonalDebt }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [repaymentDate, setRepaymentDate] = useState<Date | undefined>(new Date())
  const [notes, setNotes] = useState('')
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  
  const handlePayment = async () => {
    if (!user || !amount || !repaymentDate) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out all fields.' })
        return
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
                repaymentDate: repaymentDate.toISOString(), notes: notes || ''
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
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
          if (e.target instanceof HTMLElement && e.target.closest('[data-radix-popper-content-wrapper]')) e.preventDefault();
        }}>
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
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{repaymentDate ? format(repaymentDate, 'LLL dd, y') : <span>Pick a date</span>}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={repaymentDate} onSelect={setRepaymentDate} initialFocus/></PopoverContent>
              </Popover>
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
