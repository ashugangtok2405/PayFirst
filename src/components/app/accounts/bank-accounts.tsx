'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, PlusCircle, ArrowRightLeft, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const bankAccounts = [
  {
    id: 'acc1',
    bankName: 'HDFC Bank',
    accountType: 'Savings Account',
    balance: 525000,
    monthlyInflow: 80000,
    monthlyOutflow: 35000,
    lastUpdated: '2 days ago',
    transactions: [
      { id: 't1', date: '2024-07-22', description: 'Salary Credit', type: 'income', amount: 80000 },
      { id: 't2', date: '2024-07-21', description: 'Rent Payment', type: 'expense', amount: 25000 },
      { id: 't3', date: '2024-07-20', description: 'Zomato', type: 'expense', amount: 850 },
      { id: 't4', date: '2024-07-19', description: 'Online Shopping', type: 'expense', amount: 4200 },
      { id: 't5', date: '2024-07-18', description: 'Freelance Payment', type: 'income', amount: 15000 },
    ],
  },
  {
    id: 'acc2',
    bankName: 'ICICI Bank',
    accountType: 'Current Account',
    balance: 315500,
    monthlyInflow: 120000,
    monthlyOutflow: 95000,
    lastUpdated: '1 day ago',
    transactions: [
      { id: 't6', date: '2024-07-22', description: 'Client Payment', type: 'income', amount: 50000 },
      { id: 't7', date: '2024-07-21', description: 'Software Subscription', type: 'expense', amount: 10000 },
    ]
  },
]

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function BankAccounts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {bankAccounts.map((account) => (
            <AccordionItem value={account.id} key={account.id} className="border-b-0">
                <Card className="rounded-xl">
                    <div className="p-6">
                        <AccordionTrigger className="w-full p-0 hover:no-underline">
                                <div className="flex-1 text-left">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h4 className="font-semibold">{account.bankName}</h4>
                                            <p className="text-sm text-muted-foreground">{account.accountType}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold">{formatCurrency(account.balance)}</p>
                                            <p className="text-xs text-muted-foreground">Last updated {account.lastUpdated}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-between text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Inflow: </span>
                                            <span className="font-medium text-green-600">{formatCurrency(account.monthlyInflow)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Outflow: </span>
                                            <span className="font-medium text-red-600">{formatCurrency(account.monthlyOutflow)}</span>
                                        </div>
                                    </div>
                                </div>
                        </AccordionTrigger>
                        <div className="mt-4 flex items-center gap-2">
                            <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Transaction</Button>
                            <Button size="sm" variant="outline"><ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer</Button>
                            <Button size="sm" variant="ghost"><History className="mr-2 h-4 w-4" /> View History</Button>
                        </div>
                    </div>
                    <AccordionContent className="px-6 pb-6">
                        <h5 className="font-semibold mb-2">Recent Transactions</h5>
                        <Table>
                            <TableBody>
                                {account.transactions.map((tx) => (
                                <TableRow key={tx.id}>
                                    <TableCell>
                                        <p className="font-medium">{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </Card>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
