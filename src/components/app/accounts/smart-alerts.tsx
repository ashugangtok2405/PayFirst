'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CalendarClock, Ban, Info } from 'lucide-react'

const alerts = [
  {
    id: 'alert1',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    title: 'Credit Card Limit',
    description: 'Your HDFC Millennia card is nearing its limit (85% used).',
  },
  {
    id: 'alert2',
    icon: CalendarClock,
    iconColor: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
    title: 'Upcoming Due Date',
    description: 'ICICI Amazon Pay bill of ₹15,000 is due in 3 days.',
  },
  {
    id: 'alert3',
    icon: Ban,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    title: 'Low Balance',
    description: 'Your secondary savings account has a low balance.',
  },
    {
    id: 'alert4',
    icon: Info,
    iconColor: 'text-gray-500',
    bgColor: 'bg-gray-50',
    title: 'Inactive Account',
    description: 'Your Axis Bank account has not been used in 60 days.',
  },
]

export function SmartAlerts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon
          return (
            <div key={alert.id} className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${alert.bgColor}`}>
                <Icon className={`h-5 w-5 ${alert.iconColor}`} />
              </div>
              <div>
                <p className="font-semibold">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
