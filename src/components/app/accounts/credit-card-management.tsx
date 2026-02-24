'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MoreHorizontal, Bell, CreditCard as CreditCardIcon, FileText } from 'lucide-react'

const creditCards = [
  {
    id: 'cc1',
    cardName: 'HDFC Millennia',
    creditLimit: 150000,
    outstanding: 45200,
    billingDate: '20th of every month',
    dueDate: '10th of next month',
    minDue: 2260,
  },
  {
    id: 'cc2',
    cardName: 'ICICI Amazon Pay',
    creditLimit: 200000,
    outstanding: 15000,
    billingDate: '15th of every month',
    dueDate: '5th of next month',
    minDue: 750,
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

export function CreditCardManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Card Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {creditCards.map((card) => {
          const utilization = (card.outstanding / card.creditLimit) * 100
          const utilizationColor = utilization > 75 ? 'bg-red-500' : utilization > 40 ? 'bg-yellow-500' : 'bg-green-500'

          return (
            <Card key={card.id} className="p-6 rounded-xl">
              <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{card.cardName}</h4>
                    <p className="text-sm text-muted-foreground">Limit: {formatCurrency(card.creditLimit)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                  </Button>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs text-muted-foreground">Outstanding</p>
                        <p className="text-2xl font-bold">{formatCurrency(card.outstanding)}</p>
                    </div>
                    <p className="text-sm font-medium">{utilization.toFixed(0)}% Used</p>
                </div>
                <Progress value={utilization} className="h-2 mt-2" indicatorClassName={utilizationColor} />
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Billing Date</p>
                  <p className="font-medium">{card.billingDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium">{card.dueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Minimum Due</p>
                  <p className="font-medium">{formatCurrency(card.minDue)}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Button size="sm"><CreditCardIcon className="mr-2 h-4 w-4" /> Pay Bill</Button>
                <Button size="sm" variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add Expense</Button>
                <Button size="sm" variant="ghost"><FileText className="mr-2 h-4 w-4" /> View Statement</Button>
                <Button size="sm" variant="ghost"><Bell className="mr-2 h-4 w-4" /> Set Reminder</Button>
              </div>
            </Card>
          )
        })}
      </CardContent>
    </Card>
  )
}
