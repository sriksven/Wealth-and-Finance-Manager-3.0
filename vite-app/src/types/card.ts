export interface CreditCard {
    id: string;
    name: string;
    type: 'credit' | 'debit';
    bank: string;
    creditLimit: number;
    currentBalance: number; // How much you owe
    availableCredit: number; // creditLimit - currentBalance
    lastFour: string;
    expiryDate: string;
    isActive: boolean;
    closingDate?: number; // Day of month (1-31)
    createdAt: Date;
}

export interface CardTransaction {
    id: string;
    cardId: string;
    transactionId: string; // Links to main transaction
    amount: number;
    type: 'charge' | 'payment' | 'refund';
    date: Date;
    description: string;
}

export interface CardPayment {
    id: string;
    cardId: string;
    amount: number;
    paidFrom: string; // Account ID
    date: Date;
    notes?: string;
}
