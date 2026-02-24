import type { Account, CreditCard, Transaction } from './types'

export const ACCOUNTS: Account[] = [
  { id: 'acc_1', name: 'Primary Checking', bank: 'Chase', balance: 12542.84, type: 'Checking' },
  { id: 'acc_2', name: 'High-Yield Savings', bank: 'Ally Bank', balance: 54321.0, type: 'Savings' },
  { id: 'acc_3', name: 'Vacation Fund', bank: 'Capital One', balance: 8765.43, type: 'Savings' },
];

export const CREDIT_CARDS: CreditCard[] = [
  { id: 'cc_1', name: 'Sapphire Preferred', issuer: 'Chase', last4: '1234', outstanding: 1234.56 },
  { id: 'cc_2', name: 'Venture X', issuer: 'Capital One', last4: '5678', outstanding: 456.78 },
  { id: 'cc_3', name: 'Amex Gold', issuer: 'American Express', last4: '9012', outstanding: 890.12 },
];

export const TRANSACTIONS: Transaction[] = [
  { id: 'txn_1', description: 'Trader Joe\'s', amount: 84.52, date: '2024-07-29', category: 'Groceries', type: 'expense' },
  { id: 'txn_2', description: 'Monthly Salary', amount: 5000.00, date: '2024-07-28', category: 'Salary', type: 'income' },
  { id: 'txn_3', description: 'Rent', amount: 1500.00, date: '2024-07-25', category: 'Rent', type: 'expense' },
  { id: 'txn_4', description: 'Starbucks', amount: 5.75, date: '2024-07-24', category: 'Food', type: 'expense' },
  { id: 'txn_5', description: 'Amazon Prime', amount: 14.99, date: '2024-07-23', category: 'Shopping', type: 'expense' },
  { id: 'txn_6', description: 'Uber Ride', amount: 23.50, date: '2024-07-22', category: 'Transport', type: 'expense' },
  { id: 'txn_7', description: 'Netflix', amount: 15.49, date: '2024-07-21', category: 'Entertainment', type: 'expense' },
  { id: 'txn_8', description: 'Electricity Bill', amount: 75.00, date: '2024-07-20', category: 'Utilities', type: 'expense' },
  { id: 'txn_9', description: 'Freelance Project', amount: 750.00, date: '2024-07-19', category: 'Freelance', type: 'income' },
  { id: 'txn_10', description: 'Dinner with friends', amount: 112.30, date: '2024-07-18', category: 'Food', type: 'expense' }
];
