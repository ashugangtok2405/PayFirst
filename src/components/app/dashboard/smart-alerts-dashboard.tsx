'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Zap, TrendingDown, ArrowRight } from 'lucide-react'

// MOCK DATA
const alerts = [
  {
    id: 1,
    icon: AlertCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50',
    title: 'High Credit Utilization',
    description: 'Your HDFC card is at 85% utilization.',
  },
  {
    id: 2,
    icon: TrendingDown,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50',
    title: 'Category Overspending',
    description: 'You have spent 120% of your budget on Food.',
  },
  {
    id: 3,
    icon: Zap,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    title: 'Low Account Balance',
    description: 'Your ICICI account balance is low.',
  },
]

export function SmartAlertsDashboard() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Smart Alerts</CardTitle>
        <CardDescription>Proactive insights on your finances.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon
          return (
            <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${alert.bgColor}`}>
                <Icon className={`h-5 w-5 ${alert.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{alert.title}</p>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
              </div>
            </div>
          )
        })}
        <Button variant="link" className="w-full text-primary">
          View All Alerts <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
