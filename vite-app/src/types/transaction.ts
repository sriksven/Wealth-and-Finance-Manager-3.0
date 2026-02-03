export interface Transaction {
  id: string;
  accountId: string; // "From" account for expenses/transfers, "To" account for income
  toAccountId?: string; // For transfers: the destination account
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  category: string;
  reason: string;
  source?: string; // For income: who gave money
  paymentMethod: string;
  date: Date;
  time: string;
  month: string; // "January 2026"
  year: string;  // "2026"
}

export interface MonthlySummary {
  month: string;
  year: string;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  byCategory: {
    [category: string]: number;
  };
  transactionCount: number;
}

export const PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "Bank",
  "Zelle",
  "Cash",
  "Other"
] as const;

export const EXPENSE_CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Rent",
  "Healthcare",
  "Education",
  "Personal Care",
  "Utilities",
  "Travel",
  "Gifts & Donations",
  "Home & Garden",
  "Insurance",
  "Subscriptions",
  "Dining Out",
  "Fitness & Sports",
  "Pet Care",
  "Clothing",
  "Electronics",
  "Lending / Reimbursable",
  "Others"
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Pocket Money",
  "Gift",
  "Investment Returns",
  "Reimbursement",
  "Other Income"
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];
