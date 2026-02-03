'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Transaction, MonthlySummary } from '@/types/transaction';
import { useFinance } from './FinanceContext';
import { useCards } from './CardContext';
import { useAuth } from './AuthContext';
import { db } from '@/lib/firebase';
import {
    collection,
    onSnapshot,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    query,
    where,
    Timestamp
} from 'firebase/firestore';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    getMonthlyTransactions: (month: string, year: string) => Transaction[];
    getMonthlySummary: (month: string, year: string) => MonthlySummary;
    isLoading: boolean;
    syncTransactions: () => Promise<void>; // Kept for interface compatibility, but no-op
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within TransactionProvider');
    }
    return context;
};

interface TransactionProviderProps {
    children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const { adjustBalance } = useFinance();
    const { updateCardBalance, cards } = useCards();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Real-time Firestore Listener ---
    useEffect(() => {
        if (!user) {
            setTimeout(() => {
                setTransactions([]);
                setIsLoading(false);
            }, 0);
            return;
        }

        const q = query(
            collection(db, "transactions"),
            where("uid", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                // Ensure date is valid
                const dateObj = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);

                // robustly derive year and month from the date object
                const year = dateObj.getFullYear().toString();
                const month = dateObj.toLocaleString('default', { month: 'long' });

                return {
                    id: doc.id,
                    ...data,
                    date: dateObj,
                    year,
                    month
                } as Transaction;
            });

            // Client-side sort: Newest first
            newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTransactions(newTransactions);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const syncTransactions = async () => {
        // No-op for Firestore
    };

    // Helper to centralize balance logic
    const handleBalanceUpdate = React.useCallback((txn: Transaction, mode: 'add' | 'revert') => {
        // If mode is revert, we invert the amount logic
        const multiplier = mode === 'add' ? 1 : -1;
        const amount = txn.amount * multiplier;

        // Skip if no valid source account
        if (!txn.accountId || txn.accountId === 'default') return;

        // Check if source is a card or bank account
        const sourceCard = cards.find(c => c.id === txn.accountId);

        if (txn.type === 'expense') {
            // EXPENSE: Money leaving
            if (sourceCard) {
                // Paid with card -> Increases card debt
                updateCardBalance(sourceCard.id, amount);
            } else {
                // Paid with bank/cash -> Decreases bank balance
                adjustBalance(txn.accountId, -amount);
            }
        } else if (txn.type === 'income') {
            // INCOME: Money entering
            if (sourceCard) {
                // Refund to card -> Decreases card debt
                updateCardBalance(sourceCard.id, -amount);
            } else {
                // Deposit to bank -> Increases bank balance
                adjustBalance(txn.accountId, amount);
            }
        } else if (txn.type === 'transfer') {
            // TRANSFER: Moving money between accounts
            // Source account loses money
            if (sourceCard) {
                // Transferring FROM card (unusual, but handle it)
                updateCardBalance(sourceCard.id, -amount);
            } else {
                // Transferring FROM bank -> Decreases balance
                adjustBalance(txn.accountId, -amount);
            }

            // Destination account gains money
            if (txn.toAccountId) {
                const destCard = cards.find(c => c.id === txn.toAccountId);
                if (destCard) {
                    // Transfer TO card (Payment) -> DECREASES card debt
                    updateCardBalance(destCard.id, -amount);
                } else {
                    // Transfer TO bank/friend account -> INCREASES balance
                    adjustBalance(txn.toAccountId, amount);
                }
            }
        }
    }, [cards, updateCardBalance, adjustBalance]);

    const addTransaction = React.useCallback(async (transaction: Omit<Transaction, 'id'>) => {
        if (!user) return;
        try {
            // 1. Save to Firestore
            await addDoc(collection(db, "transactions"), {
                ...transaction,
                uid: user.uid,
                date: new Date(transaction.date) // Ensure it's a Date object
            });

            // 2. Trigger Balance Updates (Client-side trigger)
            handleBalanceUpdate(transaction as Transaction, 'add');

        } catch (e) {
            console.error("Error adding transaction: ", e);
        }
    }, [user, handleBalanceUpdate]);

    const updateTransaction = React.useCallback(async (id: string, updates: Partial<Transaction>) => {
        if (!user) return;
        const oldTxn = transactions.find(t => t.id === id);

        try {
            const docRef = doc(db, "transactions", id);
            await updateDoc(docRef, updates);

            // Handle Balance Updates logic (Revert old, apply new)
            if (oldTxn) {
                // This is tricky client-side without deep checks.
                // Simplified: Revert old effect, apply new effect
                // Construct "target" as merged object
                const target = { ...oldTxn, ...updates }; // Type cast if needed

                handleBalanceUpdate(oldTxn, 'revert');
                handleBalanceUpdate(target as Transaction, 'add');
            }

        } catch (e) {
            console.error("Error updating transaction: ", e);
        }
    }, [user, transactions, handleBalanceUpdate]);

    const deleteTransaction = React.useCallback(async (id: string) => {
        if (!user) return;
        const target = transactions.find(t => t.id === id);
        if (!target) return;

        try {
            await deleteDoc(doc(db, "transactions", id));

            // Revert balance
            handleBalanceUpdate(target, 'revert');

        } catch (e) {
            console.error("Error deleting transaction: ", e);
        }
    }, [user, transactions, handleBalanceUpdate]);


    const getMonthlyTransactions = useCallback((month: string, year: string): Transaction[] => {
        return transactions.filter(t => t.month === month && t.year === year);
    }, [transactions]);

    const getMonthlySummary = useCallback((month: string, year: string): MonthlySummary => {
        const monthTransactions = getMonthlyTransactions(month, year);

        const totalIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const byCategory: { [key: string]: number } = {};
        monthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
            });

        return {
            month,
            year,
            totalIncome,
            totalExpenses,
            netSavings: totalIncome - totalExpenses,
            byCategory,
            transactionCount: monthTransactions.length
        };
    }, [getMonthlyTransactions]);

    return (
        <TransactionContext.Provider
            value={{
                transactions,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                getMonthlyTransactions,
                getMonthlySummary,
                isLoading,
                syncTransactions
            }}
        >
            {children}
        </TransactionContext.Provider>
    );
};
