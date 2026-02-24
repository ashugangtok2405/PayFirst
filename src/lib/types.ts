export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  bankName: string;
  currentBalance: number;
  currency: string;
  isSavingsAccount: boolean;
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
}

export interface Transaction {
  id: string;
  userId?: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate?: string;
  date?: string;
  categoryId?: string;
  fromBankAccountId?: string;
  toBankAccountId?: string;
  fromCreditCardId?: string;
}

export interface Category {
    id: string;
    userId: string;
    name: string;
    type: 'income' | 'expense';
    isDefault: boolean;
}
