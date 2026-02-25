'use server';

import type { FinancialHealthInput } from '@/ai/flows/types';

export interface FinancialHealthMetrics {
    savingsRate: number;
    monthlyBurnRate: number;
    cashRunwayMonths: number;
    debtToIncomeRatio: number;
    creditUtilization: number;
    finalScore: number;
    status: "Excellent" | "Stable" | "Moderate Risk" | "High Risk" | "Critical";
}

export function calculateFinancialHealth(input: FinancialHealthInput): FinancialHealthMetrics {
    // Step 1: Calculate Core Metrics & Ratios
    const savingsRate = input.monthlyIncome > 0 ? ((input.monthlyIncome - input.monthlyExpense) / input.monthlyIncome) * 100 : (input.monthlyExpense > 0 ? -100 : 0);
    
    const validExpenseMonths = input.last3MonthsExpenses.filter(e => e > 0).length || 1;
    const totalThreeMonthExpense = input.last3MonthsExpenses.reduce((a, b) => a + b, 0);
    const monthlyBurnRate = totalThreeMonthExpense > 0 ? totalThreeMonthExpense / validExpenseMonths : 1; // Default to 1 to avoid division by zero
    
    const cashRunwayMonths = monthlyBurnRate > 0 ? input.liquidAssets / monthlyBurnRate : Infinity;
    const debtToIncomeRatio = input.monthlyIncome > 0 ? (input.totalMonthlyEmi / input.monthlyIncome) * 100 : (input.totalMonthlyEmi > 0 ? 100 : 0);
    const creditUtilization = input.totalCreditLimit > 0 ? (input.totalCreditOutstanding / input.totalCreditLimit) * 100 : 0;
    
    // Step 2: Calculate Financial Health Score (0-100)
    let absoluteStrengthScore = 0;
    
    // Liquidity / Cash Runway (15 pts)
    if (cashRunwayMonths > 6) absoluteStrengthScore += 15;
    else if (cashRunwayMonths >= 3) absoluteStrengthScore += 10;
    else if (cashRunwayMonths >= 1) absoluteStrengthScore += 5;

    // Savings Rate (15 pts)
    if (savingsRate > 20) absoluteStrengthScore += 15;
    else if (savingsRate >= 10) absoluteStrengthScore += 10;
    else if (savingsRate >= 0) absoluteStrengthScore += 5;

    // Debt-to-Income (DTI) Ratio (15 pts)
    if (debtToIncomeRatio < 15) absoluteStrengthScore += 15;
    else if (debtToIncomeRatio <= 30) absoluteStrengthScore += 10;
    else if (debtToIncomeRatio <= 43) absoluteStrengthScore += 5;

    // Credit Utilization (15 pts)
    if (creditUtilization < 10) absoluteStrengthScore += 15;
    else if (creditUtilization <= 30) absoluteStrengthScore += 10;
    else if (creditUtilization <= 60) absoluteStrengthScore += 5;
    
    // Expense Discipline (10 pts)
    if (input.monthlyIncome > 0) {
        const expenseRatio = (input.monthlyExpense / input.monthlyIncome) * 100;
        if (expenseRatio < 60) absoluteStrengthScore += 10;
        else if (expenseRatio <= 80) absoluteStrengthScore += 7;
        else if (expenseRatio <= 95) absoluteStrengthScore += 3;
    } else if (input.monthlyExpense > 0) {
        // has expenses but no income
        absoluteStrengthScore += 0;
    } else {
        // no income, no expenses
        absoluteStrengthScore += 10;
    }
    
    // Behavioral Momentum (30 points total) - Simplified
    let behavioralScore = 0;
    const [mostRecentExpense, secondMostRecent] = input.last3MonthsExpenses;
    if (mostRecentExpense !== undefined && secondMostRecent !== undefined && secondMostRecent > 0) {
        if (mostRecentExpense < secondMostRecent) {
            behavioralScore += 15; // Improving trend
        } else if (Math.abs(mostRecentExpense - secondMostRecent) < (secondMostRecent * 0.1)) {
            behavioralScore += 7; // Stable
        }
    } else {
        behavioralScore += 7; // Default to stable if not enough data
    }
    
    const avgExpense = monthlyBurnRate;
    if(avgExpense > 1) { // only if there is burn
        const expenseVariance = input.last3MonthsExpenses.reduce((sum, e) => sum + Math.pow(e - avgExpense, 2), 0) / validExpenseMonths;
        const stdDev = Math.sqrt(expenseVariance);
        if ((stdDev / avgExpense) < 0.1) {
            behavioralScore += 10; // Very stable
        } else if ((stdDev / avgExpense) < 0.25) {
            behavioralScore += 5; // Moderately stable
        }
    } else {
        behavioralScore += 10; // No burn is very stable
    }

    let totalScore = absoluteStrengthScore + behavioralScore;
    
    // Risk Flags (deductions)
    if (creditUtilization > 80) totalScore -= 5;
    if (savingsRate < 0) totalScore -= 5;
    if (cashRunwayMonths < 1) totalScore -= 5;

    const finalScore = Math.max(0, Math.min(100, totalScore));

    // Step 3: Determine Status Label
    let status: FinancialHealthMetrics['status'];
    if (finalScore >= 85) status = "Excellent";
    else if (finalScore >= 70) status = "Stable";
    else if (finalScore >= 50) status = "Moderate Risk";
    else if (finalScore >= 30) status = "High Risk";
    else status = "Critical";

    return {
        savingsRate,
        monthlyBurnRate,
        cashRunwayMonths,
        debtToIncomeRatio,
        creditUtilization,
        finalScore,
        status
    };
}
