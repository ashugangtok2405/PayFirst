'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Bot, TrendingUp, Lightbulb } from 'lucide-react'
import { generateInsightsAction } from '@/app/actions'
import type { AiSpendingInsightsOutput, AiSpendingInsightsInput } from '@/ai/flows/ai-spending-insights'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

const mockInput: AiSpendingInsightsInput = {
  monthlyIncome: 5000,
  categorizedExpenses: [
    { category: 'Food', amount: 800, count: 45 },
    { category: 'Transport', amount: 300, count: 30 },
    { category: 'Entertainment', amount: 400, count: 10 },
    { category: 'Shopping', amount: 600, count: 8 },
    { category: 'Rent', amount: 1500, count: 1 },
    { category: 'Utilities', amount: 200, count: 4 },
  ],
  totalMonthlySpending: 3800,
  currentSavingsBalance: 10000,
  savingsGoalDescription: 'Save for a down payment on a house',
}

export function AiInsightsTool() {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<AiSpendingInsightsOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setInsights(null)
    const result = await generateInsightsAction(mockInput)
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
          <Button onClick={handleGenerate} disabled={loading} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            {loading ? 'Analyzing...' : 'Analyze My Spending'}
          </Button>
        </CardContent>
      </Card>

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
