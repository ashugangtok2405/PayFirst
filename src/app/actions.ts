'use server'

import {
  getAiSpendingInsights,
  type AiSpendingInsightsInput,
} from '@/ai/flows/ai-spending-insights'

export async function generateInsightsAction(input: AiSpendingInsightsInput) {
  try {
    const insights = await getAiSpendingInsights(input)
    return { success: true, data: insights }
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return { success: false, error: 'Failed to generate insights. Please try again later.' }
  }
}
