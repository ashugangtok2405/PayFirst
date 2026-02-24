import { OverviewCards } from '@/components/app/overview-cards'
import { RecentTransactions } from '@/components/app/recent-transactions'
import { SpendingChart } from '@/components/app/spending-chart'
import { AddTransactionDialog } from '@/components/app/add-transaction-dialog'

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
        <AddTransactionDialog />
      </div>
      <div className="grid gap-4 md:gap-8">
        <OverviewCards />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <SpendingChart />
          </div>
          <div className="lg:col-span-3">
            <RecentTransactions />
          </div>
        </div>
      </div>
    </>
  )
}
