'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { CashFlowChart } from '@/components/app/dashboard/cash-flow-chart'
import { NetWorthTrend } from '@/components/app/dashboard/net-worth-trend'
import { TopExpenses } from '@/components/app/dashboard/top-expenses'
import { KpiSummary } from '@/components/app/dashboard/kpi-summary'
import { PortfolioAllocation } from '@/components/app/investments/portfolio-allocation'
import { RecentTransactions } from '@/components/app/recent-transactions'

export default function SummaryReportPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
            <h1 className="text-2xl font-semibold">Summary Report</h1>
            <p className="text-muted-foreground">A comprehensive overview of your financial health.</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
          <Download className="mr-2 h-4 w-4" /> Download Report
        </Button>
      </div>

        <KpiSummary />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
                <CashFlowChart />
            </div>
            <div className="lg:col-span-2">
                <NetWorthTrend />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <TopExpenses />
            </div>
            <div className="lg:col-span-3">
                <PortfolioAllocation />
            </div>
        </div>

        <RecentTransactions />
    </div>
  )
}
