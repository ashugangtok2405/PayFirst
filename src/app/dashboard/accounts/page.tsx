'use client'

import { NetWorthSummary } from '@/components/app/accounts/net-worth-summary'
import { BankAccounts } from '@/components/app/accounts/bank-accounts'
import { CreditCardManagement } from '@/components/app/accounts/credit-card-management'
import { LoanManagement } from '@/components/app/accounts/loan-management'
import { SmartAlerts } from '@/components/app/accounts/smart-alerts'
import { TransferMoneyDialog } from '@/components/app/accounts/transfer-money-dialog'
import { AddAccountDialog } from '@/components/app/accounts/add-account-dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default function AccountsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <div className="flex items-center gap-4">
            <AddAccountDialog>
                <Button variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </AddAccountDialog>
            <TransferMoneyDialog />
        </div>
      </div>
      
      <NetWorthSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <BankAccounts />
          <CreditCardManagement />
          <LoanManagement />
        </div>
        <div className="lg:col-span-1">
          <SmartAlerts />
        </div>
      </div>
    </div>
  )
}
