'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Target, TrendingUp, AlertTriangle } from 'lucide-react'
import { differenceInMonths, format, parseISO } from 'date-fns'
import type { Goal, Investment, SIP } from '@/lib/types'
import { cn } from '@/lib/utils'

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
}

interface GoalProgressCardProps {
    goal: Goal & {
        linkedInvestments: Investment[],
        linkedSips: SIP[],
    }
}

export function GoalProgressCard({ goal }: GoalProgressCardProps) {
    const analysis = useMemo(() => {
        const currentAmount = goal.linkedInvestments.reduce((sum, inv) => sum + inv.currentValue, 0)
        const progressPercent = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0
        const shortfall = Math.max(0, goal.targetAmount - currentAmount)
        
        const targetDate = parseISO(goal.targetDate)
        const monthsRemaining = Math.max(1, differenceInMonths(targetDate, new Date()))
        
        const requiredMonthlyInvestment = shortfall / monthsRemaining
        const currentMonthlyInvestment = goal.linkedSips.filter(sip => sip.active).reduce((sum, sip) => sum + sip.amount, 0)
        
        const isOnTrack = currentMonthlyInvestment >= requiredMonthlyInvestment
        const additionalSipRequired = isOnTrack ? 0 : requiredMonthlyInvestment - currentMonthlyInvestment

        return {
            currentAmount,
            progressPercent,
            shortfall,
            monthsRemaining,
            requiredMonthlyInvestment,
            currentMonthlyInvestment,
            isOnTrack,
            additionalSipRequired,
        }
    }, [goal])

    const progressColor = analysis.isOnTrack ? 'bg-green-500' : 'bg-yellow-500'

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl">{goal.name}</CardTitle>
                        <CardDescription>Target: {format(parseISO(goal.targetDate), 'MMM yyyy')}</CardDescription>
                    </div>
                    <Target className="h-6 w-6 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <div className="text-center">
                    <p className="text-3xl font-bold">{formatCurrency(analysis.currentAmount)}</p>
                    <p className="text-sm text-muted-foreground">of {formatCurrency(goal.targetAmount)}</p>
                </div>
                <div className="space-y-2">
                    <Progress value={analysis.progressPercent} indicatorClassName={progressColor} />
                    <p className="text-right text-sm font-medium">{analysis.progressPercent.toFixed(1)}% Complete</p>
                </div>
            </CardContent>
            <CardFooter>
                 {analysis.isOnTrack ? (
                    <Badge variant="outline" className="w-full justify-center p-2 text-green-700 bg-green-50 border-green-200">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        You're on track to reach your goal!
                    </Badge>
                 ) : (
                    <Badge variant="outline" className="w-full items-start justify-center p-2 text-yellow-700 bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="mr-2 h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Slightly off track</p>
                            <p className="font-normal">Invest an additional {formatCurrency(analysis.additionalSipRequired)}/month to catch up.</p>
                        </div>
                    </Badge>
                 )}
            </CardFooter>
        </Card>
    )
}
