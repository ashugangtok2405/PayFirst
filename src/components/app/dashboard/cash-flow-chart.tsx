'use client'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// MOCK DATA - To be replaced with live data
const monthlyData = [
    { name: 'Jan', income: 90000, expense: 65000 },
    { name: 'Feb', income: 95000, expense: 72000 },
    { name: 'Mar', income: 105000, expense: 78000 },
    { name: 'Apr', income: 98000, expense: 82000 },
    { name: 'May', income: 110000, expense: 75000 },
    { name: 'Jun', income: 120000, expense: 88000 },
]

const totalIncome = monthlyData.reduce((acc, item) => acc + item.income, 0)
const totalExpense = monthlyData.reduce((acc, item) => acc + item.expense, 0)
const netCashFlow = totalIncome - totalExpense

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


export function CashFlowChart() {
    return (
        <Card className="shadow-sm hover:shadow-md transition-shadow rounded-2xl">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">Cash Flow</CardTitle>
                        <CardDescription>Income vs. Expense This Month</CardDescription>
                    </div>
                    <Select defaultValue="6">
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="This Month" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">This Month</SelectItem>
                            <SelectItem value="6">Last 6 Months</SelectItem>
                            <SelectItem value="12">Last 12 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey="income" fill="hsl(var(--chart-2))" name="Income" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="hsl(var(--chart-3))" name="Expense" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
