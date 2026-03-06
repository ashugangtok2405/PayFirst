'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DatePicker } from '@/components/app/shared/date-picker'
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, addDoc } from 'firebase/firestore'
import type { Goal, Investment } from '@/lib/types'
import { startOfToday } from 'date-fns'

export function AddGoalDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [linkedInvestmentIds, setLinkedInvestmentIds] = useState<string[]>([])

  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading: loadingInvestments } = useCollection<Investment>(investmentsQuery)

  const resetForm = () => {
    setName('')
    setTargetAmount('')
    setTargetDate(undefined)
    setLinkedInvestmentIds([])
  }

  const handleSave = async () => {
    if (!user || !name || !targetAmount || !targetDate) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please fill all required fields.' })
      return
    }

    const amount = parseFloat(targetAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Target amount must be a positive number.' })
      return
    }

    try {
      const goalData: Omit<Goal, 'id'> = {
        userId: user.uid,
        name,
        targetAmount: amount,
        targetDate: targetDate.toISOString(),
        linkedInvestmentIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await addDoc(collection(firestore, 'users', user.uid, 'goals'), goalData)
      toast({ title: 'Goal Created', description: `Your goal "${name}" has been created.` })
      resetForm()
      setOpen(false)
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Could not save goal.' })
    }
  }

  const handleInvestmentLinkToggle = (investmentId: string, checked: boolean) => {
    setLinkedInvestmentIds(prev =>
      checked ? [...prev, investmentId] : prev.filter(id => id !== investmentId)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Financial Goal</DialogTitle>
          <DialogDescription>Set a target and track your progress.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input id="goal-name" placeholder="e.g., Dream Vacation, Down Payment" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-amount">Target Amount</Label>
              <Input id="target-amount" type="number" placeholder="₹5,00,000" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">Target Date</Label>
              <DatePicker date={targetDate} setDate={setTargetDate} disabled={(date) => date < startOfToday()} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Link Investments (Optional)</Label>
            <ScrollArea className="h-40 w-full rounded-md border p-4">
              {loadingInvestments ? (
                <p className="text-sm text-muted-foreground">Loading investments...</p>
              ) : investments && investments.length > 0 ? (
                <div className="space-y-2">
                  {investments.map(inv => (
                    <div key={inv.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`inv-${inv.id}`}
                        checked={linkedInvestmentIds.includes(inv.id)}
                        onCheckedChange={(checked) => handleInvestmentLinkToggle(inv.id, !!checked)}
                      />
                      <label htmlFor={`inv-${inv.id}`} className="text-sm font-medium leading-none">
                        {inv.fundName}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No investments found to link.</p>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Create Goal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
