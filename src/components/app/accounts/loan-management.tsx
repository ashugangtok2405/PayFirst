'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal, Edit, Trash2, BadgeIndianRupee, PlusCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from '@/firebase'
import { collection, doc } from 'firebase/firestore'
import type { Loan } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { PayEmiDialog } from './pay-emi-dialog'
import { AddAccountDialog } from './add-account-dialog'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function LoanManagement() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const loansQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'loans') : null,
    [firestore, user?.uid]
  )
  const { data: loans, isLoading } = useCollection<Loan>(loansQuery)

  const { totalLoanOutstanding, totalMonthlyEMI } = useMemo(() => {
    if (!loans) return { totalLoanOutstanding: 0, totalMonthlyEMI: 0 }
    const activeLoans = loans.filter(l => l.outstanding > 0);
    const totalLoanOutstanding = activeLoans.reduce((sum, loan) => sum + loan.outstanding, 0)
    const totalMonthlyEMI = activeLoans.reduce((sum, loan) => sum + loan.emiAmount, 0)
    return { totalLoanOutstanding, totalMonthlyEMI }
  }, [loans])

  const handleDelete = (loanId: string, loanName: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'loans', loanId)
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Loan Deleted',
      description: `${loanName} has been removed from your accounts.`,
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle>Loan Management</CardTitle>
          {!isLoading && loans && loans.length > 0 && (
            <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-x-4 gap-y-1 mt-2">
              <span>Total Outstanding: <span className="font-semibold text-foreground">{formatCurrency(totalLoanOutstanding)}</span></span>
              <span>Total EMI / Month: <span className="font-semibold text-foreground">{formatCurrency(totalMonthlyEMI)}</span></span>
            </div>
          )}
        </div>
        <AddAccountDialog accountType="loan">
            <Button variant="outline" size="sm" className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Loan
            </Button>
        </AddAccountDialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
            <div className="space-y-6">
                {[...Array(1)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
            </div>
        ) : loans && loans.length > 0 ? (
          loans.map((loan) => {
            const paidPercentage = ((loan.originalAmount - loan.outstanding) / loan.originalAmount) * 100

            return (
              <Card key={loan.id} className="p-6 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{loan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Original Amount: {formatCurrency(loan.originalAmount)}
                    </p>
                  </div>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AddAccountDialog mode="edit" account={loan} accountType="loan">
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                        </AddAccountDialog>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-red-500 focus:text-red-500">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your
                          loan account and all of its associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(loan.id, loan.name)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding Principal</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(loan.outstanding)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {paidPercentage.toFixed(0)}% Paid
                    </p>
                  </div>
                  <Progress
                    value={paidPercentage}
                    className="h-2 mt-2"
                    indicatorClassName="bg-primary"
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Next EMI</p>
                    <p className="font-medium">{formatCurrency(loan.emiAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(loan.nextDueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Months Left</p>
                    <p className="font-medium">{loan.remainingMonths}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <PayEmiDialog loan={loan}>
                    <Button size="sm">
                      <BadgeIndianRupee className="mr-2 h-4 w-4" /> Pay EMI
                    </Button>
                  </PayEmiDialog>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-10 space-y-4">
            <div>
              <p className="text-muted-foreground">No loans found.</p>
              <p className="text-sm text-muted-foreground">Add a new loan to get started.</p>
            </div>
            <AddAccountDialog accountType="loan">
              <Button><PlusCircle className="mr-2 h-4 w-4"/>Add Your First Loan</Button>
            </AddAccountDialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

    
