'use client'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react'
import type { Transaction, Category, CreditCard } from '@/lib/types'

const formatPercent = (value: number) => `${Math.round(value)}%`;

interface SmartInsightsProps {
    transactions: Transaction[];
    previousTransactions: Transaction[];
    categories: Category[];
    creditCards: CreditCard[];
    currentSummary: { income: number; expense: number; net: number; };
}

export function SmartInsights({ transactions, previousTransactions, categories, creditCards, currentSummary }: SmartInsightsProps) {
  const insights = useMemo(() => {
    const generated: { id: string; severity: 'info' | 'warning' | 'critical'; message: string; icon: React.ElementType }[] = [];

    // 1. Spending vs Income Ratio
    if (currentSummary.income > 0) {
      const spendingRatio = (currentSummary.expense / currentSummary.income) * 100;
      if (spendingRatio > 85) {
        generated.push({ id: 'spending-ratio-critical', severity: 'critical', message: `Spending is ${formatPercent(spendingRatio)} of income`, icon: AlertTriangle });
      } else if (spendingRatio > 70) {
        generated.push({ id: 'spending-ratio-warning', severity: 'warning', message: `Spending is ${formatPercent(spendingRatio)} of income`, icon: AlertTriangle });
      }
    }

    // 2. High Credit Utilization
    const highUseCard = creditCards.find(c => c.creditLimit > 0 && (c.currentBalance / c.creditLimit) * 100 > 70);
    if (highUseCard) {
      const util = (highUseCard.currentBalance / highUseCard.creditLimit) * 100;
      generated.push({ id: `high-util-${highUseCard.id}`, severity: 'warning', message: `${highUseCard.name} at ${formatPercent(util)} utilization`, icon: Info });
    }

    // 3. Category spending increases
    const categoryMap = categories.reduce((acc, cat) => ({...acc, [cat.id]: cat.name}), {} as Record<string, string>);
    const currentCategorySpends = transactions
        .filter(t => t.type === 'expense' && t.categoryId)
        .reduce((acc, t) => {
            const catName = categoryMap[t.categoryId!];
            if (catName) acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const previousCategorySpends = previousTransactions
        .filter(t => t.type === 'expense' && t.categoryId)
        .reduce((acc, t) => {
            const catName = categoryMap[t.categoryId!];
            if (catName) acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    for (const category in currentCategorySpends) {
        const currentSpend = currentCategorySpends[category];
        const previousSpend = previousCategorySpends[category] || 0;
        if (previousSpend > 1000 && currentSpend > previousSpend * 1.5) { // 50% increase on significant category
            const increase = ((currentSpend - previousSpend) / previousSpend) * 100;
            generated.push({ id: `cat-spend-${category}`, severity: 'info', message: `${category} spending up ${formatPercent(increase)}`, icon: TrendingUp });
            break; // Show one category insight at a time to avoid clutter
        }
    }

    return generated;
  }, [transactions, previousTransactions, categories, creditCards, currentSummary]);

  if (insights.length === 0) return null;

  const severityConfig = {
      critical: 'border-red-500/50 bg-red-50 text-red-700',
      warning: 'border-orange-500/50 bg-orange-50 text-orange-700',
      info: 'border-blue-500/50 bg-blue-50 text-blue-700',
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-sm text-muted-foreground">
            <Lightbulb className="size-4 text-yellow-500" />
            <span>Smart Insights:</span>
          </div>
          {insights.map(insight => {
            const Icon = insight.icon;
            return (
                <Badge key={insight.id} variant="outline" className={`font-normal text-xs gap-1.5 ${severityConfig[insight.severity]}`}>
                  <Icon className="size-3.5" />
                  {insight.message}
                </Badge>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
