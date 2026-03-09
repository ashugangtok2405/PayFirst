'use client'

import { useState, useMemo, FC } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileDown, Calendar as CalendarIcon, ArrowUp, ArrowDown } from 'lucide-react'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, format } from 'date-fns'
import { cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { useToast } from '@/hooks/use-toast'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where, orderBy } from 'firebase/firestore'
import type { Transaction, Category, BankAccount, CreditCard, Investment, SIP, PersonalDebt } from '@/lib/types'

// --- Helper ---
const formatCurrency = (value: number, digits = 0) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)

// --- Sub-Components for the Report Page ---

const ReportSnapshot: FC<{ data: any, isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)}
            </div>
        )
    }

    const cards = [
        { title: 'Total Income', value: data.totalIncome, color: 'bg-blue-500' },
        { title: 'Total Expenses', value: data.totalExpenses, color: 'bg-red-500' },
        { title: 'Total Investments', value: data.totalInvestments, color: 'bg-yellow-500' },
        { title: 'Net Balance', value: data.netBalance, color: 'bg-green-500', savingsRate: data.savingsRate },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <Card key={i} className="shadow-md">
                    <CardContent className="p-5">
                        <p className="text-sm text-muted-foreground">{card.title}</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(card.value)}</p>
                        {card.savingsRate !== undefined && (
                            <p className="text-sm font-medium text-green-600 mt-1">Savings Rate: {card.savingsRate.toFixed(1)}%</p>
                        )}
                        <div className={`h-1.5 ${card.color} rounded-full mt-3`}></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

const ReportEarningsVsSpending: FC<{ data: any[], isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[300px] w-full" />
    
    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Earnings vs. Spending</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`}/>
                        <Tooltip formatter={(value: number) => formatCurrency(value, 2)} />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Bar dataKey="income" fill="hsl(var(--chart-1))" name="Income" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expense" fill="hsl(var(--chart-3))" name="Expense" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="savings" fill="hsl(var(--chart-2))" name="Savings" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

const ReportAccountsSummary: FC<{ data: BankAccount[], isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[200px] w-full" />;

    const totalBalance = data.reduce((sum, acc) => sum + acc.currentBalance, 0);

    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Accounts Summary</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map(acc => (
                        <div key={acc.id} className="flex justify-between items-center text-sm">
                            <p>{acc.name}</p>
                            <p className="font-medium">{formatCurrency(acc.currentBalance)}</p>
                        </div>
                    ))}
                    <div className="flex justify-between items-center font-bold text-base border-t pt-3 mt-3">
                        <p className="text-primary">Total Balance</p>
                        <p>{formatCurrency(totalBalance)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ReportCreditCards: FC<{ data: CreditCard[], isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[200px] w-full" />;

    const totalUsed = data.reduce((sum, card) => sum + card.currentBalance, 0);
    const totalDue = data.reduce((sum, card) => sum + card.currentBalance, 0); // Assuming due is same as outstanding for this report

    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Credit Cards</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {data.map(card => (
                        <div key={card.id} className="text-sm flex flex-wrap gap-x-4 gap-y-1">
                           <span className='font-semibold'>{card.name}:</span>
                           <span>Limit {formatCurrency(card.creditLimit)}</span>
                           <span>Used {formatCurrency(card.currentBalance)}</span>
                           <span>Due {formatCurrency(card.currentBalance)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between items-center font-bold text-base border-t pt-3 mt-3">
                        <p>Total Credit Used: {formatCurrency(totalUsed)}</p>
                        <p>Total Due Amount: {formatCurrency(totalDue)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const ReportSpendingBreakdown: FC<{ data: any[], isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[300px] w-full" />;
    
    const COLORS = ['#0088FE', '#FF8042', '#00C49F', '#FFBB28', '#8884d8'];

    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Spending Breakdown</CardTitle></CardHeader>
            <CardContent>
                {data.length > 0 ? (
                    <div className="grid grid-cols-2 items-center gap-4">
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value: number, name, entry) => `${(entry.payload.percentage).toFixed(0)}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="text-sm space-y-2">
                            {data.map((entry, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                                    <span>{entry.name} {entry.percentage.toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : <p className="text-center text-muted-foreground py-10">No spending data</p>}
            </CardContent>
        </Card>
    );
};

const ReportInvestmentSummary: FC<{ data: any, isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[300px] w-full" />;

    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Investment Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center"><p>• Mutual Funds</p><p className="font-medium">{formatCurrency(data.mutualFunds)}</p></div>
                <div className="flex justify-between items-center"><p>• Stocks</p><p className="font-medium">{formatCurrency(data.stocks)}</p></div>
                <div className="flex justify-between items-center"><p>• SIP Monthly</p><p className="font-medium">{formatCurrency(data.sipMonthly)}</p></div>
                <div className="border-t pt-3 mt-3 space-y-3">
                    <div className="flex justify-between items-center font-semibold"><p>Total Investment:</p><p>{formatCurrency(data.totalInvested)}</p></div>
                    <div className="flex justify-between items-center font-semibold"><p>Current Value:</p><p>{formatCurrency(data.currentValue)}</p></div>
                    <div className="flex justify-between items-center font-bold" >
                        <p>Profit / Loss:</p>
                        <p className={data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const ReportLendingBorrowing: FC<{ data: any, isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[180px] w-full" />;

    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Lending & Borrowing</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
                 <div className="flex justify-between items-center"><p>• Money Given</p><p className="font-medium">{formatCurrency(data.lent)}</p></div>
                <div className="flex justify-between items-center"><p>• Money Borrowed</p><p className="font-medium">{formatCurrency(data.borrowed)}</p></div>
                <div className="flex justify-between items-center font-bold text-base border-t pt-3 mt-3">
                    <p>• Net Lending</p>
                    <p className={data.net >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(data.net)}</p>
                </div>
            </CardContent>
        </Card>
    )
}

const ReportRecentTransactions: FC<{ data: any[], isLoading: boolean }> = ({ data, isLoading }) => {
    if (isLoading) return <Skeleton className="h-[280px] w-full" />;
    
    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.transactionDate), 'dd MMM')}</TableCell>
                                <TableCell>{tx.categoryName}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const ReportAiInsights: FC<{ data: any, isLoading: boolean }> = ({ data, isLoading }) => {
     if (isLoading) return <Skeleton className="h-[180px] w-full" />;
    return (
        <Card className="shadow-md">
            <CardHeader><CardTitle>AI Insights</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p>• You spent 20% more on Dining this month.</p>
                <p>• Your savings rate is 16%. Aim for above 25%.</p>
                <p>• Highest spending category: Shopping (₹8,500).</p>
            </CardContent>
        </Card>
    )
}


// --- Main Page Component ---
export default function SummaryReportPage() {
  const [period, setPeriod] = useState('this-month');
  const { user } = useUser()
  const firestore = useFirestore()
  const { toast } = useToast()

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'last-month':
        const last = subMonths(now, 1);
        return { startDate: startOfMonth(last), endDate: endOfMonth(last) };
      case 'last-3-months':
        return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
      case 'last-6-months':
        return { startDate: startOfMonth(subMonths(now, 5)), endDate: endOfMonth(now) };
      case 'this-year':
        return { startDate: startOfYear(now), endDate: endOfYear(now) };
      case 'this-month':
      default:
        return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
  }, [period]);

  const transactionsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'transactions'), where('transactionDate', '>=', startDate.toISOString()), where('transactionDate', '<=', endDate.toISOString()), orderBy('transactionDate', 'desc')) : null, [user, firestore, startDate, endDate]);
  const { data: transactions, isLoading: loadingTransactions } = useCollection<Transaction>(transactionsQuery);

  const bankAccountsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'bankAccounts') : null, [user, firestore]);
  const { data: bankAccounts, isLoading: loadingBankAccounts } = useCollection<BankAccount>(bankAccountsQuery);
  
  const creditCardsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'creditCards') : null, [user, firestore]);
  const { data: creditCards, isLoading: loadingCreditCards } = useCollection<CreditCard>(creditCardsQuery);
  
  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore]);
  const { data: investments, isLoading: loadingInvestments } = useCollection<Investment>(investmentsQuery);

  const sipsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'sips'), where('active', '==', true)) : null, [user, firestore]);
  const { data: sips, isLoading: loadingSips } = useCollection<SIP>(sipsQuery);

  const personalDebtsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'personalDebts') : null, [user, firestore]);
  const { data: personalDebts, isLoading: loadingPersonalDebts } = useCollection<PersonalDebt>(personalDebtsQuery);

  const categoriesQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'categories') : null, [user, firestore]);
  const { data: categories, isLoading: loadingCategories } = useCollection<Category>(categoriesQuery);
  
  const isLoading = loadingTransactions || loadingBankAccounts || loadingCreditCards || loadingInvestments || loadingSips || loadingPersonalDebts || loadingCategories;
  
  // --- Memoized Calculations ---
  const reportData = useMemo(() => {
    if (!transactions) return { snapshot: {}, chart: [], spending: [], investment: {}, lending: {}, recent: [] };

    // Snapshot
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const totalInvestments = transactions.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

    // Earnings vs Spending
    const monthlyData: {[key: string]: {name: string, income: number, expense: number, savings: number}} = {};
    transactions.forEach(t => {
      const monthName = format(new Date(t.transactionDate), 'MMM');
      if (!monthlyData[monthName]) monthlyData[monthName] = { name: monthName, income: 0, expense: 0, savings: 0 };
      if (t.type === 'income') monthlyData[monthName].income += t.amount;
      if (t.type === 'expense') monthlyData[monthName].expense += t.amount;
    });
    const chartData = Object.values(monthlyData).map(m => ({ ...m, savings: m.income - m.expense }));

    // Spending Breakdown
    const categoryMap = categories?.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {} as Record<string, string>) ?? {};
    const spendingByCategory = transactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      const catName = t.categoryId ? categoryMap[t.categoryId] : 'Other';
      acc[catName] = (acc[catName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    const spendingData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value, percentage: (value / totalExpenses) * 100 })).sort((a,b) => b.value - a.value);

    // Investment
    const investmentSummary = {
        mutualFunds: investments?.filter(i => ['Hybrid', 'Debt'].includes(i.category)).reduce((s,i) => s + i.currentValue, 0) ?? 0,
        stocks: investments?.filter(i => i.category === 'Equity').reduce((s,i) => s + i.currentValue, 0) ?? 0,
        sipMonthly: sips?.reduce((s, sip) => s + sip.amount, 0) ?? 0,
        totalInvested: investments?.reduce((s, i) => s + i.investedAmount, 0) ?? 0,
        currentValue: investments?.reduce((s, i) => s + i.currentValue, 0) ?? 0,
        pnl: (investments?.reduce((s, i) => s + i.currentValue, 0) ?? 0) - (investments?.reduce((s, i) => s + i.investedAmount, 0) ?? 0)
    }

    // Lending
    const lendingSummary = {
        lent: personalDebts?.filter(d => d.type === 'lent').reduce((s, d) => s + d.originalAmount, 0) ?? 0,
        borrowed: personalDebts?.filter(d => d.type === 'borrowed').reduce((s, d) => s + d.originalAmount, 0) ?? 0,
        net: (personalDebts?.filter(d => d.type === 'lent').reduce((s, d) => s + d.originalAmount, 0) ?? 0) - (personalDebts?.filter(d => d.type === 'borrowed').reduce((s, d) => s + d.originalAmount, 0) ?? 0)
    }

    // Recent Transactions
    const recentTxData = transactions.slice(0, 5).map(tx => ({...tx, categoryName: tx.categoryId ? categoryMap[tx.categoryId] : 'N/A'}));


    return { 
        snapshot: { totalIncome, totalExpenses, totalInvestments, netBalance, savingsRate },
        chart: chartData,
        spending: spendingData,
        investment: investmentSummary,
        lending: lendingSummary,
        recent: recentTxData,
    };
  }, [transactions, investments, sips, personalDebts, categories]);

  const handleExcelDownload = () => {
    if (isLoading) {
        toast({ title: "Please wait", description: "Data is still loading." });
        return;
    }

    const wb = XLSX.utils.book_new();
    const periodString = `${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`;

    // 1. Summary Sheet
    const summaryWsData = [
        ["PayFirst Summary Report"],
        [`Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`],
        [],
        ["Metric", "Value"],
        ["Total Income", reportData.snapshot.totalIncome],
        ["Total Expenses", reportData.snapshot.totalExpenses],
        ["Total Investments", reportData.snapshot.totalInvestments],
        ["Net Balance", reportData.snapshot.netBalance],
        ["Savings Rate (%)", reportData.snapshot.savingsRate.toFixed(2)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryWsData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // 2. Transactions Sheet
    const categoryMap = categories?.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {} as Record<string, string>) ?? {};
    const transactionsWsData = transactions?.map(tx => ({
        Date: format(new Date(tx.transactionDate), 'yyyy-MM-dd'),
        Description: tx.description,
        Category: tx.categoryId ? categoryMap[tx.categoryId] : 'N/A',
        Amount: tx.amount,
        Type: tx.type,
    })) ?? [];
    const transactionsWs = XLSX.utils.json_to_sheet(transactionsWsData);
    XLSX.utils.book_append_sheet(wb, transactionsWs, "All Transactions");
    
    // 3. Spending Breakdown Sheet
    const spendingWsData = reportData.spending.map(item => ({
        Category: item.name,
        Amount: item.value,
        'Percentage (%)': item.percentage.toFixed(2),
    }));
    const spendingWs = XLSX.utils.json_to_sheet(spendingWsData);
    XLSX.utils.book_append_sheet(wb, spendingWs, "Spending Breakdown");

    // 4. Bank Accounts Sheet
    const bankAccountsWsData = bankAccounts?.map(acc => ({
        Name: acc.name,
        'Bank Name': acc.bankName,
        'Current Balance': acc.currentBalance,
        Type: acc.type,
    })) ?? [];
    const bankAccountsWs = XLSX.utils.json_to_sheet(bankAccountsWsData);
    XLSX.utils.book_append_sheet(wb, bankAccountsWs, "Bank Accounts");

    // 5. Credit Cards Sheet
    const creditCardsWsData = creditCards?.map(card => ({
        Name: card.name,
        Issuer: card.issuer,
        'Credit Limit': card.creditLimit,
        'Outstanding Balance': card.currentBalance,
        'Due Date': format(new Date(card.statementDueDate), 'yyyy-MM-dd'),
    })) ?? [];
    const creditCardsWs = XLSX.utils.json_to_sheet(creditCardsWsData);
    XLSX.utils.book_append_sheet(wb, creditCardsWs, "Credit Cards");

    // 6. Investments
    const investmentsWsData = investments?.map(inv => ({
        'Fund Name': inv.fundName,
        'Invested Amount': inv.investedAmount,
        'Current Value': inv.currentValue,
        'P&L': inv.currentValue - inv.investedAmount,
        'Category': inv.category
    })) ?? [];
    const investmentsWs = XLSX.utils.json_to_sheet(investmentsWsData);
    XLSX.utils.book_append_sheet(wb, investmentsWs, "Investments");

    // 7. Lending & Borrowing
    const debtsWsData = personalDebts?.map(debt => ({
        'Person Name': debt.personName,
        'Type': debt.type,
        'Original Amount': debt.originalAmount,
        'Remaining Amount': debt.remainingAmount,
        'Status': debt.status,
    })) ?? [];
    const debtsWs = XLSX.utils.json_to_sheet(debtsWsData);
    XLSX.utils.book_append_sheet(wb, debtsWs, "Lending & Borrowing");

    XLSX.writeFile(wb, `PayFirst_Report_${periodString}.xlsx`);
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 print:p-0">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Summary Report</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
           <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
            </Select>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleExcelDownload}>
            <FileDown className="mr-2 h-4 w-4" /> Download Excel
          </Button>
        </div>
      </div>

        <ReportSnapshot data={reportData.snapshot} isLoading={isLoading} />
        
        <ReportEarningsVsSpending data={reportData.chart} isLoading={isLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ReportAccountsSummary data={bankAccounts || []} isLoading={loadingBankAccounts} />
            <ReportCreditCards data={creditCards || []} isLoading={loadingCreditCards} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ReportSpendingBreakdown data={reportData.spending} isLoading={isLoading} />
            <ReportInvestmentSummary data={reportData.investment} isLoading={isLoading} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 space-y-8">
                <ReportLendingBorrowing data={reportData.lending} isLoading={loadingPersonalDebts} />
                <ReportAiInsights data={{}} isLoading={isLoading} />
           </div>
            <div className="lg:col-span-2">
                <ReportRecentTransactions data={reportData.recent} isLoading={loadingTransactions} />
            </div>
        </div>
    </div>
  )
}
