'use client'
import { useState, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MonthlySummaryDialog } from './monthly-summary-dialog'
import { subMonths, format, startOfMonth } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import type { Transaction, Category, CreditCard } from '@/lib/types'

const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(0)}k`
const formatCurrencyTooltip = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col space-y-1">
              <span className="text-[0.7rem] uppercase text-muted-foreground">
                {label}
              </span>
              <span className="font-bold text-green-600">
                Income: {formatCurrencyTooltip(payload[0].value)}
              </span>
              <span className="font-bold text-red-600">
                Expense: {formatCurrencyTooltip(payload[1].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

export function CashFlowChart() {
    const [period, setPeriod] = useState(6);
    const [selectedMonthData, setSelectedMonthData] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { user } = useUser()
    const firestore = useFirestore()

    const twelveMonthsAgo = useMemo(() => subMonths(new Date(), 11), []);
    const startOfTwelveMonths = useMemo(() => startOfMonth(twelveMonthsAgo), [twelveMonthsAgo]);

    const transactionsQuery = useMemoFirebase(() => user ? query(
        collection(firestore, 'users', user.uid, 'transactions'), 
        where('transactionDate', '>=', startOfTwelveMonths.toISOString()),
        orderBy('transactionDate', 'desc')
    ) : null, [firestore, user?.uid, startOfTwelveMonths]);
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery)
    
    const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user?.uid])
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery)

    const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user?.uid])
    const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery)

    const isLoading = loadingTransactions || loadingCategories || loadingCreditCards;

    const allMonthlyData = useMemo(() => {
        const dataMap = new Map<string, { name: string, shortName: string, income: number, expense: number, transactions: Transaction[] }>();

        for (let i = 11; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const name = format(date, 'MMM yyyy');
            const shortName = format(date, 'MMM');
            dataMap.set(name, { name, shortName, income: 0, expense: 0, transactions: [] });
        }

        if (transactions) {
            transactions.forEach(t => {
                try {
                    const monthName = format(new Date(t.transactionDate), 'MMM yyyy');
                    const monthData = dataMap.get(monthName);
                    if (monthData) {
                        if (t.type === 'income') {
                            monthData.income += t.amount;
                        } else if (t.type === 'expense') {
                            monthData.expense += t.amount;
                        }
                        monthData.transactions.push(t);
                    }
                } catch (e) {
                    // Ignore invalid transaction dates
                }
            });
        }
        return Array.from(dataMap.values());
    }, [transactions]);
    
    const chartData = useMemo(() => {
        return allMonthlyData.slice(-period);
    }, [period, allMonthlyData]);

    const handleBarClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const monthIndex = data.activeTooltipIndex;
            const clickedMonthData = chartData[monthIndex];
            
            setSelectedMonthData({
                ...clickedMonthData,
                categories: categories ?? [],
                creditCards: creditCards ?? [],
            });
            setIsModalOpen(true);
        }
    };
    
    const totalIncome = chartData.reduce((acc, item) => acc + item.income, 0)
    const totalExpense = chartData.reduce((acc, item) => acc + item.expense, 0)
    const netCashFlow = totalIncome - totalExpense

    return (
        <>
            <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">Cash Flow</CardTitle>
                            <CardDescription>Income vs. Expense</CardDescription>
                        </div>
                        <Select defaultValue={period.toString()} onValueChange={(v) => setPeriod(parseInt(v))}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">Last 3 Months</SelectItem>
                                <SelectItem value="6">Last 6 Months</SelectItem>
                                <SelectItem value="12">Last 12 Months</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isLoading ? (
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Income</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrencyTooltip(totalIncome)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expense</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrencyTooltip(totalExpense)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Net Flow</p>
                                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrencyTooltip(netCashFlow)}</p>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <Skeleton className="w-full h-[250px]" />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} onClick={handleBarClick}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="shortName" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                                <Legend iconType="circle" iconSize={8} wrapperStyle={{paddingTop: '20px'}} />
                                <Bar dataKey="income" fill="hsl(var(--chart-2))" name="Income" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="hsl(var(--chart-3))" name="Expense" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
            <MonthlySummaryDialog 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={selectedMonthData}
            />
        </>
    )
}
