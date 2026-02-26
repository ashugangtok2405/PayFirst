'use client'

import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { Bell, CircleAlert, Info, TriangleAlert } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase'
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import type { Alert } from '@/lib/types'

const severityIcons = {
  critical: <CircleAlert className="h-4 w-4 text-red-500" />,
  warning: <TriangleAlert className="h-4 w-4 text-orange-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
}

export function NotificationBell() {
  const router = useRouter()
  const { user } = useUser()
  const firestore = useFirestore()

  const alertsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'alerts'),
            orderBy('createdAt', 'desc')
          )
        : null,
    [user?.uid, firestore]
  )

  const { data: allAlerts, isLoading } = useCollection<Alert>(alertsQuery)
  const alerts = useMemo(() => allAlerts?.filter((a) => !a.resolved), [allAlerts])
  const unreadCount = useMemo(() => alerts?.filter((a) => !a.isRead).length ?? 0, [alerts])

  const handleAlertClick = (alert: Alert) => {
    if (!user) return
    const alertRef = doc(firestore, 'users', user.uid, 'alerts', alert.id)
    if (!alert.isRead) {
      updateDoc(alertRef, { isRead: true })
    }
    if (alert.actionLink) {
      router.push(alert.actionLink)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user || !alerts || unreadCount === 0) return

    const batch = writeBatch(firestore)
    alerts.forEach((alert) => {
      if (!alert.isRead) {
        const alertRef = doc(firestore, 'users', user.uid, 'alerts', alert.id)
        batch.update(alertRef, { isRead: true })
      }
    })
    await batch.commit()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex items-center justify-between p-2">
          <span className="font-semibold">Notifications</span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading && (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {!isLoading && alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-3 focus:bg-accent cursor-pointer',
                  !alert.isRead && 'bg-blue-50/50 dark:bg-blue-900/20'
                )}
                onSelect={(e) => {
                  e.preventDefault() // Prevent dropdown from closing immediately
                  handleAlertClick(alert)
                }}
              >
                {!alert.isRead && (
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                )}
                <div className={cn(alert.isRead && 'pl-4')}>
                  {severityIcons[alert.severity]}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {alert.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(alert.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            !isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                You have no new notifications.
              </div>
            )
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center p-2 text-sm font-medium text-primary cursor-pointer">
          View all alerts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
