'use server';
/**
 * @fileOverview An AI agent that analyzes a user's complete financial picture to generate a health score and personalized insights.
 */

import {ai} from '@/ai/genkit';
import { FinancialHealthAnalysisPromptInputSchema, FinancialHealthAIOutputSchema, type FinancialHealthAnalysisPromptInput, type FinancialHealthAIOutput } from './types';

// This function now expects the full prompt input and returns only the AI narratives
export async function getFinancialHealthNarrative(
  input: FinancialHealthAnalysisPromptInput
): Promise<FinancialHealthAIOutput> {
  return financialHealthNarrativeFlow(input);
}

const prompt = ai.definePrompt({
    name: 'financialHealthNarrativePrompt',
    input: {schema: FinancialHealthAnalysisPromptInputSchema},
    output: {schema: FinancialHealthAIOutputSchema},
    prompt: `You are an expert AI financial analyst named 'PayFirst Insights'. Your task is to generate a narrative financial health assessment. You have already been provided with the user's key financial metrics and a final score. Your job is to explain what these numbers mean in a clear, encouraging, and actionable way.

    **PROVIDED DATA (DO NOT RECALCULATE):**
    - Financial Health Score: {{{finalScore}}}
    - Status: {{{status}}}
    - Monthly Income: {{{monthlyIncome}}}
    - Monthly Expense: {{{monthlyExpense}}}
    - Savings Rate: {{{savingsRate}}}%
    - Debt-to-Income (DTI) Ratio: {{{debtToIncomeRatio}}}%
    - Cash Runway: {{{cashRunwayMonths}}} months
    - Credit Utilization: {{{creditUtilization}}}%

    **Step 1: Generate AI Summary (aiSummary)**
    - Write a 2-3 sentence summary.
    - Start with the final score and status.
    - Mention the user's single STRONGEST area (e.g., "excellent savings rate") and their single WEAKEST area (e.g., "but high credit utilization is a concern").

    **Step 2: Generate Detailed Insight (aiDetailedInsight)**
    - Write in Markdown format.
    - Provide a paragraph for each key area: Savings, Debt, and Liquidity. Use the provided metrics to support your analysis.
    - **Savings Analysis:** Comment on the savings rate. Is it healthy? If not, why is it important?
    - **Debt Analysis:** Comment on the DTI ratio and credit utilization. Explain what these mean for their financial risk.
    - **Liquidity Analysis:** Comment on the cash runway. Explain its importance as an emergency fund.
    - Conclude with 1-2 clear, actionable, and prioritized recommendations based on the weakest areas identified. Be encouraging but direct.
        - If Savings Rate is low (<10%), suggest specific budgeting strategies or reviewing expenses.
        - If DTI is high (>35%), suggest exploring ways to reduce EMI or increase income.
        - If Credit Utilization is high (>50%), recommend a plan to pay down balances to improve their credit score.
        - If Cash Runway is low (<3 months), emphasize the urgency of building an emergency fund.

    Now, based on the user's data, generate the narrative results in the required JSON format.
    `,
  });

const financialHealthNarrativeFlow = ai.defineFlow(
    {
      name: 'financialHealthNarrativeFlow',
      inputSchema: FinancialHealthAnalysisPromptInputSchema,
      outputSchema: FinancialHealthAIOutputSchema,
    },
    async (input) => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('No output received from AI financial health prompt.');
      }
      return output;
    }
);
