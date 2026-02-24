'use client'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const monthlySpending = [
  { name: 'Apr', total: 20000 },
  { name: 'May', total: 42000 },
  { name: 'Jun', total: 50000 },
  { name: 'Jul', total: 55000 },
  { name: 'Sep', total: 70000 },
];

export function SpendingChart() {
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">total: {payload[0].value}</p>
            </div>
          );
        }
      
        return null;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Spending Overview</CardTitle>
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Time" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="6">Last 6 Months</SelectItem>
                        <SelectItem value="12">Last 12 Months</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}
