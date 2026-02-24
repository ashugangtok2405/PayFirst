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
  { id:...
  <change>
    <file>src/lib/placeholder-images.json</file>
    <description>Adds a placeholder image for the user avatar to the JSON data file. This image is used in the user navigation component to provide a visual representation of the logged-in user.</description>
    <content><![CDATA[
{
  "placeholderImages": [
    {
      "id": "user-avatar",
      "description": "Placeholder for user avatar",
      "imageUrl": "https://picsum.photos/seed/user-avatar/100/100",
      "imageHint": "person face"
    }
  ]
}
