'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Zap, ArrowRight, ShieldCheck, CalendarClock } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import type { Alert } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

export function SmartAlertsDashboard() {
  const { user } = useUser()
  const firestore = useFirestore()
  const [showAll, setShowAll] = useState(false)

  const alertsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'alerts'),
            orderBy('createdAt', 'desc')
          )
        : null,
    [user, firestore]
  )
  const { data: allAlerts, isLoading } = useCollection<Alert>(alertsQuery)
  const alerts = useMemo(() => allAlerts?.filter((a) => !a.resolved), [allAlerts])

  const alertConfig: Record<Alert['severity'], { icon: React.ElementType; iconColor: string; bgColor: string }> = {
    critical: { icon: AlertCircle, iconColor: 'text-red-500', bgColor: 'bg-red-50' },
    warning: { icon: Zap, iconColor: 'text-orange-500', bgColor: 'bg-orange-50' },
    info: { icon: CalendarClock, iconColor: 'text-blue-500', bgColor: 'bg-blue-50' },
  }

  const renderLoading = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )

  const renderNoAlerts = () => (
    <div className="flex flex-col items-center justify-center text-center py-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50">
        <ShieldCheck className="h-6 w-6 text-green-500" />
      </div>
      <p className="mt-4 font-semibold">All Clear!</p>
      <p className="text-sm text-muted-foreground">No financial risks detected.</p>
    </div>
  )

  const renderAlerts = () => {
    if (!alerts) return null
    const alertsToShow = showAll ? alerts : alerts.slice(0, 3)

    return (
      <div className="space-y-4">
        {alertsToShow.map((alert) => {
          const config = alertConfig[alert.severity]
          const Icon = config.icon
          return (
            <div key={alert.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
              >
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{alert.message}</p>
                <p className="text-xs text-muted-foreground">{alert.title}</p>
              </div>
            </div>
          )
        })}
        {alerts.length > 3 && !showAll && (
          <Button variant="link" className="w-full text-primary" onClick={() => setShowAll(true)}>
            View all {alerts.length} alerts <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {alerts.length > 3 && showAll && (
          <p className="text-sm text-center text-muted-foreground pt-2">No more alerts to show.</p>
        )}
      </div>
    )
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Smart Alerts</CardTitle>
        <CardDescription>Proactive insights on your finances.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? renderLoading() : alerts && alerts.length > 0 ? renderAlerts() : renderNoAlerts()}
      </CardContent>
    </Card>
  )
}
