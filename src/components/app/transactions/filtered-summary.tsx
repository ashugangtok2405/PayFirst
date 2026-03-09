'use client'

import { format } from 'date-fns'
import { Card, CardContent } from '@/components/ui/card'
import type { Transaction } from '@/lib/types'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

interface FilteredSummaryProps {
  transactions: Transaction[];
  searchTerm: string;
  dateRange: { from: Date; to: Date };
}

export function FilteredSummary({ transactions, searchTerm, dateRange }: FilteredSummaryProps) {
  const summary = transactions.reduce((acc, t) => {
    if (['income', 'debt_borrowed', 'debt_repayment_in'].includes(t.type)) {
        acc.income += t.amount;
    } else if (['expense', 'loan_payment', 'debt_lent', 'debt_repayment_out'].includes(t.type)) {
        acc.expense += t.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  const transactionCount = transactions.length;

  if (transactionCount === 0) {
      return (
          <Card className="mb-6">
              <CardContent className="p-4 text-center text-muted-foreground">
                  No transactions found for your current filters.
              </CardContent>
          </Card>
      )
  }

  const hasIncome = summary.income > 0;
  const hasExpense = summary.expense > 0;

  if (!hasIncome && !hasExpense) {
      return (
          <Card className="mb-6">
              <CardContent className="p-4 text-center text-muted-foreground">
                  Your filters only match transactions that do not affect income or spend (e.g., transfers).
              </CardContent>
          </Card>
      );
  }

  const formattedDateRange = `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd, y")}`;

  return (
    <Card className="mb-6 bg-muted/50">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm w-full">
                <div className="font-semibold text-base mb-2">
                    {searchTerm ? `Summary for "${searchTerm}"` : 'Filtered Summary'}
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    {hasExpense && (
                        <div>
                            <p className="text-xs text-muted-foreground">Total Spend</p>
                            <p className="font-semibold text-lg text-red-600">{formatCurrency(summary.expense)}</p>
                        </div>
                    )}
                    {hasIncome && (
                         <div>
                            <p className="text-xs text-muted-foreground">Total Income</p>
                            <p className="font-semibold text-lg text-green-600">{formatCurrency(summary.income)}</p>
                        </div>
                    )}
                    {(hasIncome || hasExpense) && (
                        <div>
                            <p className="text-xs text-muted-foreground">Net Flow</p>
                            <p className={`font-semibold text-lg ${summary.income - summary.expense >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatCurrency(summary.income - summary.expense)}
                            </p>
                        </div>
                    )}
                </div>
                <p className="text-muted-foreground mt-2.5 text-xs">
                    {transactionCount} transaction{transactionCount !== 1 ? 's' : ''} • {formattedDateRange}
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  )
}
