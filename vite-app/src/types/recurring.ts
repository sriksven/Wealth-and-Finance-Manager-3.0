export interface RecurringTransaction {
    id: string;
    name: string;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
    frequency: 'monthly' | 'yearly' | 'weekly';
    nextDueDate: string; // ISO Date string YYYY-MM-DD
    autoPay: boolean;
    accountId?: string; // Account to charge/deposit
    category: string;
    description?: string;
    lastProcessedDate?: string;
}
