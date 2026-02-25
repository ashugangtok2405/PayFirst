'use client'

import { useRecurringProcessor } from '@/hooks/use-recurring-processor';

// This component is invisible and just runs the hook logic on mount.
export function RecurringProcessor() {
  useRecurringProcessor();
  return null;
}
