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

export const FinancialHealthOutputSchema = z.object({
  finalScore: z.number().min(0).max(100).describe("The final calculated financial health score, from 0 to 100."),
  status: z.enum(["Excellent", "Stable", "Moderate Risk", "High Risk", "Critical"]).describe("A qualitative status label based on the final score."),
  aiSummary: z.string().describe("A very short, 2-3 line summary of the user's financial health, highlighting the most important factor."),
  aiDetailedInsight: z.string().describe("A detailed, multi-paragraph analysis in Markdown format, covering savings, debt, liquidity, and providing 1-2 concrete, actionable recommendations for improvement."),
});
export type FinancialHealthOutput = z.infer<typeof FinancialHealthOutputSchema>;
