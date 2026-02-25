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
    prompt: `You are a professional financial analyst AI acting as a personal CFO.

Analyze the user's financial metrics and generate a structured, data-driven financial report.

STRICT RULES:
- Use ONLY the data provided.
- Do NOT invent numbers.
- Do NOT exaggerate.
- Avoid motivational language.
- Keep tone professional, analytical, and executive-level.
- Be concise but insightful.
- Use clean markdown formatting.
- Do not use emojis.
- Do not repeat numbers unnecessarily.

USER FINANCIAL DATA:
Financial Health Score: {{{finalScore}}}
Status: {{{status}}}
Savings Rate: {{{savingsRate}}}%
Debt-to-Income Ratio: {{{debtToIncomeRatio}}}%
Cash Runway: {{{cashRunwayMonths}}} months
Credit Utilization: {{{creditUtilization}}}%
Monthly Income: {{{monthlyIncome}}}
Monthly Expense: {{{monthlyExpense}}}
Monthly EMI: {{{totalMonthlyEmi}}}

Generate the report in the required JSON format.

For the 'aiSummary' field, provide a 3-4 sentence Executive Summary.

For the 'aiDetailedInsight' field, provide the rest of the report in Markdown format, structured EXACTLY as follows:
### Savings Analysis
### Debt & Credit Analysis
### Liquidity Analysis
### Risk Assessment
### Strategic Recommendations (2-3 precise actions)

Guidelines for the detailed insight:
- Compare metrics to standard financial benchmarks.
- Explain what the numbers imply.
- Identify strengths and vulnerabilities.
- Prioritize recommendations based on impact.
- If risk is low, focus on optimization.
- If risk is high, focus on stability first.

Financial Benchmarks:
- Healthy savings rate: 15–25%
- Safe Debt-to-Income ratio: below 35%
- Ideal credit utilization: below 30%
- Recommended emergency fund: 3–6 months
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
