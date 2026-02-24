'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal, Bell, CreditCard as CreditCardIcon, FileText, PlusCircle, Edit, Trash2 } from 'lucide-react'
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
import type { CreditCard as CreditCardType } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function CreditCardManagement() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const creditCardsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
    [firestore, user]
  )
  const { data: creditCards, isLoading } = useCollection<CreditCardType>(creditCardsQuery)

  const handleDelete = (cardId: string, cardName: string) => {
    if (!user) return;
    const docRef = doc(firestore, 'users', user.uid, 'creditCards', cardId)
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Credit Card Deleted',
      description: `${cardName} has been removed from your accounts.`,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
            <div className="space-y-6">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
            </div>
        ) : creditCards && creditCards.length > 0 ? (
          creditCards.map((card) => {
            const utilization = (card.currentBalance / card.creditLimit) * 100
            const utilizationColor =
              utilization > 75
                ? 'bg-red-500'
                : utilization > 40
                ? 'bg-yellow-500'
                : 'bg-green-500'

            return (
              <Card key={card.id} className="p-6 rounded-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{card.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Limit: {formatCurrency(card.creditLimit)}
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
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
                          credit card account and all of its associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(card.id, card.name)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(card.currentBalance)}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {utilization.toFixed(0)}% Used
                    </p>
                  </div>
                  <Progress
                    value={utilization}
                    className="h-2 mt-2"
                    indicatorClassName={utilizationColor}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Billing Date</p>
                    <p className="font-medium">N/A</p> 
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(card.statementDueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum Due</p>
                    <p className="font-medium">{formatCurrency(card.currentBalance * 0.05)}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Button size="sm">
                    <CreditCardIcon className="mr-2 h-4 w-4" /> Pay Bill
                  </Button>
                  <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
                  </Button>
                  <Button size="sm" variant="ghost">
                    <FileText className="mr-2 h-4 w-4" /> View Statement
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Bell className="mr-2 h-4 w-4" /> Set Reminder
                  </Button>
                </div>
              </Card>
            )
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No credit cards found.</p>
            <p className="text-sm text-muted-foreground">Add a new card to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
