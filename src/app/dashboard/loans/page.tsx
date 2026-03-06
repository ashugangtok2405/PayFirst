'use client'

import { NetWorthSummary } from '@/components/app/accounts/net-worth-summary'
import { LoanManagement } from '@/components/app/accounts/loan-management'
import { SmartAlerts } from '@/components/app/accounts/smart-alerts'
import { AddAccountDialog } from '@/components/app/accounts/add-account-dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default function LoansPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Loans & EMIs</h1>
        <div className="flex w-full sm:w-auto items-center gap-4">
            <AddAccountDialog accountType='loan'>
                <Button variant="outline" className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Loan
                </Button>
            </AddAccountDialog>
        </div>
      </div>
      
      <NetWorthSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <LoanManagement />
        </div>
        <div className="lg:col-span-1">
          <SmartAlerts />
        </div>
      </div>
    </div>
  )
}
