'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CalendarClock, Ban, ShieldCheck, Zap, X } from 'lucide-react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, doc, updateDoc } from 'firebase/firestore'
import type { Alert } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const alertIcons = {
  critical: AlertCircle,
  warning: Zap,
  info: CalendarClock,
  default: Ban,
}

const alertColors = {
  critical: { icon: 'text-red-500', bg: 'bg-red-50' },
  warning: { icon: 'text-orange-500', bg: 'bg-orange-50' },
  info: { icon: 'text-blue-500', bg: 'bg-blue-50' },
}

export function SmartAlerts() {
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const alertsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'alerts'),
            where('resolved', '==', false)
          )
        : null,
    [user?.uid, firestore]
  )

  const { data: alerts, isLoading } = useCollection<Alert>(alertsQuery)

  const handleDismiss = async (alertId: string) => {
    if (!user) return
    const alertRef = doc(firestore, 'users', user.uid, 'alerts', alertId)
    try {
      await updateDoc(alertRef, { resolved: true })
      toast({
        title: 'Alert Dismissed',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not dismiss the alert.',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="flex h-10 w-10 shrink-0 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : alerts && alerts.length > 0 ? (
          alerts.map((alert) => {
            const Icon = alertIcons[alert.severity] || alertIcons.default
            const colors = alertColors[alert.severity]
            return (
              <div key={alert.id} className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors.bg}`}
                >
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-muted"
                  onClick={() => handleDismiss(alert.id)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss alert</span>
                </Button>
              </div>
            )
          })
        ) : (
          <div className="flex items-center text-center flex-col gap-4 py-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50">
              <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold">All Clear!</p>
              <p className="text-sm text-muted-foreground">
                You have no pending alerts.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
