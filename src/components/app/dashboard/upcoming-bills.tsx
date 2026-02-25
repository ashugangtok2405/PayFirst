'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

// MOCK DATA
const upcomingBills = [
  { id: 1, name: 'HDFC Credit Card', dueDate: 'July 25, 2024', amount: 12450 },
  { id: 2, name: 'Netflix Subscription', dueDate: 'July 28, 2024', amount: 499 },
  { id: 3, name: 'Mobile Recharge', dueDate: 'August 02, 2024', amount: 719 },
]

export function UpcomingBills() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Upcoming Bills</CardTitle>
        <CardDescription>Bills due in the next 30 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {upcomingBills.map((bill, index) => (
            <li key={bill.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">Due: {bill.dueDate}</p>
                </div>
                <p className="font-bold text-sm">{formatCurrency(bill.amount)}</p>
              </div>
              {index < upcomingBills.length - 1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
