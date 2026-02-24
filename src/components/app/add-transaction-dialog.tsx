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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Calendar as CalendarIcon, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { ACCOUNTS, CREDIT_CARDS } from '@/lib/data'

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const { toast } = useToast()

  const handleAddIncome = () => {
    // Logic to add income would go here
    toast({
      title: 'Income Added',
      description: (
        <div className="flex flex-col">
          <span>$500.00 has been moved to your savings account.</span>
          <span className="text-xs text-muted-foreground">Pay Yourself First! (10%)</span>
        </div>
      ),
    })
    setOpen(false)
  }

  const handleAddExpense = () => {
    // Logic to add expense would go here
    toast({
      title: 'Expense Added',
      description: 'Your expense has been successfully recorded.',
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Transaction</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs defaultValue="expense">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Log a new income or expense to your records.</DialogDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>
          </DialogHeader>
          <TabsContent value="expense">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-amount" className="text-right">
                  Amount
                </Label>
                <Input id="expense-amount" type="number" placeholder="$0.00" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-category" className="text-right">
                  Category
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="bills">Bills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-account" className="text-right">
                  Account
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...ACCOUNTS, ...CREDIT_CARDS].map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expense-date" className="text-right">
                  Date
                </Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense}>Add Expense</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="income">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-amount" className="text-right">
                  Amount
                </Label>
                <Input id="income-amount" type="number" placeholder="$0.00" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-category" className="text-right">
                  Source
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-account" className="text-right">
                  Account
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNTS.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-date" className="text-right">
                  Date
                </Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal col-span-3",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddIncome}>Add Income</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
