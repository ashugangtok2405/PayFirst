'use client'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import type { Transaction } from '@/lib/types'
import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export function SpendingChart() {
    const firestore = useFirestore()
    const { user } = useUser()

    const transactionsQuery = useMemoFirebase(
        () => user ? query(collection(firestore, 'users', user.uid, 'transactions'), orderBy('transactionDate', 'desc')) : null,
        [firestore, user]
    );
    const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

    const monthlySpending = useMemo(() => {
        if (!transactions) return [];
        const spending = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                const date = new Date(t.transactionDate);
                const month = date.toLocaleString('default', { month: 'short' });
                const year = date.getFullYear().toString().slice(-2);
                const key = `${month} '${year}`;
                acc[key] = (acc[key] || 0) + t.amount;
                return acc;
            }, {} as { [key: string]: number });

        const sortedMonths = Object.keys(spending).sort((a, b) => {
            const dateA = new Date(`01 ${a.replace(" '", " 20")}`);
            const dateB = new Date(`01 ${b.replace(" '", " 20")}`);
            return dateA.getTime() - dateB.getTime();
        });
        
        return sortedMonths.slice(-6).map(key => ({ name: key.split(" ")[0], total: spending[key] }));

    }, [transactions]);
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          const formattedValue = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(payload[0].value);
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">Total: {formattedValue}</p>
            </div>
          );
        }
      
        return null;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[250px] w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Spending Overview</CardTitle>
                </div>
                <Select defaultValue="6">
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Last 6 Months" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="6">Last 6 Months</SelectItem>
                        <SelectItem value="12">Last 12 Months</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {monthlySpending.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={monthlySpending} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                            <Tooltip
                                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                content={<CustomTooltip />}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="total" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#colorTotal)"
                                dot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                                activeDot={{ r: 6, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[250px] flex items-center justify-center">
                        <p className="text-muted-foreground">No spending data available for this period.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
