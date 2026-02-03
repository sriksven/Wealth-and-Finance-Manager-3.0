export interface Budget {
    id: string;
    category: string;
    limit: number;
    period: 'monthly';
}

export interface BudgetConfig {
    levels: number[]; // Array of 5 expenditure levels (limits)
    lastUpdated: string;
}

export interface Alert {
    id: string;
    type: 'budget_level' | 'recurring_due';
    title: string;
    message: string;
    date: string;
    isRead: boolean;
    level?: number; // For budget level alerts (1-5)
    cleared?: boolean;
}

export interface BudgetStatus {
    category: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
}
