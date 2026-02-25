'use client'

import { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Transaction, Category, CreditCard as CreditCardType } from '@/lib/types'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

interface MonthlySummaryDialogProps {
  isOpen: boolean
  onClose: () => void
  data: {
    name: string;
    income: number;
    expense: number;
    transactions: Transaction[];
    categories: Category[];
    creditCards: CreditCardType[];
  } | null
}

const getHealthIndicator = (netFlow: number, savingsRate: number) => {
    if (netFlow < 0) {
        return { text: 'Overspent', color: 'bg-red-500', variant: 'destructive' as const };
    }
    if (savingsRate < 10) {
        return { text: 'Low Savings', color: 'bg-yellow-500', variant: 'default' as const };
    }
    return { text: 'Net Positive', color: 'bg-green-500', variant: 'default' as const };
}


export function MonthlySummaryDialog({ isOpen, onClose, data }: MonthlySummaryDialogProps) {
  const summary = useMemo(() => {
    if (!data) return null;

    const { income, expense, transactions, categories } = data;
    const netFlow = income - expense;
    const savingsRate = income > 0 ? (netFlow / income) * 100 : 0;
    
    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
    }, {} as Record<string, string>);

    const expenseByCategory = transactions
        .filter(t => t.type === 'expense' && t.categoryId)
        .reduce((acc, t) => {
            const catName = t.categoryId ? categoryMap[t.categoryId] : 'Uncategorized';
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const top3Expenses = Object.entries(expenseByCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([name, amount]) => ({ name, amount, percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0 }));

    const creditSpending = transactions
        .filter(t => t.type === 'expense' && t.fromCreditCardId)
        .reduce((sum, t) => sum + t.amount, 0);
        
    const health = getHealthIndicator(netFlow, savingsRate);

    return {
        income,
        expense,
        netFlow,
        savingsRate,
        top3Expenses,
        creditSpending,
        health,
    }
  }, [data])

  if (!isOpen || !data || !summary) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl sm:max-w-xl md:max-w-2xl animate-in fade-in-0 zoom-in-95">
            <DialogHeader>
                <DialogTitle>Monthly Summary: {data.name}</DialogTitle>
                <DialogDescription>A financial overview for the selected month.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Cash Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Income</span>
                            <span className="font-medium text-green-600">{formatCurrency(summary.income)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Total Expense</span>
                            <span className="font-medium text-red-600">{formatCurrency(summary.expense)}</span>
                        </div>
                        <div className="flex justify-between items-center font-semibold text-base border-t pt-2 mt-2">
                            <span>Net Flow</span>
                            <span>{formatCurrency(summary.netFlow)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Savings Rate</span>
                            <span className="font-medium">{summary.savingsRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-muted-foreground">Financial Health:</span>
                            <Badge variant={summary.health.variant} className={summary.health.variant === 'default' ? `${summary.health.color} text-white` : ''}>
                                {summary.health.text}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Expense Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.top3Expenses.length > 0 ? summary.top3Expenses.map(exp => (
                             <div key={exp.name} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{exp.name}</span>
                                    <span className="text-muted-foreground">{formatCurrency(exp.amount)}</span>
                                </div>
                                <Progress value={exp.percentage} />
                             </div>
                        )) : <p className="text-sm text-center text-muted-foreground py-8">No expenses recorded for this month.</p>}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Credit Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Total Credit Card Spending</span>
                            <span className="font-semibold text-base">{formatCurrency(summary.creditSpending)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <DialogFooter>
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button>View Full Transactions</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  )
}
