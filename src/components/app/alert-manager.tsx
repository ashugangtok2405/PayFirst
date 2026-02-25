'use client'

import { useAlertManager } from '@/hooks/use-alert-manager'

// This component is invisible and just runs the hook logic.
export function AlertManager() {
  useAlertManager()
  return null
}
