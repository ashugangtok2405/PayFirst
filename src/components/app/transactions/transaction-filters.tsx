'use client'

import { Card, CardContent } from '@/components/ui/card'
import { CalendarIcon, PlusCircle, Search } from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'

interface TransactionFiltersProps {
    accounts: {id: string, name: string}[];
    typeFilter: string;
    setTypeFilter: (value: string) => void;
    accountFilter: string;
    setAccountFilter: (value: string) => void;
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    dateRange: { from: Date; to: Date };
    setDateRange: (range: { from: Date; to: Date }) => void;
}

export function TransactionFilters({
    accounts,
    typeFilter, setTypeFilter,
    accountFilter, setAccountFilter,
    searchTerm, setSearchTerm,
    dateRange, setDateRange
}: TransactionFiltersProps) {

    const handleDatePreset = (preset: string) => {
        const now = new Date();
        let from: Date, to: Date;
        switch (preset) {
            case 'this-month': from = startOfMonth(now); to = endOfMonth(now); break;
            case 'last-month': const lastMonth = subMonths(now, 1); from = startOfMonth(lastMonth); to = endOfMonth(lastMonth); break;
            case 'this-week': from = startOfWeek(now); to = endOfWeek(now); break;
            default: from = startOfMonth(now); to = endOfMonth(now);
        }
        setDateRange({ from, to });
    }

    return (
        <Card>
            <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 lg:gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className="w-full sm:w-auto lg:w-[280px] justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <div className="flex p-2 gap-2 border-b">
                                    <Button variant="ghost" size="sm" onClick={() => handleDatePreset('this-month')}>This Month</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDatePreset('last-month')}>Last Month</Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDatePreset('this-week')}>This Week</Button>
                                </div>
                                <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range) => range?.from && range.to && setDateRange({ from: range.from, to: range.to })} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Transaction Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="credit_card_payment">CC Payment</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={accountFilter} onValueChange={setAccountFilter}>
                            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Account" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 sm:w-auto w-full">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search..." className="pl-9 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <AddTransactionDialog>
                            <Button className="w-full sm:w-auto flex-shrink-0">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
                            </Button>
                        </AddTransactionDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
