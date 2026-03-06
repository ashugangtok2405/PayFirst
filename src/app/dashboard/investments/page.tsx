'use client'

import { InvestmentSummary } from '@/components/app/investments/investment-summary'
import { PortfolioOverview } from '@/components/app/investments/portfolio-overview'
import { SipTracker } from '@/components/app/investments/sip-tracker'
import { AddInvestmentDialog } from '@/components/app/investments/add-investment-dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { PortfolioAllocation } from '@/components/app/investments/portfolio-allocation'
import { RecentInvestmentTransactions } from '@/components/app/investments/recent-investment-transactions'

export default function InvestmentsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Investments</h1>
        <AddInvestmentDialog>
          <Button variant="outline" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Investment
          </Button>
        </AddInvestmentDialog>
      </div>

      <InvestmentSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PortfolioOverview />
        </div>
        <div className="lg:col-span-1 space-y-8">
          <SipTracker />
          <PortfolioAllocation />
        </div>
      </div>
      
      <RecentInvestmentTransactions />
    </div>
  )
}
