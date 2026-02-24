'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Bot, TrendingUp, Lightbulb } from 'lucide-react'
import { generateInsightsAction } from '@/app/actions'
import type { AiSpendingInsightsOutput, AiSpendingInsightsInput } from '@/ai/flows/ai-spending-insights'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category, BankAccount } from '@/lib/types'

export function AiInsightsTool() {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AiSpendingInsightsOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const firestore = useFirestore()
  const { user } = useUser()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const transactionsQuery = useMemoFirebase(
    () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startOfMonth)) : null,
    [firestore, user]
  )
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const categoriesQuery = useMemoFirebase(
      () => user ? collection(firestore, 'users', user.uid, 'categories') : null,
      [firestore, user]
  )
  const { data: categories, isLoading: isLoadingCategories } = useCollection<Category>(categoriesQuery)

  const bankAccountsQuery = useMemoFirebase(
    () => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null,
    [firestore, user]
  )
  const { data: bankAccounts, isLoading: isLoadingAccounts } = useCollection<BankAccount>(bankAccountsQuery)

  const hasData = useMemo(() => transactions && transactions.length > 0 && categories && categories.length > 0, [transactions, categories]);

  const handleGenerate = async () => {
    if (!transactions || !categories || !bankAccounts) {
      setError("Not enough data to generate insights. Please add some transactions and accounts.")
      return
    }

    setLoading(true)
    setError(null)
    setInsights(null)

    const categoriesMap = categories.reduce((acc, category) => {
        acc[category.id] = category.name
        return acc
    }, {} as { [key: string]: string })

    const categorizedExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
          const categoryName = categoriesMap[t.categoryId] || 'Uncategorized';
          if (!acc[categoryName]) {
              acc[categoryName] = { category: categoryName, amount: 0, count: 0 };
          }
          acc[categoryName].amount += t.amount;
          acc[categoryName].count++;
          return acc;
      }, {} as {[key: string]: {category: string, amount: number, count: number}});

    const input: AiSpendingInsightsInput = {
        monthlyIncome: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        categorizedExpenses: Object.values(categorizedExpenses),
        totalMonthlySpending: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        currentSavingsBalance: bankAccounts.filter(a => a.isSavingsAccount).reduce((sum, a) => sum + a.currentBalance, 0),
        savingsGoalDescription: 'Save for a down payment on a house', // still mock
    }

    const result = await generateInsightsAction(input)
    if (result.success && result.data) {
      setInsights(result.data)
    } else {
      setError(result.error ?? 'An unknown error occurred.')
    }
    setLoading(false)
  }

  const renderLoading = () => (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  )

  const renderInsights = () =>
    insights && (
      <div className="grid gap-6 animate-in fade-in-50">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              Overall Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{insights.overallAnalysis}</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                Cost-Saving Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                {insights.costSavingRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                Financial Habit Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                {insights.financialHabitTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2">
                    {insights.areasForImprovement.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-sm py-1 px-3">{area}</Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    )

  return (
    <div className="space-y-6">
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="flex-grow">
            <h3 className="font-semibold text-lg">Unlock Your Financial Potential</h3>
            <p className="text-muted-foreground mt-1">
              Let our AI analyze your spending and provide personalized tips to help you save more and spend smarter.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={loading || isLoadingAccounts || isLoadingCategories || isLoadingTransactions || !hasData} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            {loading ? 'Analyzing...' : 'Analyze My Spending'}
          </Button>
        </CardContent>
      </Card>
      
      {(isLoadingAccounts || isLoadingCategories || isLoadingTransactions) && !loading && (
        <p className="text-center text-muted-foreground">Loading financial data...</p>
      )}

      {!isLoadingAccounts && !isLoadingCategories && !isLoadingTransactions && !hasData && (
        <Alert>
          <AlertTitle>Not Enough Data</AlertTitle>
          <AlertDescription>We need at least one transaction to generate insights. Please add some data first.</AlertDescription>
        </Alert>
      )}

      {loading && renderLoading()}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {insights && renderInsights()}
    </div>
  )
}
