import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TRANSACTIONS } from '@/lib/data'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function RecentTransactions() {
  const recentTransactions = [...TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="grid gap-2">
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>An overview of your latest financial activity.</CardDescription>
        </div>
        <Button asChild size="sm" className="ml-auto gap-1">
            <Link href="/dashboard/transactions">
              View All
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</div>
                </TableCell>
                <TableCell className={`text-right ${transaction.type === 'income' ? 'text-green-500' : ''}`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
