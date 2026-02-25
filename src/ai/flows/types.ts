import { z } from 'zod';

export const FinancialHealthInputSchema = z.object({
  monthlyIncome: z.number().describe("The user's total income for the current month."),
  monthlyExpense: z.number().describe("The user's total expenses for the current month."),
  last3MonthsExpenses: z.array(z.number()).describe("An array of the total expenses for each of the last three months, starting with the most recent."),
  liquidAssets: z.number().describe("Total cash available across all bank and cash accounts."),
  totalMonthlyEmi: z.number().describe("The sum of all monthly EMI payments for active loans."),
  totalCreditOutstanding: z.number().describe("The total outstanding balance across all credit cards."),
  totalCreditLimit: z.number().describe("The total credit limit across all credit cards."),
});
export type FinancialHealthInput = z.infer<typeof FinancialHealthInputSchema>;

// New schema for AI input
export const FinancialHealthAnalysisPromptInputSchema = FinancialHealthInputSchema.extend({
  finalScore: z.number().describe("The calculated financial health score (0-100)."),
  status: z.string().describe("The status label based on the score (e.g., 'Excellent')."),
  savingsRate: z.number().describe("Calculated savings rate percentage."),
  debtToIncomeRatio: z.number().describe("Calculated DTI ratio percentage."),
  cashRunwayMonths: z.number().describe("Calculated cash runway in months."),
  creditUtilization: z.number().describe("Calculated credit utilization percentage."),
});
export type FinancialHealthAnalysisPromptInput = z.infer<typeof FinancialHealthAnalysisPromptInputSchema>;

// This is the output from the AI (narratives only)
export const FinancialHealthAIOutputSchema = z.object({
  aiSummary: z.string().describe("A very short, 2-3 line summary of the user's financial health, highlighting the most important factor."),
  aiDetailedInsight: z.string().describe("A detailed, multi-paragraph analysis in Markdown format, covering savings, debt, liquidity, and providing 1-2 concrete, actionable recommendations for improvement."),
});
export type FinancialHealthAIOutput = z.infer<typeof FinancialHealthAIOutputSchema>;


// This is the final object returned by the server action and consumed by the component.
export const FinancialHealthOutputSchema = z.object({
  finalScore: z.number().min(0).max(100).describe("The final calculated financial health score, from 0 to 100."),
  status: z.enum(["Excellent", "Stable", "Moderate Risk", "High Risk", "Critical"]).describe("A qualitative status label based on the final score."),
  // Adding back the metrics for the UI
  savingsRate: z.number().describe("Calculated savings rate percentage."),
  debtToIncomeRatio: z.number().describe("Calculated DTI ratio percentage."),
  cashRunwayMonths: z.number().describe("Calculated cash runway in months."),
  creditUtilization: z.number().describe("Calculated credit utilization percentage."),
  aiSummary: z.string().describe("A very short, 2-3 line summary of the user's financial health, highlighting the most important factor."),
  aiDetailedInsight: z.string().describe("A detailed, multi-paragraph analysis in Markdown format, covering savings, debt, liquidity, and providing 1-2 concrete, actionable recommendations for improvement."),
});
export type FinancialHealthOutput = z.infer<typeof FinancialHealthOutputSchema>;
