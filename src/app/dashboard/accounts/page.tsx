'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, CreditCard } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

function BankAccountsTable() {
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null,
    [firestore, user]
  )
  const { data: bankAccounts, isLoading } = useCollection<BankAccount>(bankAccountsQuery)

  return (
    <Card>
      <CardHeader className="px-7">
        <CardTitle>Bank Accounts</CardTitle>
        <CardDescription>Your connected bank and savings accounts.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <>
                <TableRow>
                  <TableCell colSpan={4}><Skeleton className="h-8" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}><Skeleton className="h-8" /></TableCell>
                </TableRow>
              </>
            )}
            {!isLoading && bankAccounts?.map((account) => (
              <TableRow key={account.id}>
                <TableCell>
                  <div className="font-medium">{account.name}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {account.bankName}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className="text-xs" variant="outline">
                    {account.isSavingsAccount ? 'Savings' : 'Checking'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">${account.currentBalance.toLocaleString()}</TableCell>
                 <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
              </TableRow>
            ))}
            {!isLoading && bankAccounts?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No bank accounts added yet.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function CreditCardsTable() {
    const firestore = useFirestore()
    const { user } = useUser()
  
    const creditCardsQuery = useMemoFirebase(
      () => user ? collection(firestore, 'users', user.uid, 'creditCards') : null,
      [firestore, user]
    )
    const { data: creditCards, isLoading } = useCollection<CreditCard>(creditCardsQuery)
  
    return (
      <Card>
        <CardHeader className="px-7">
          <CardTitle>Credit Cards</CardTitle>
          <CardDescription>Your connected credit cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card</TableHead>
                <TableHead className="hidden sm:table-cell">Issuer</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                 <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading && (
              <>
                <TableRow>
                  <TableCell colSpan={4}><Skeleton className="h-8" /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}><Skeleton className="h-8" /></TableCell>
                </TableRow>
              </>
            )}
              {!isLoading && creditCards?.map((card) => (
                <TableRow key={card.id}>
                  <TableCell>
                    <div className="font-medium">{card.name}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      ending in {card.lastFourDigits}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                     {card.issuer}
                  </TableCell>
                  <TableCell className="text-right">${card.currentBalance.toLocaleString()}</TableCell>
                   <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                </TableRow>
              ))}
              {!isLoading && creditCards?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No credit cards added yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

export default function AccountsPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <BankAccountsTable />
        <CreditCardsTable />
      </div>
    </div>
  )
}
