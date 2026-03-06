'use client'

import { GoalsOverview } from '@/components/app/goals/goals-overview'
import { AddGoalDialog } from '@/components/app/goals/add-goal-dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export default function GoalsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Financial Goals</h1>
        <AddGoalDialog>
          <Button variant="outline" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Goal
          </Button>
        </AddGoalDialog>
      </div>

      <GoalsOverview />
    </div>
  )
}
