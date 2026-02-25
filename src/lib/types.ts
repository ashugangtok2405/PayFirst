export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  bankName: string;
  currentBalance: number;
  currency: string;
  isSavingsAccount: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  issuer: string;
  lastFourDigits: string;
  currentBalance: number;
  creditLimit: number;
  apr: number;
  statementDueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  userId: string;
  name: string;
  originalAmount: number;
  outstanding: number;
  interestRate: number;
  emiAmount: number;
  tenureMonths: number;
  remainingMonths: number;
  nextDueDate: string;
  linkedBankAccountId?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PersonalDebt {
  id: string;
  userId: string;
  personName: string;
  type: 'lent' | 'borrowed';
  originalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  dueDate?: string | null;
  linkedAccountId: string;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Repayment {
  id: string;
  debtId: string;
  userId: string;
  amount: number;
  repaymentDate: string;
  notes?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  type: 'income' | 'expense' | 'transfer' | 'credit_card_payment' | 'loan_payment' | 'debt_lent' | 'debt_borrowed' | 'debt_repayment_in' | 'debt_repayment_out';
  amount: number;
  description: string;
  transactionDate: string;
  categoryId?: string;
  fromBankAccountId?: string;
  toBankAccountId?: string;
  fromCreditCardId?: string;
  toCreditCardId?: string;
  recurringTransactionId?: string;
}

export interface Category {
    id: string;
    userId: string;
    name: string;
    type: 'income' | 'expense';
    isDefault: boolean;
}

export interface RecurringTransaction {
  id:string;
  userId: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'credit_card_payment';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  lastGeneratedDate: string;
  nextGenerationDate: string;
  categoryId?: string;
  fromBankAccountId?: string;
  toBankAccountId?: string;
  fromCreditCardId?: string;
  toCreditCardId?: string;
  autoCreate: boolean;
  active: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  resolved: boolean;
  accountId?: string;
  actionLink?: string;
  createdAt: string;
  expiresAt?: string;
}
