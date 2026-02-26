'use client'

import { KpiSummary } from '@/components/app/dashboard/kpi-summary'
import { CashFlowChart } from '@/components/app/dashboard/cash-flow-chart'
import { NetWorthTrend } from '@/components/app/dashboard/net-worth-trend'
import { TopExpenses } from '@/components/app/dashboard/top-expenses'
import { UpcomingBills } from '@/components/app/dashboard/upcoming-bills'
import { SmartAlertsDashboard } from '@/components/app/dashboard/smart-alerts-dashboard'


export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <KpiSummary />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CashFlowChart />
        </div>
        <div className="lg:col-span-1">
          <NetWorthTrend />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <TopExpenses />
        <UpcomingBills />
        <SmartAlertsDashboard />
      </div>
    </div>
  )
}
