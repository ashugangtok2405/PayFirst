'use client'

import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'
import { OverviewCards } from '@/components/app/overview-cards'
import { RecentTransactions } from '@/components/app/recent-transactions'
import { SpendingChart } from '@/components/app/spending-chart'
import { CategoryBreakdown } from '@/components/app/category-breakdown'
import { CreditCardOverview } from '@/components/app/credit-card-overview'
import { SavingsProgress } from '@/components/app/savings-progress'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <AddTransactionDialog />
      </div>

      <OverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart />
        </div>
        <div className="space-y-6">
          <CategoryBreakdown />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CreditCardOverview />
        </div>
        <div className="space-y-6">
          <SavingsProgress />
        </div>
      </div>

      <RecentTransactions />
    </div>
  )
}
