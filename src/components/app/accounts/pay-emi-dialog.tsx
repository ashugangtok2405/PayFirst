'use client'

import { useState, useMemo } from 'react'
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
import { collection, doc, writeBatch, runTransaction } from 'firebase/firestore'
import type { BankAccount, Loan, Category } from '@/lib/types'
import { addMonths } from 'date-fns'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)
}

export function PayEmiDialog({ children, loan }: { children: React.ReactNode, loan: Loan }) {
  const [open, setOpen] = useState(false)
  const [fromAccountId, setFromAccountId] = useState(loan.linkedBankAccountId || '')
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
  
  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user])
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

  const isLoading = loadingBankAccounts || loadingCategories

  const { interestPortion, principalPortion } = useMemo(() => {
    const monthlyInterestRate = (loan.interestRate / 100) / 12;
    const interest = loan.outstanding * monthlyInterestRate;
    const principal = loan.emiAmount - interest;
    return { interestPortion: interest, principalPortion: principal };
  }, [loan]);

  const handlePayment = async () => {
    if (!user || !fromAccountId) {
        toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please select a bank account to pay from.' })
        return
    }

    const loanInterestCategory = categories?.find(c => c.name === 'Loan Interest' && c.type === 'expense');
    if (!loanInterestCategory) {
        toast({ variant: 'destructive', title: 'Setup Required', description: '"Loan Interest" category not found. Please create it.' })
        return;
    }

    try {
        await runTransaction(firestore, async (transaction) => {
            const loanRef = doc(firestore, 'users', user.uid, 'loans', loan.id);
            const bankAccountRef = doc(firestore, 'users', user.uid, 'bankAccounts', fromAccountId);
            const interestTransactionRef = doc(collection(firestore, 'users', user.uid, 'transactions'));
            
            // 1. Get current state
            const loanDoc = await transaction.get(loanRef);
            const bankAccountDoc = await transaction.get(bankAccountRef);

            if (!loanDoc.exists()) throw new Error("Loan not found.");
            if (!bankAccountDoc.exists()) throw new Error("Bank account not found.");

            const currentLoanData = loanDoc.data() as Loan;
            const currentBankData = bankAccountDoc.data() as BankAccount;

            if (currentBankData.currentBalance < loan.emiAmount) {
                throw new Error("Insufficient funds in the selected bank account.");
            }

            // 2. Perform updates
            // Update bank balance
            transaction.update(bankAccountRef, {
                currentBalance: currentBankData.currentBalance - loan.emiAmount
            });

            // Update loan details
            const nextDueDate = addMonths(new Date(currentLoanData.nextDueDate), 1);
            transaction.update(loanRef, {
                outstanding: currentLoanData.outstanding - principalPortion,
                remainingMonths: currentLoanData.remainingMonths - 1,
                nextDueDate: nextDueDate.toISOString(),
                active: (currentLoanData.remainingMonths - 1) > 0,
            });

            // Create interest expense transaction
            transaction.set(interestTransactionRef, {
                userId: user.uid,
                type: 'expense',
                amount: interestPortion,
                description: `Interest for ${loan.name}`,
                transactionDate: new Date().toISOString(),
                categoryId: loanInterestCategory.id,
                fromBankAccountId: fromAccountId, // This is an expense from the bank account conceptually
            });
        });

        toast({
            title: 'EMI Paid Successfully',
            description: `${formatCurrency(loan.emiAmount)} paid for ${loan.name}.`,
        });
        setOpen(false);

    } catch (error: any) {
        console.error("EMI payment failed: ", error);
        toast({
            variant: 'destructive',
            title: 'Payment Failed',
            description: error.message || 'An unexpected error occurred.',
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pay EMI for {loan.name}</DialogTitle>
          <DialogDescription>Confirm the details for your EMI payment.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total EMI Amount</span>
                <span className="text-lg font-bold">{formatCurrency(loan.emiAmount)}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Principal</span>
                <span>{formatCurrency(principalPortion)}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Interest</span>
                <span>{formatCurrency(interestPortion)}</span>
             </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="from-account">Pay From Account</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId} disabled={isLoading}>
                <SelectTrigger id="from-account">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handlePayment} disabled={isLoading}>
            {isLoading ? "Loading..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
