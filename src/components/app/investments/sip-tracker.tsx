'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, where } from 'firebase/firestore'
import type { SIP, Investment } from '@/lib/types'
import { Repeat } from 'lucide-react'
import { format } from 'date-fns'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
  }).format(amount)
}

export function SipTracker() {
  const { user } = useUser()
  const firestore = useFirestore()

  const sipsQuery = useMemoFirebase(() => user ? query(collection(firestore, 'users', user.uid, 'sips'), where('active', '==', true)) : null, [user, firestore])
  const { data: sips, isLoading: loadingSips } = useCollection<SIP>(sipsQuery)

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading: loadingInvestments } = useCollection<Investment>(investmentsQuery)
  
  const isLoading = loadingSips || loadingInvestments

  const { totalSipAmount, sipsWithFundNames } = useMemo(() => {
    if (!sips || !investments) return { totalSipAmount: 0, sipsWithFundNames: [] }
    const total = sips.reduce((sum, sip) => sum + sip.amount, 0)
    const investmentMap = new Map(investments.map(inv => [inv.id, inv.fundName]))
    const enrichedSips = sips.map(sip => ({
      ...sip,
      fundName: investmentMap.get(sip.investmentId) || 'Unknown Fund'
    })).sort((a,b) => a.sipDate - b.sipDate);

    return { totalSipAmount: total, sipsWithFundNames: enrichedSips }
  }, [sips, investments])
  
  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-40 mt-2" />
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-24 w-full" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Repeat /> SIP Tracker</CardTitle>
        <CardDescription>Your upcoming monthly systematic investments.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 bg-muted/50 rounded-lg text-center mb-4">
            <p className="text-sm text-muted-foreground">Total Monthly SIP Commitment</p>
            <p className="text-3xl font-bold">{formatCurrency(totalSipAmount)}</p>
        </div>
        <div className="space-y-3">
          {sipsWithFundNames.length > 0 ? sipsWithFundNames.map(sip => (
            <div key={sip.id} className="flex justify-between items-center text-sm">
                <div>
                    <p className="font-medium">{sip.fundName}</p>
                    <p className="text-xs text-muted-foreground">Due on: {format(new Date(sip.nextDueDate), 'do MMMM')}</p>
                </div>
                <p className="font-semibold">{formatCurrency(sip.amount)}</p>
            </div>
          )) : (
            <p className="text-center text-sm text-muted-foreground py-4">No active SIPs found.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
