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
import { useFirestore, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { BankAccount, CreditCard, Category } from '@/lib/types'

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date>()
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [firestore, user])
  const { data: bankAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user])
  const { data: creditCards } = useCollection<CreditCard>(creditCardsQuery)

  const expenseCategoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]); // Should filter by type
  const { data: categories } = useCollection<Category>(expenseCategoriesQuery)

  const handleAddTransaction = (type: 'income' | 'expense') => {
      if (!user || !firestore) return;
  
      // This is a simplified version. A real app would use a form library.
      const amount = parseFloat((document.getElementById(`${type}-amount`) as HTMLInputElement)?.value || '0');
      const categoryId = (document.querySelector(`#${type}-category [data-radix-collection-item][aria-selected=true]`) as HTMLElement)?.dataset?.value;
      const description = (document.getElementById(`${type}-description`) as HTMLInputElement)?.value || `New ${type}`;
  
      if (!amount || !categoryId || !date || !description) {
          toast({ variant: 'destructive', title: 'Error', description: 'Please fill out all fields.' });
          return;
      }

      const transactionData = {
          userId: user.uid,
          type,
          amount,
          description,
          categoryId,
          transactionDate: date.toISOString(),
      };

      addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'transactions'), transactionData);
      
      toast({
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Added`,
          description: `Your ${type} has been successfully recorded.`,
      })
      setOpen(false)
      setDate(undefined)
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
        <Tabs defaultValue="expense" className="pt-4">
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>Log a new income or expense to your records.</DialogDescription>
          </DialogHeader>
          <TabsList className="grid w-full grid-cols-2 mt-4">
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-4 py-4">
               <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount</Label>
                  <Input id="expense-amount" type="number" placeholder="$0.00" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Input id="expense-description" placeholder="e.g. Coffee" />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Select name="expense-category" >
                      <SelectTrigger id="expense-category" className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                      <SelectContent>
                          {categories?.filter(c => c.type === 'expense').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="expense-account">Account</Label>
                  <Select name="expense-account">
                      <SelectTrigger id="expense-account" className="w-full"><SelectValue placeholder="Select an account" /></SelectTrigger>
                      <SelectContent>
                          {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                          {creditCards?.map(card => <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                  </Popover>
              </div>
            <DialogFooter>
              <Button onClick={() => handleAddTransaction('expense')}>Add Expense</Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="income" className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="income-amount">Amount</Label>
                <Input id="income-amount" type="number" placeholder="$0.00" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="income-description">Description</Label>
                <Input id="income-description" placeholder="e.g. Monthly Salary" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="income-category">Source</Label>
                <Select name="income-category">
                    <SelectTrigger id="income-category" className="w-full"><SelectValue placeholder="Select a source" /></SelectTrigger>
                    <SelectContent>
                        {categories?.filter(c => c.type === 'income').map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="income-account">Account</Label>
                <Select name="income-account">
                    <SelectTrigger id="income-account" className="w-full"><SelectValue placeholder="Select an account" /></SelectTrigger>
                    <SelectContent>
                        {bankAccounts?.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Date</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
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
            <DialogFooter>
              <Button onClick={() => handleAddTransaction('income')}>Add Income</Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
