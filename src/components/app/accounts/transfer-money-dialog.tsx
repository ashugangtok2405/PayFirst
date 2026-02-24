'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export function TransferMoneyDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const { toast } = useToast()

  const handleTransfer = () => {
    toast({
      title: 'Transfer Successful',
      description: 'The money has been transferred between your accounts.',
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Money
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[480px]"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement
          if (target.closest('.rdp')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>Move funds between your accounts.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-account">From Account</Label>
              <Select>
                <SelectTrigger id="from-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdfc-savings">HDFC Savings (₹5,25,000)</SelectItem>
                  <SelectItem value="icici-current">ICICI Current (₹3,15,500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-account">To Account</Label>
              <Select>
                <SelectTrigger id="to-account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hdfc-savings">HDFC Savings (₹5,25,000)</SelectItem>
                  <SelectItem value="icici-current">ICICI Current (₹3,15,500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" placeholder="₹0.00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={'outline'}
                  className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" placeholder="e.g., For monthly investment" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleTransfer}>
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
