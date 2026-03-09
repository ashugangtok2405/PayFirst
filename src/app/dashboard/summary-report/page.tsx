'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { KpiSummary } from '@/components/app/dashboard/kpi-summary'
import { CashFlowChart } from '@/components/app/dashboard/cash-flow-chart'
import { TopExpenses } from '@/components/app/dashboard/top-expenses'
import { BankAccounts } from '@/components/app/accounts/bank-accounts'
import { CreditCardManagement } from '@/components/app/accounts/credit-card-management'
import { InvestmentSummary } from '@/components/app/investments/investment-summary'
import { PersonalDebtManagement } from '@/components/app/accounts/personal-debt-management'
import { RecentTransactions } from '@/components/app/recent-transactions'
import { NetWorthSummary } from '@/components/app/accounts/net-worth-summary'
import { PortfolioAllocation } from '@/components/app/investments/portfolio-allocation'


export default function SummaryReportPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })

  // Note: Date filtering is not fully implemented for all components yet.
  // This UI is a placeholder for future functionality.

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Financial Summary Report</h1>
          <p className="text-muted-foreground">A complete overview of your financial status.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
           <Select defaultValue='this-month'>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
            </Select>
           <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full sm:w-[260px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

        <KpiSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <CashFlowChart />
          <TopExpenses />
        </div>
        
        <NetWorthSummary />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InvestmentSummary />
            <PortfolioAllocation />
        </div>
        
        <div className="space-y-8">
            <BankAccounts />
            <CreditCardManagement />
            <PersonalDebtManagement />
        </div>

        <RecentTransactions />
    </div>
  )
}
