import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Landmark, CreditCard, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { ACCOUNTS, CREDIT_CARDS, TRANSACTIONS } from '@/lib/data'

export function OverviewCards() {
  const totalBalance = ACCOUNTS.reduce((sum, account) => sum + account.balance, 0);
  const totalDebt = CREDIT_CARDS.reduce((sum, card) => sum + card.outstanding, 0);
  
  const now = new Date();
  const monthlyIncome = TRANSACTIONS.filter(t => t.type === 'income' && new Date(t.date).getMonth() === now.getMonth()).reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = TRANSACTIONS.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth()).reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <p className="text-xs text-muted-foreground">Across all bank accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credit Card Debt</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
          <p className="text-xs text-muted-foreground">Total outstanding balance</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month's Income</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month's Expenses</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(monthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">+1.2% from last month</p>
        </CardContent>
      </Card>
    </div>
  )
}
