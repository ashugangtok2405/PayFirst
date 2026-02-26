'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, addDocumentNonBlocking } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { CreditCard, Alert } from '@/lib/types'
import { format } from 'date-fns'

export function SetReminderDialog({ children, card }: { children: React.ReactNode, card: CreditCard }) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const handleSetReminder = async () => {
    if (!user || !date) {
      toast({ variant: 'destructive', title: 'Missing Date', description: 'Please select a date for the reminder.' })
      return
    }
    if (date <= new Date()) {
        toast({ variant: 'destructive', title: 'Invalid Date', description: 'Reminder date must be in the future.' })
        return
    }
    
    setIsSubmitting(true)
    
    const reminderData: Omit<Alert, 'id' | 'createdAt'> = {
      userId: user.uid,
      type: 'manual_reminder',
      accountId: card.id,
      title: `Payment Reminder for ${card.name}`,
      message: `Remember to pay your ${card.name} bill by ${format(new Date(card.statementDueDate), 'MMM dd')}.`,
      severity: 'info',
      isRead: false,
      resolved: false,
      expiresAt: date.toISOString()
    }

    try {
        await addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'alerts'), { ...reminderData, createdAt: new Date().toISOString()})
        toast({ title: 'Reminder Set', description: `We'll remind you on ${format(date, 'PPP')}.` })
        setOpen(false)
        setDate(undefined)
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not set reminder.' })
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Reminder for {card.name}</DialogTitle>
          <DialogDescription>Select a date to be reminded to pay your bill.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date()}
                initialFocus
            />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSetReminder} disabled={!date || isSubmitting}>
            {isSubmitting ? 'Setting...' : 'Set Reminder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
