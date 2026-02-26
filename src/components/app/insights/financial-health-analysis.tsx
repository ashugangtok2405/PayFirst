'use client'

import { useMemo, useState } from 'react'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import { subMonths, startOfMonth, endOfMonth, differenceInMonths, format } from 'date-fns'
import type { Transaction, BankAccount, CreditCard, Loan, PersonalDebt } from '@/lib/types'
import { getFinancialHealthAnalysisAction } from '@/app/actions'
import type { FinancialHealthInput, FinancialHealthOutput } from '@/ai/flows/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sparkles, Bot, TrendingUp, DollarSign, Wallet, ShieldAlert, BookOpen } from 'lucide-react'
import { HealthScoreGauge } from './health-score-gauge'
import ReactMarkdown from 'react-markdown'

const formatPercent = (value: number) => {
    if (!isFinite(value)) return 'N/A';
    return `${value.toFixed(1)}%`;
}
const formatMonths = (value: number) => {
    if (!isFinite(value)) return 'N/A';
    if (value > 240) return '>20 years';
    return `${value.toFixed(1)} months`;
}

export function FinancialHealthAnalysis() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<FinancialHealthOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useUser()
  const firestore = useFirestore()

  // --- Data Fetching ---
  const threeMonthsAgo = useMemo(() => startOfMonth(subMonths(new Date(), 2)), [])
  const transactionsQuery = useMemoFirebase(() => user ? query(
      collection(firestore, 'users', user.uid, 'transactions'),
      where('transactionDate', '>=', threeMonthsAgo.toISOString()),
      orderBy('transactionDate', 'desc')
  ) : null, [user?.uid, firestore, threeMonthsAgo])
  const { data: recentTransactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [user?.uid, firestore])
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery)
  
  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [user?.uid, firestore])
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)

  const loansQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'loans'), where('active', '==', true)) : null, [user?.uid, firestore])
  const { data: loans, isLoading: loadingLoans } = useCollection<Loan>(loansQuery)
  
  const isLoading = loadingTransactions || loadingBankAccounts || loadingCreditCards || loadingLoans;

  // --- Core Metric Calculations for AI input ---
  const calculatedMetricsForAI = useMemo(() => {
    if (isLoading || !recentTransactions || !bankAccounts || !creditCards || !loans) return null;

    const now = new Date();
    const currentMonthStart = startOfMonth(now);

    const getMonthlyTotals = (monthStart: Date, monthEnd: Date) => {
      const filtered = recentTransactions.filter(t => {
        try {
          const txDate = new Date(t.transactionDate);
          return txDate >= monthStart && txDate <= monthEnd;
        } catch { return false; }
      });
      return {
        income: filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    }

    const currentMonthTotals = getMonthlyTotals(currentMonthStart, endOfMonth(now));
    
    const last3MonthsExpenses = [0, 1, 2].map(i => {
        const date = subMonths(now, i);
        return getMonthlyTotals(startOfMonth(date), endOfMonth(date)).expense;
    });

    const liquidAssets = bankAccounts.reduce((s, a) => s + a.currentBalance, 0);
    const totalMonthlyEmi = loans.reduce((s, l) => s + l.emiAmount, 0);
    const totalCreditOutstanding = creditCards.reduce((s, c) => s + c.currentBalance, 0);
    const totalCreditLimit = creditCards.reduce((s, c) => s + c.creditLimit, 0);

    return {
        monthlyIncome: currentMonthTotals.income,
        monthlyExpense: currentMonthTotals.expense,
        last3MonthsExpenses: last3MonthsExpenses,
        liquidAssets: liquidAssets,
        totalMonthlyEmi: totalMonthlyEmi,
        totalCreditOutstanding: totalCreditOutstanding,
        totalCreditLimit: totalCreditLimit,
    };
  }, [isLoading, recentTransactions, bankAccounts, creditCards, loans]);

  const handleGenerate = async () => {
    if (!calculatedMetricsForAI) {
      setError("Not enough data to generate insights. Please add transactions and accounts.")
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)
    
    const result = await getFinancialHealthAnalysisAction(calculatedMetricsForAI as FinancialHealthInput)
    if (result.success && result.data) {
      setAnalysis(result.data)
    } else {
      setError(result.error ?? 'An unknown error occurred.')
    }
    setLoading(false)
  }

  const renderInitialState = () => (
    <Card className="bg-primary/10 border-primary/20">
      <CardContent className="p-6 flex flex-col items-center text-center gap-4 md:gap-6">
        <Sparkles className="w-12 h-12 text-primary" />
        <div className="flex-grow">
          <h3 className="font-semibold text-xl">Unlock Your Financial Health Score</h3>
          <p className="text-muted-foreground mt-1 max-w-2xl mx-auto">
            Let our AI CFO analyze your complete financial picture—from spending habits to debt levels—and provide a single, understandable score with actionable advice to improve it.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading || isLoading} size="lg">
          <Bot className="mr-2 h-5 w-5" />
          {loading ? 'Analyzing...' : isLoading ? 'Loading Data...' : 'Analyze My Finances'}
        </Button>
      </CardContent>
    </Card>
  )

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
        </Card>
        <Card className="lg:col-span-2 p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
        </Card>
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_,i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
    </div>
  )

  const renderAnalysis = () => {
    if (!analysis) return null;
    const { savingsRate, debtToIncomeRatio, cashRunwayMonths, creditUtilization } = analysis;

    const metricCards = [
        { title: "Savings Rate", value: formatPercent(savingsRate), icon: TrendingUp, good: savingsRate > 15 },
        { title: "Debt-to-Income", value: formatPercent(debtToIncomeRatio), icon: DollarSign, good: debtToIncomeRatio < 30 },
        { title: "Cash Runway", value: formatMonths(cashRunwayMonths), icon: Wallet, good: cashRunwayMonths > 4 },
        { title: "Credit Utilization", value: formatPercent(creditUtilization), icon: ShieldAlert, good: creditUtilization < 30 },
    ];
    
    return (
        <div className="space-y-6 animate-in fade-in-50">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col items-center justify-center p-6">
                    <HealthScoreGauge score={analysis.finalScore} status={analysis.status} />
                </Card>
                <Card className="lg:col-span-2 flex flex-col justify-center">
                    <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="w-6 h-6 text-primary" /> AI Summary</CardTitle></CardHeader>
                    <CardContent><p className="text-muted-foreground text-lg">{analysis.aiSummary}</p></CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {metricCards.map(m => (
                    <Card key={m.title}>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{m.title}</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold">{m.value}</div></CardContent>
                    </Card>
                ))}
            </div>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <Card>
                    <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                        <div className="flex items-center gap-3">
                           <BookOpen className="w-6 h-6 text-primary"/> Detailed Analysis & Recommendations
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{analysis.aiDetailedInsight}</ReactMarkdown>
                        </div>
                    </AccordionContent>
                </Card>
              </AccordionItem>
            </Accordion>
            <div className="text-center">
                <Button onClick={handleGenerate} disabled={loading || isLoading}>
                    <Sparkles className="mr-2 h-4 w-4"/> Re-analyze
                </Button>
            </div>
        </div>
    )
  }

  return (
      <div className="space-y-6">
          {loading ? renderLoadingState() : analysis ? renderAnalysis() : renderInitialState()}
          {error && <Alert variant="destructive"><AlertTitle>Analysis Failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      </div>
  )
}
