'use client'

import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'
import { OverviewCards } from '@/components/app/overview-cards'
import { RecentTransactions } from '@/components/app/recent-transactions'
import { SpendingChart } from '@/components/app/spending-chart'

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <div className="ml-auto flex items-center gap-2">
          <AddTransactionDialog />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 rounded-lg md:gap-8">
        <OverviewCards />
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
          <SpendingChart />
          <RecentTransactions />
        </div>
      </div>
    </>
  )
}
