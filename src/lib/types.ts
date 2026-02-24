export interface Account {
  id: string;
  name: string;
  bank: string;
  balance: number;
  type: 'Checking' | 'Savings';
}

export interface CreditCard {
  id: string;
  name: string;
  issuer: string;
  last4: string;
  outstanding: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
}
