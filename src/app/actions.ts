'use server'

import {
  getFinancialHealthNarrative,
} from '@/ai/flows/financial-health-analysis'
import type { FinancialHealthInput, FinancialHealthOutput, FinancialHealthStructuredAIOutput } from '@/ai/flows/types'
import { calculateFinancialHealth } from '@/lib/financial-health'

export async function getFinancialHealthAnalysisAction(input: FinancialHealthInput): Promise<{ success: boolean, data?: FinancialHealthOutput, error?: string }> {
  try {
    // Step 1: Calculate all metrics and the score deterministically in TypeScript.
    const calculatedMetrics = calculateFinancialHealth(input);
    
    let aiOutput: FinancialHealthStructuredAIOutput | null = null;
    let aiErrorString: string | null = null;

    try {
      // Step 2: Try to get the AI-generated narratives.
      aiOutput = await getFinancialHealthNarrative({
        ...input,
        ...calculatedMetrics
      });
    } catch (aiError: any) {
      console.error('Error generating AI narrative:', aiError);
      aiErrorString = aiError.message || 'An unknown error occurred while generating the AI narrative.';
    }

    // Step 3: Combine calculated data with AI narratives (or fallbacks).
    const finalResult: FinancialHealthOutput = {
      // Pass all calculated metrics back to the client
      finalScore: calculatedMetrics.finalScore,
      status: calculatedMetrics.status,
      savingsRate: calculatedMetrics.savingsRate,
      debtToIncomeRatio: calculatedMetrics.debtToIncomeRatio,
      cashRunwayMonths: calculatedMetrics.cashRunwayMonths,
      creditUtilization: calculatedMetrics.creditUtilization,
      
      // Use AI output or provide a detailed fallback with the specific error.
      aiSummary: aiOutput?.financialHealthSummary ?? "Metrics calculated, but AI summary failed. See details below.",
      aiDetailedInsight: aiOutput 
        ? `### Spending Insight\n${aiOutput.spendingInsight}\n\n### Cash Flow Insight\n${aiOutput.cashFlowInsight}\n\n### Debt Insight\n${aiOutput.debtInsight}\n\n### Forecast Insight\n${aiOutput.forecastInsight}`
        : `### AI Analysis Unavailable\n\nThe AI-powered detailed analysis could not be generated.\n\n**Reason:** ${aiErrorString}`
    };

    return { success: true, data: finalResult };

  } catch (error: any) {
    console.error('Error in financial health analysis action:', error);
    return { success: false, error: `Failed to calculate financial metrics: ${error.message}` }
  }
}
