'use client'

import { useState } from 'react'
import { format, startOfToday } from 'date-fns'
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
import { CustomCalendar } from '@/components/app/shared/custom-calendar'

export function SetReminderDialog({
  children,
  card,
}: {
  children: React.ReactNode
  card: CreditCard
}) {
  const [open, setOpen] = useState(false)
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

        <div className="flex justify-center">
          <CustomCalendar
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            disabled={(date) => date < startOfToday()}
          />
        </div>

        <DialogFooter className="mt-4 pt-4 border-t flex flex-col items-center gap-2">
            <Button
                type="submit"
                onClick={handleSetReminder}
                disabled={!selectedDate || isSubmitting}
                className="w-full max-w-[200px]"
            >
                {isSubmitting ? 'Setting...' : 'Set Reminder'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
