'use client'

import { useMemo } from 'react'
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection } from 'firebase/firestore'
import type { Goal, Investment, SIP } from '@/lib/types'
import { GoalProgressCard } from './goal-progress-card'
import { Skeleton } from '@/components/ui/skeleton'

export function GoalsOverview() {
  const { user } = useUser()
  const firestore = useFirestore()

  const goalsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'goals') : null, [user, firestore])
  const { data: goals, isLoading: loadingGoals } = useCollection<Goal>(goalsQuery)

  const investmentsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'investments') : null, [user, firestore])
  const { data: investments, isLoading: loadingInvestments } = useCollection<Investment>(investmentsQuery)
  
  const sipsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'sips') : null, [user, firestore])
  const { data: sips, isLoading: loadingSips } = useCollection<SIP>(sipsQuery)

  const isLoading = loadingGoals || loadingInvestments || loadingSips

  const enrichedGoals = useMemo(() => {
    if (isLoading || !goals || !investments || !sips) return []
    
    return goals.map(goal => {
      const linkedInvestments = investments.filter(inv => goal.linkedInvestmentIds.includes(inv.id))
      const linkedSips = sips.filter(sip => goal.linkedInvestmentIds.includes(sip.investmentId))
      return {
        ...goal,
        linkedInvestments,
        linkedSips,
      }
    })
  }, [isLoading, goals, investments, sips])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    )
  }

  if (!goals || goals.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">You have no financial goals yet.</h3>
        <p className="text-muted-foreground mt-2">Create a goal to start tracking your progress!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {enrichedGoals.map(goal => (
        <GoalProgressCard key={goal.id} goal={goal} />
      ))}
    </div>
  )
}
