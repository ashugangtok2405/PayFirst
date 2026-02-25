'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal, Edit, Trash2, ArrowUpRight, ArrowDownLeft, HandCoins } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import type { PersonalDebt } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { RecordRepaymentDialog } from './record-repayment-dialog'

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

export function PersonalDebtManagement() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const personalDebtsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'personalDebts') : null, [firestore, user])
  const { data: allDebts, isLoading } = useCollection<PersonalDebt>(personalDebtsQuery)

  const debts = useMemo(() => allDebts?.filter(d => d.status === 'active') ?? [], [allDebts])
  const debtsLent = useMemo(() => debts.filter(d => d.type === 'lent'), [debts])
  const debtsBorrowed = useMemo(() => debts.filter(d => d.type === 'borrowed'), [debts])

  const handleDelete = (debt: PersonalDebt) => {
    if (!user) return;
    if (debt.remainingAmount < debt.originalAmount) {
      toast({ variant: 'destructive', title: 'Deletion Failed', description: 'Cannot delete a debt with existing repayments.' });
      return;
    }
    const docRef = doc(firestore, 'users', user.uid, 'personalDebts', debt.id)
    deleteDocumentNonBlocking(docRef);
    toast({ title: 'Debt Record Deleted', description: `Record with ${debt.personName} has been removed.` })
  }
  
  const DebtCard = ({ debt }: { debt: PersonalDebt }) => {
    const paidPercentage = ((debt.originalAmount - debt.remainingAmount) / debt.originalAmount) * 100
    const isLent = debt.type === 'lent';

    return (
        <Card className="p-6 rounded-xl">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-semibold">{debt.personName}</h4>
                <p className="text-sm text-muted-foreground">Original: {formatCurrency(debt.originalAmount)}</p>
            </div>
            <AlertDialog>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /><span>Edit</span></DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-500 focus:text-red-500"><Trash2 className="mr-2 h-4 w-4" /><span>Delete</span></DropdownMenuItem></AlertDialogTrigger>
                </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete this debt record.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(debt)}>Delete</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
            </AlertDialog>
        </div>
        <div className="mt-4">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-xs text-muted-foreground">{isLent ? 'Amount you are owed' : 'Amount you owe'}</p>
                    <p className="text-2xl font-bold">{formatCurrency(debt.remainingAmount)}</p>
                </div>
                <p className="text-sm font-medium">{paidPercentage.toFixed(0)}% Paid</p>
            </div>
            <Progress value={paidPercentage} className="h-2 mt-2" indicatorClassName={isLent ? 'bg-green-500' : 'bg-orange-500'}/>
        </div>
        {debt.dueDate && <div className="mt-4 text-xs text-muted-foreground">Due: {new Date(debt.dueDate).toLocaleDateString()}</div>}
        <div className="mt-6 flex flex-wrap items-center gap-2">
            <RecordRepaymentDialog debt={debt}>
                <Button size="sm"><HandCoins className="mr-2 h-4 w-4" /> Record Repayment</Button>
            </RecordRepaymentDialog>
        </div>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Lending & Borrowing</CardTitle>
        <CardDescription>Track money you've lent to or borrowed from others.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
            <div className="space-y-6"> {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)} </div>
        ) : (
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><ArrowUpRight className="text-green-500"/>Money You've Lent</h3>
                    {debtsLent.length > 0 ? (
                        <div className="space-y-4">{debtsLent.map(d => <DebtCard key={d.id} debt={d} />)}</div>
                    ) : <p className="text-sm text-center text-muted-foreground py-4">You haven't recorded any money lent to others.</p>}
                </div>
                 <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-4"><ArrowDownLeft className="text-orange-500"/>Money You've Borrowed</h3>
                    {debtsBorrowed.length > 0 ? (
                        <div className="space-y-4">{debtsBorrowed.map(d => <DebtCard key={d.id} debt={d} />)}</div>
                    ) : <p className="text-sm text-center text-muted-foreground py-4">You haven't recorded any money borrowed from others.</p>}
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
