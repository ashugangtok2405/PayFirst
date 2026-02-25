'use server';
/**
 * @fileOverview An AI agent that analyzes a user's complete financial picture to generate a health score and personalized insights.
 */

import {ai} from '@/ai/genkit';
import { FinancialHealthAnalysisPromptInputSchema, FinancialHealthStructuredAIOutputSchema, type FinancialHealthAnalysisPromptInput, type FinancialHealthStructuredAIOutput } from './types';

// This function now expects the full prompt input and returns only the AI narratives
export async function getFinancialHealthNarrative(
  input: FinancialHealthAnalysisPromptInput
): Promise<FinancialHealthStructuredAIOutput> {
  return financialHealthNarrativeFlow(input);
}

const prompt = ai.definePrompt({
    name: 'financialHealthNarrativePrompt',
    input: {schema: FinancialHealthAnalysisPromptInputSchema},
    output: {schema: FinancialHealthStructuredAIOutputSchema},
    prompt: `You are a senior financial analyst AI acting as a personal CFO.

Your task is to generate structured financial commentary based ONLY on the provided metrics.

IMPORTANT RULES:
- Do NOT invent numbers.
- Do NOT recalculate anything.
- Use ONLY the data provided.
- Do NOT repeat numbers excessively.
- Keep tone professional, analytical, and executive-level.
- Avoid exaggerated praise.
- Avoid generic advice.
- Be concise but insightful.
- Focus on interpretation and financial implications.
- Do not use emojis.

Output format EXACTLY as follows:

{
  "financialHealthSummary": "...",
  "spendingInsight": "...",
  "cashFlowInsight": "...",
  "debtInsight": "...",
  "forecastInsight": "..."
}

GUIDELINES FOR EACH SECTION:

financialHealthSummary:
- Interpret the overall financial health score.
- Comment on structural strengths or weaknesses.
- Mention balance between income, debt, liquidity.

spendingInsight:
- Interpret category concentration.
- Comment on spending distribution.
- Mention risk if concentration is high.
- Mention efficiency if balanced.

cashFlowInsight:
- Analyze burn rate and survival time.
- Assess stability of income vs expenses.
- Comment on trend direction (improving, declining, stable).

debtInsight:
- Evaluate debt-to-income ratio.
- Evaluate credit utilization.
- Assess pressure level (low, moderate, high).
- Mention structural financial risk if present.

forecastInsight:
- Interpret projected month-end balance.
- Assess sustainability of current spending pace.
- Mention if adjustment is needed.

FINANCIAL BENCHMARKS:
Healthy Savings Rate: 15–25%
Safe DTI: <35%
Ideal Credit Utilization: <30%
Emergency Fund Target: 3–6 months

USER DATA:

Financial Health Score: {{{finalScore}}}
Health Status: {{{status}}}

Savings Rate: {{{savingsRate}}}%
Monthly Income: {{{monthlyIncome}}}
Monthly Expense: {{{monthlyExpense}}}

Monthly Burn Rate: {{{monthlyBurnRate}}}
Cash Runway: {{{cashRunwayMonths}}} months

Debt-to-Income Ratio: {{{debtToIncomeRatio}}}%
Credit Utilization: {{{creditUtilization}}}%`,
  });

const financialHealthNarrativeFlow = ai.defineFlow(
    {
      name: 'financialHealthNarrativeFlow',
      inputSchema: FinancialHealthAnalysisPromptInputSchema,
      outputSchema: FinancialHealthStructuredAIOutputSchema,
    },
    async (input) => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('No output received from AI financial health prompt.');
      }
      return output;
    }
);
