'use server'

import {
  getFinancialHealthNarrative,
} from '@/ai/flows/financial-health-analysis'
import type { FinancialHealthInput, FinancialHealthOutput } from '@/ai/flows/types'
import { calculateFinancialHealth } from '@/lib/financial-health'

export async function getFinancialHealthAnalysisAction(input: FinancialHealthInput): Promise<{ success: boolean, data?: FinancialHealthOutput, error?: string }> {
  try {
    // Step 1: Calculate all metrics and the score deterministically in TypeScript.
    const calculatedMetrics = calculateFinancialHealth(input);
    
    let aiOutput = null;
    try {
      // Step 2: Try to get the AI-generated narratives.
      aiOutput = await getFinancialHealthNarrative({
        ...input,
        ...calculatedMetrics
      });
    } catch (aiError) {
      console.error('Error generating AI narrative:', aiError);
      // AI call failed, but we can proceed with a fallback.
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
      
      // Use AI output or fallbacks
      aiSummary: aiOutput?.aiSummary ?? "Your financial metrics have been calculated. The AI summary could not be generated at this time.",
      aiDetailedInsight: aiOutput?.aiDetailedInsight ?? "### Analysis Unavailable\n\nThe AI-powered detailed analysis could not be generated. Please check your key metrics for an overview of your financial health."
    };

    return { success: true, data: finalResult };

  } catch (error) {
    console.error('Error in financial health analysis action:', error);
    return { success: false, error: 'Failed to calculate financial metrics. Please check the input data.' }
  }
}
