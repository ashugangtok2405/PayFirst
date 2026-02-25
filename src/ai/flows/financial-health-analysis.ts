'use server';
/**
 * @fileOverview An AI agent that analyzes a user's complete financial picture to generate a health score and personalized insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialHealthInputSchema = z.object({
  monthlyIncome: z.number().describe("The user's total income for the current month."),
  monthlyExpense: z.number().describe("The user's total expenses for the current month."),
  last3MonthsExpenses: z.array(z.number()).describe("An array of the total expenses for each of the last three months, starting with the most recent."),
  liquidAssets: z.number().describe("Total cash available across all bank and cash accounts."),
  totalMonthlyEmi: z.number().describe("The sum of all monthly EMI payments for active loans."),
  totalCreditOutstanding: z.number().describe("The total outstanding balance across all credit cards."),
  totalCreditLimit: z.number().describe("The total credit limit across all credit cards."),
});
export type FinancialHealthInput = z.infer<typeof FinancialHealthInputSchema>;

const FinancialHealthOutputSchema = z.object({
  finalScore: z.number().min(0).max(100).describe("The final calculated financial health score, from 0 to 100."),
  status: z.enum(["Excellent", "Stable", "Moderate Risk", "High Risk", "Critical"]).describe("A qualitative status label based on the final score."),
  aiSummary: z.string().describe("A very short, 2-3 line summary of the user's financial health, highlighting the most important factor."),
  aiDetailedInsight: z.string().describe("A detailed, multi-paragraph analysis in Markdown format, covering savings, debt, liquidity, and providing 1-2 concrete, actionable recommendations for improvement."),
});
export type FinancialHealthOutput = z.infer<typeof FinancialHealthOutputSchema>;

export async function getFinancialHealthAnalysis(
  input: FinancialHealthInput
): Promise<FinancialHealthOutput> {
  return financialHealthFlow(input);
}

const prompt = ai.definePrompt({
    name: 'financialHealthPrompt',
    input: {schema: FinancialHealthInputSchema},
    output: {schema: FinancialHealthOutputSchema},
    prompt: `You are an expert AI financial analyst named 'PayFirst Insights'. Your task is to conduct a comprehensive financial health assessment based on the provided metrics and generate a score, status, and narrative insights.

    **FINANCIAL DATA:**
    - Monthly Income: {{{monthlyIncome}}}
    - Monthly Expense: {{{monthlyExpense}}}
    - Expenses for Last 3 Months: {{{json last3MonthsExpenses}}}
    - Liquid Assets: {{{liquidAssets}}}
    - Total Monthly EMI: {{{totalMonthlyEmi}}}
    - Total Credit Outstanding: {{{totalCreditOutstanding}}}
    - Total Credit Limit: {{{totalCreditLimit}}}

    **Step 1: Calculate Core Metrics & Ratios**
    You MUST calculate these ratios first. Do not estimate. Use the provided data only.
    - Savings Rate: If income > 0, ((income - expense) / income) * 100. Otherwise, 0.
    - Monthly Burn Rate: Average of the last 3 months' expenses. If only one month is available, use that.
    - Cash Runway (Months): If burn rate > 0, liquid assets / burn rate. Otherwise, Infinity.
    - Debt-to-Income (DTI) Ratio: If income > 0, (total monthly EMI / monthly income) * 100. Otherwise, 100.
    - Credit Utilization: If total limit > 0, (total credit outstanding / total limit) * 100. Otherwise, 0.

    **Step 2: Calculate Financial Health Score (0-100)**
    Use this hybrid model: 70% Absolute Strength + 30% Behavioral Momentum.

    **A. Absolute Strength (70 points total):**
    - **Liquidity / Cash Runway (15 pts):**
        - >6 months: 15 pts
        - 3-6 months: 10 pts
        - 1-3 months: 5 pts
        - <1 month: 0 pts
    - **Savings Rate (15 pts):**
        - >20%: 15 pts
        - 10-20%: 10 pts
        - 0-10%: 5 pts
        - <0%: 0 pts
    - **Debt-to-Income (DTI) Ratio (15 pts):**
        - <15%: 15 pts
        - 15-30%: 10 pts
        - 30-43%: 5 pts
        - >43%: 0 pts
    - **Credit Utilization (15 pts):**
        - <10%: 15 pts
        - 10-30%: 10 pts
        - 30-60%: 5 pts
        - >60%: 0 pts
    - **Expense Discipline (Spending vs Income) (10 pts):**
        - Expense < 60% of Income: 10 pts
        - Expense 60-80% of Income: 7 pts
        - Expense 80-95% of Income: 3 pts
        - Expense > 95% of Income: 0 pts
    
    **B. Behavioral Momentum (30 points total):**
    - **Trend Improvement (15 pts):**
        - Award points based on recent trends. If last 3 months data shows decreasing expenses or increasing savings, award up to 15 points. If trends are negative, award 0. If stable, award 7.
    - **Volatility/Stability (10 pts):**
        - If expenses over the last 3 months are very stable (low standard deviation), award 10 points. If highly volatile, award 0-3 points.
    - **Risk Flags (deduct up to 5 points from total score):**
        - Deduct 5 if Credit Utilization > 80%.
        - Deduct 5 if Savings Rate < 0.
        - Deduct 5 if Cash Runway < 1 month.

    Sum all points to get the \`finalScore\`.

    **Step 3: Determine Status Label**
    - 85–100: "Excellent"
    - 70–84: "Stable"
    - 50–69: "Moderate Risk"
    - 30–49: "High Risk"
    - <30: "Critical"

    **Step 4: Generate AI Narratives**
    - \`aiSummary\`: Write a 2-3 sentence summary. Start with the score and status. Mention the STRONGEST and WEAKEST areas.
    - \`aiDetailedInsight\`: In Markdown format. Provide a paragraph for each key area (Savings, Debt, Liquidity). Conclude with 1-2 clear, actionable recommendations. Be encouraging but direct.
        - If Savings Rate is low, suggest specific budgeting strategies.
        - If DTI is high, suggest exploring ways to reduce EMI or increase income.
        - If Credit Utilization is high, recommend paying down balances.
        - If Cash Runway is low, emphasize building an emergency fund.

    Now, based on the user's data, perform the analysis and return the results in the required JSON format.
    `,
  });

const financialHealthFlow = ai.defineFlow(
    {
      name: 'financialHealthFlow',
      inputSchema: FinancialHealthInputSchema,
      outputSchema: FinancialHealthOutputSchema,
    },
    async (input) => {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('No output received from AI financial health prompt.');
      }
      return output;
    }
);
