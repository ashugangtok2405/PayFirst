'use client'

import { useState } from 'react'
import { Bell, Check, CircleAlert, Info, TriangleAlert } from 'lucide-react'
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
import { cn } from '@/lib/utils'

// Mock data - replace with real data from Firestore
const mockAlerts = [
  {
    id: '1',
    title: 'High Credit Utilization',
    message: 'Your HDFC Infinia card is at 85% utilization.',
    severity: 'critical' as const,
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    actionLink: '/dashboard/accounts',
  },
  {
    id: '2',
    title: 'Low Balance',
    message: 'Your ICICI Savings account balance is below ₹5,000.',
    severity: 'warning' as const,
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionLink: '/dashboard/accounts',
  },
  {
    id: '3',
    title: 'Upcoming Bill',
    message: 'Your Airtel Postpaid bill of ₹1,199 is due in 3 days.',
    severity: 'info' as const,
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionLink: '/dashboard/transactions',
  },
    {
    id: '4',
    title: 'Large Transaction',
    message: 'An expense of ₹15,000 was made at Croma.',
    severity: 'info' as const,
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    actionLink: '/dashboard/transactions',
  },
]

const severityIcons = {
  critical: <CircleAlert className="h-4 w-4 text-red-500" />,
  warning: <TriangleAlert className="h-4 w-4 text-orange-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
}

export function NotificationBell() {
  // In a real implementation, this would come from useCollection and state updates
  const [alerts, setAlerts] = useState(mockAlerts)
  const unreadCount = alerts.filter((a) => !a.isRead).length

  const handleMarkAsRead = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    )
  }

  const handleMarkAllAsRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })))
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
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <DropdownMenuItem
                key={alert.id}
                className={cn(
                  'flex items-start gap-3 p-3 focus:bg-accent',
                  !alert.isRead && 'bg-blue-50/50 dark:bg-blue-900/20'
                )}
                onSelect={() => handleMarkAsRead(alert.id)}
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
            <div className="p-4 text-center text-sm text-muted-foreground">
              You have no new notifications.
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="justify-center p-2 text-sm font-medium text-primary">
            View all alerts
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
