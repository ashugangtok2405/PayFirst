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
    prompt: `You are a senior financial analyst acting as a personal CFO.

Generate a professional financial performance report using ONLY the provided data.

STRICT REQUIREMENTS:
- Use a formal, analytical tone.
- Avoid exaggerated praise.
- Avoid generic advice.
- Do not repeat metrics unnecessarily.
- Do not invent assumptions.
- Compare values against financial benchmarks.
- Identify strengths, inefficiencies, and optimization opportunities.
- Be precise and data-driven.

USER DATA:
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

For the 'aiSummary' field, provide an "Executive Summary" of 3-4 analytical sentences.

For the 'aiDetailedInsight' field, provide the rest of the report in Markdown format, structured EXACTLY as follows:

### Savings Analysis
- Interpret savings efficiency.
- Compare to benchmark (15–25%).
- Explain structural strength or weakness.

### Debt & Credit Analysis
- Evaluate DTI (safe <35%).
- Evaluate credit utilization (ideal <30%).
- Identify leverage exposure or absence of financial leverage.

### Liquidity Analysis
- Compare runway to 3–6 month benchmark.
- Assess resilience level.

### Risk Assessment
- Identify current risk profile.
- Mention potential structural vulnerabilities (if any).
- Avoid saying "no risk".

### Strategic Recommendations
Provide 2–3 prioritized, high-impact recommendations.
Label them as:
Priority 1:
Priority 2:
(Optional) Priority 3:

Financial Benchmarks for your analysis:
- Savings Rate Healthy Range: 15–25%
- Debt-to-Income Safe Level: <35%
- Credit Utilization Ideal: <30%
- Emergency Fund Target: 3–6 months`,
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
