'use client'

import { useEffect } from 'react'
import {
  useUser,
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase'
import {
  collection,
  query,
  where,
  writeBatch,
  doc,
} from 'firebase/firestore'
import type { CreditCard, Alert } from '@/lib/types'

// Thresholds
const CRITICAL_UTILIZATION = 80
const WARNING_UTILIZATION = 60

export function useAlertManager() {
  const { user } = useUser()
  const firestore = useFirestore()

  // Fetch all credit cards
  const creditCardsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'creditCards') : null),
    [firestore, user]
  )
  const { data: creditCards } = useCollection<CreditCard>(creditCardsQuery)

  // Fetch all unresolved credit utilization alerts
  const alertsQuery = useMemoFirebase(
    () =>
      user
        ? query(
            collection(firestore, 'users', user.uid, 'alerts'),
            where('type', '==', 'credit_utilization'),
            where('resolved', '==', false)
          )
        : null,
    [firestore, user]
  )
  const { data: activeAlerts } = useCollection<Alert>(alertsQuery)

  useEffect(() => {
    if (!creditCards || !activeAlerts || !user || !firestore) {
      return
    }

    const processAlerts = async () => {
      const batch = writeBatch(firestore)
      const activeAlertsMap = new Map(
        activeAlerts.map((a) => [a.accountId, a])
      )

      for (const card of creditCards) {
        if (card.creditLimit <= 0) continue

        const utilization = (card.currentBalance / card.creditLimit) * 100
        const existingAlert = activeAlertsMap.get(card.id)

        // Condition for creating a CRITICAL alert
        if (utilization >= CRITICAL_UTILIZATION) {
          if (existingAlert?.severity !== 'critical') {
            // If there's an old warning alert, resolve it
            if (existingAlert) {
              const oldAlertRef = doc(
                firestore,
                'users',
                user.uid,
                'alerts',
                existingAlert.id
              )
              batch.update(oldAlertRef, { resolved: true })
            }
            // Create a new critical alert
            const newAlertRef = doc(
              collection(firestore, 'users', user.uid, 'alerts')
            )
            const newAlert: Omit<Alert, 'id'> = {
              userId: user.uid,
              type: 'credit_utilization',
              accountId: card.id,
              title: 'High Credit Utilization',
              message: `Your ${
                card.name
              } card is at ${utilization.toFixed(0)}% utilization.`,
              severity: 'critical',
              isRead: false,
              resolved: false,
              createdAt: new Date().toISOString(),
              actionLink: '/dashboard/accounts',
            }
            batch.set(newAlertRef, newAlert)
          }
        }
        // Condition for creating a WARNING alert
        else if (utilization >= WARNING_UTILIZATION) {
          if (!existingAlert) {
            // Create a new warning alert only if no active alert exists
            const newAlertRef = doc(
              collection(firestore, 'users', user.uid, 'alerts')
            )
            const newAlert: Omit<Alert, 'id'> = {
              userId: user.uid,
              type: 'credit_utilization',
              accountId: card.id,
              title: 'High Credit Utilization',
              message: `Your ${
                card.name
              } card is at ${utilization.toFixed(0)}% utilization.`,
              severity: 'warning',
              isRead: false,
              resolved: false,
              createdAt: new Date().toISOString(),
              actionLink: '/dashboard/accounts',
            }
            batch.set(newAlertRef, newAlert)
          }
        }
        // Condition for RESOLVING an existing alert
        else {
          if (existingAlert) {
            const oldAlertRef = doc(
              firestore,
              'users',
              user.uid,
              'alerts',
              existingAlert.id
            )
            batch.update(oldAlertRef, { resolved: true })
          }
        }
      }

      try {
        await batch.commit()
      } catch (error) {
        // This might fail if another process is committing a batch simultaneously.
        // It's generally safe to ignore for this use case, as the hook will re-run.
        console.error('Error processing credit utilization alerts:', error)
      }
    }

    processAlerts()
  }, [creditCards, activeAlerts, user, firestore])
}
