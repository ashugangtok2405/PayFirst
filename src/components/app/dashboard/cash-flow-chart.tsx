'use client'
import { useState, useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { Transaction, Category, CreditCard as CreditCardType } from '@/lib/types'
import { MonthlySummaryDialog } from './monthly-summary-dialog'
import { subMonths, format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

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
              <span className="font-bold text-muted-foreground">
                Income: {formatCurrencyTooltip(payload[0].value)}
              </span>
              <span className="font-bold text-muted-foreground">
                Expense: {formatCurrencyTooltip(payload[1].value)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

const processTransactionsForChart = (transactions: Transaction[], periodInMonths: number) => {
    const dataByMonth: { [key: string]: { name: string, shortName: string, income: number, expense: number, transactions: Transaction[] } } = {};

    for (let i = periodInMonths - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        dataByMonth[monthKey] = { name: monthKey, shortName: format(date, 'MMM'), income: 0, expense: 0, transactions: [] };
    }

    transactions.forEach(t => {
        const transactionDate = new Date(t.transactionDate);
        const monthKey = format(transactionDate, 'MMM yyyy');
        if (dataByMonth[monthKey]) {
            if (t.type === 'income') {
                dataByMonth[monthKey].income += t.amount;
            } else if (t.type === 'expense') {
                dataByMonth[monthKey].expense += t.amount;
            }
            dataByMonth[monthKey].transactions.push(t);
        }
    });

    return Object.values(dataByMonth);
}


export function CashFlowChart() {
    const [period, setPeriod] = useState(6); // Last 6 months
    const [selectedMonth, setSelectedMonth] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const firestore = useFirestore();
    const { user } = useUser();
    
    const dateLimit = useMemo(() => subMonths(new Date(), period), [period]);
    const transactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', dateLimit.toISOString())) : null,
        [firestore, user, dateLimit]
    );
    const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);
    
    const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
    const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);

    const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [firestore, user]);
    const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCardType>(creditCardsQuery);

    const isLoading = loadingTransactions || loadingCategories || loadingCreditCards;

    const monthlyData = useMemo(() => {
        return transactions ? processTransactionsForChart(transactions, period) : [];
    }, [transactions, period]);

    const handleBarClick = (data: any) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const monthIndex = data.activeTooltipIndex;
            const clickedMonthData = monthlyData[monthIndex];
            
            const detailedData = {
                ...clickedMonthData,
                categories: categories || [],
                creditCards: creditCards || [],
            }
            setSelectedMonth(detailedData);
            setIsModalOpen(true);
        }
    };
    
    const totalIncome = monthlyData.reduce((acc, item) => acc + item.income, 0)
    const totalExpense = monthlyData.reduce((acc, item) => acc + item.expense, 0)
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
                                <SelectItem value="1">This Month</SelectItem>
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
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Expense</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Net Flow</p>
                                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(netCashFlow)}</p>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <Skeleton className="w-full h-[250px]" />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} onClick={handleBarClick}>
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
                data={selectedMonth}
            />
        </>
    )
}
