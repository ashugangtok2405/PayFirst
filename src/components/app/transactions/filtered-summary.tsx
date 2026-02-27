'use client'

import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import type { Transaction } from '@/lib/types'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

interface FilteredSummaryProps {
  transactions: Transaction[];
  searchTerm: string;
  dateRange: { from: Date; to: Date };
}

export function FilteredSummary({ transactions, searchTerm, dateRange }: FilteredSummaryProps) {
  const totalSpend = transactions.reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = transactions.length;

  if (transactionCount === 0) {
      return (
          <Card className="mb-6">
              <CardContent className="p-4 text-center text-muted-foreground">
                  No expenses found for your current filters.
              </CardContent>
          </Card>
      )
  }

  const formattedDateRange = `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}`;

  return (
    <Card className="mb-6 bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm">
                <p className="font-semibold text-base">
                    {searchTerm ? `Total Spend for "${searchTerm}": ` : 'Filtered Total Spend: '}
                    <span className="text-primary">{formatCurrency(totalSpend)}</span>
                </p>
                <p className="text-muted-foreground">
                    {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} • {formattedDateRange}
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
