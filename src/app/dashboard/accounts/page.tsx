'use client'

import { BankAccountsSummary } from '@/components/app/accounts/bank-accounts-summary'
import { BankAccounts } from '@/components/app/accounts/bank-accounts'
import { SmartAlerts } from '@/components/app/accounts/smart-alerts'
import { TransferMoneyDialog } from '@/components/app/accounts/transfer-money-dialog'
import { AddAccountDialog } from '@/components/app/accounts/add-account-dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default function AccountsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Bank Accounts</h1>
        <div className="flex w-full sm:w-auto items-center gap-4">
            <AddAccountDialog accountType='bank'>
                <Button variant="outline" className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </AddAccountDialog>
            <TransferMoneyDialog />
        </div>
      </div>
      
      <BankAccountsSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <BankAccounts />
        </div>
        <div className="lg:col-span-1">
          <SmartAlerts />
        </div>
      </div>
    </div>
  )
}
