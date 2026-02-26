'use client'

import { useState, useMemo } from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  getDaysInMonth,
  getDay,
  isToday,
  isSameDay,
  startOfToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { CreditCard, Alert } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SetReminderDialog({
  children,
  card,
}: {
  children: React.ReactNode
  card: CreditCard
}) {
  const [open, setOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const handleSetReminder = () => {
    if (!user || !selectedDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Date',
        description: 'Please select a date for the reminder.',
      })
      return
    }

    const today = startOfToday()
    if (selectedDate < today) {
      toast({
        variant: 'destructive',
        title: 'Invalid Date',
        description: 'Reminder date must be in the future.',
      })
      return
    }

    setIsSubmitting(true)

    const reminderData: Omit<Alert, 'id' | 'createdAt'> = {
      userId: user.uid,
      type: 'manual_reminder',
      accountId: card.id,
      title: `Payment Reminder for ${card.name}`,
      message: `Remember to pay your ${
        card.name
      } bill by ${format(new Date(card.statementDueDate), 'MMM dd')}.`,
      severity: 'info',
      isRead: false,
      resolved: false,
      expiresAt: selectedDate.toISOString(),
    }

    try {
      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'alerts'), {
        ...reminderData,
        createdAt: new Date().toISOString(),
      })
      toast({
        title: 'Reminder Set',
        description: `We'll remind you on ${format(selectedDate, 'PPP')}.`,
      })
      setOpen(false)
      setSelectedDate(undefined)
      setCurrentMonth(new Date())
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not set reminder.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDayOfWeek = getDay(monthStart)

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const emptyDays = Array.from({ length: firstDayOfWeek })

    return { days, emptyDays }
  }, [currentMonth])

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const today = startOfToday()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl shadow-lg">
        <DialogHeader>
          <DialogTitle>Set Reminder for {card.name}</DialogTitle>
          <DialogDescription>
            Select a date to be reminded to pay your bill.
          </DialogDescription>
        </DialogHeader>

        <div className="p-1">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="font-semibold text-center text-lg">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="h-8 w-8"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {weekdays.map((day) => (
              <div key={day} className="font-medium h-10 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-1">
            {calendarDays.emptyDays.map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {calendarDays.days.map((day) => {
              const date = new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                day
              )
              const isPastDate = date < today
              const isSelected = selectedDate && isSameDay(date, selectedDate)

              return (
                <button
                  key={day}
                  disabled={isPastDate}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'h-10 w-10 flex items-center justify-center rounded-full text-sm transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isPastDate
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'hover:bg-accent hover:text-accent-foreground',
                    isToday(date) &&
                      !isSelected &&
                      'border border-primary/50',
                    isSelected &&
                      'bg-primary text-primary-foreground hover:bg-primary/90'
                  )}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSetReminder}
            disabled={!selectedDate || isSubmitting}
          >
            {isSubmitting ? 'Setting...' : 'Set Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
