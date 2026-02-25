'use server'

import {
  getFinancialHealthAnalysis,
} from '@/ai/flows/financial-health-analysis'
import type { FinancialHealthInput } from '@/ai/flows/types'

export async function getFinancialHealthAnalysisAction(input: FinancialHealthInput) {
  try {
    const analysis = await getFinancialHealthAnalysis(input)
    return { success: true, data: analysis }
  } catch (error) {
    console.error('Error generating financial health analysis:', error)
    return { success: false, error: 'Failed to generate analysis. Please try again later.' }
  }
}
