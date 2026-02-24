'use server';
/**
 * @fileOverview An AI agent that analyzes personal spending patterns and provides personalized recommendations for cost savings and financial improvement.
 *
 * - getAiSpendingInsights - A function that handles the spending insights process.
 * - AiSpendingInsightsInput - The input type for the getAiSpendingInsights function.
 * - AiSpendingInsightsOutput - The return type for the getAiSpendingInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSpendingInsightsInputSchema = z.object({
  monthlyIncome: z
    .number()
    .describe('The user\u0027s total monthly income.'),
  categorizedExpenses: z
    .array(
      z.object({
        category: z
          .string()
          .describe('The category of expenses (e.g., Food, Transport).'),
        amount: z.number().describe('The total amount spent in this category.'),
        count: z
          .number()
          .describe('The number of transactions in this category.'),
      })
    )
    .describe('A summary of expenses, grouped by category.'),
  totalMonthlySpending: z
    .number()
    .describe('The user\u0027s total spending for the month.'),
  currentSavingsBalance: z
    .number()
    .describe('The current balance in the user\u0027s savings account.'),
  savingsGoalDescription: z
    .string()
    .optional()
    .describe('An optional description of the user\u0027s savings goals.'),
});
export type AiSpendingInsightsInput = z.infer<
  typeof AiSpendingInsightsInputSchema
>;

const AiSpendingInsightsOutputSchema = z.object({
  overallAnalysis: z
    .string()
    .describe(
      'A comprehensive analysis of the user\u0027s spending habits, highlighting strengths and weaknesses.'
    ),
  costSavingRecommendations: z
    .array(z.string())
    .describe('A list of actionable recommendations for the user to save money.'),
  financialHabitTips: z
    .array(z.string())
    .describe('Tips and advice to improve overall financial habits.'),
  areasForImprovement: z
    .array(z.string())
    .describe(
      'Key areas identified where the user can focus on improving their finances.'
    ),
});
export type AiSpendingInsightsOutput = z.infer<
  typeof AiSpendingInsightsOutputSchema
>;

export async function getAiSpendingInsights(
  input: AiSpendingInsightsInput
): Promise<AiSpendingInsightsOutput> {
  return aiSpendingInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSpendingInsightsPrompt',
  input: {schema: AiSpendingInsightsInputSchema},
  output: {schema: AiSpendingInsightsOutputSchema},
  prompt: `You are a financial advisor for PayFirst, a personal finance tracking web app.
Your goal is to provide personalized, actionable recommendations for cost savings and financial improvement based on a user's spending patterns.

Analyze the following financial data for the user:

Monthly Income: {{{monthlyIncome}}}
Total Monthly Spending: {{{totalMonthlySpending}}}
Current Savings Balance: {{{currentSavingsBalance}}}
{{#if savingsGoalDescription}}
Savings Goal: {{{savingsGoalDescription}}}
{{/if}}

Categorized Expenses:
{{#each categorizedExpenses}}
- Category: {{{this.category}}}, Amount: {{{this.amount}}}, Transactions: {{{this.count}}}
{{/each}}

Based on this data, provide a detailed analysis and recommendations. Ensure your advice is empathetic, realistic, and highly personalized.

Your output MUST be a JSON object conforming to the AiSpendingInsightsOutputSchema.`,
});

const aiSpendingInsightsFlow = ai.defineFlow(
  {
    name: 'aiSpendingInsightsFlow',
    inputSchema: AiSpendingInsightsInputSchema,
    outputSchema: AiSpendingInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('No output received from AI spending insights prompt.');
    }
    return output;
  }
);
