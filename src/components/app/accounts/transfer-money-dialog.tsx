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
import { ArrowRightLeft } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

export function TransferMoneyDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(format(new Date(), 'dd/MM/yy'))
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
            <Input 
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="DD/MM/YY"
            />
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
