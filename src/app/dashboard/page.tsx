'use client'

import { OverviewCards } from '@/components/app/overview-cards'
import { SpendingChart } from '@/components/app/spending-chart'
import { CategoryBreakdown } from '@/components/app/category-breakdown'
import { CreditCardOverview } from '@/components/app/credit-card-overview'
import { SavingsProgress } from '@/components/app/savings-progress'

export default function DashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <OverviewCards />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <SpendingChart />
        </div>
        <div className="lg:col-span-2">
            <CategoryBreakdown />
        </div>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CreditCardOverview />
          </div>
          <div className="lg:col-span-2">
            <SavingsProgress />
          </div>
      </div>
    </div>
  )
}
