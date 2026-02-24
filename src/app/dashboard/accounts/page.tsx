import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ACCOUNTS, CREDIT_CARDS } from '@/lib/data'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export default function AccountsPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
                {ACCOUNTS.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="font-medium">{account.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {account.bank}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className="text-xs" variant="outline">
                        {account.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">${account.balance.toLocaleString()}</TableCell>
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                {CREDIT_CARDS.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <div className="font-medium">{card.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        ending in {card.last4}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                       {card.issuer}
                    </TableCell>
                    <TableCell className="text-right">${card.outstanding.toLocaleString()}</TableCell>
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
