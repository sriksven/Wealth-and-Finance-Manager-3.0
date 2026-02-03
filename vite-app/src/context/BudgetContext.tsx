'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Budget, BudgetStatus, BudgetConfig, Alert } from '@/types/budget';
import { useTransactions } from './TransactionContext';
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
    setDoc
} from 'firebase/firestore';

interface BudgetContextType {
    budgets: Budget[];
    budgetConfig: BudgetConfig;
    alerts: Alert[];
    updateBudget: (category: string, limit: number) => void;
    updateBudgetConfig: (levels: number[]) => void;
    getBudgetStatus: (category: string) => BudgetStatus;
    getAllBudgetsRequest: () => BudgetStatus[];
    deleteBudget: (id: string) => void;
    clearAlert: (id: string) => void;
    markAlertAsRead: (id: string) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const useBudgets = () => {
    const context = useContext(BudgetContext);
    if (!context) {
        throw new Error('useBudgets must be used within a BudgetProvider');
    }
    return context;
};

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { getMonthlySummary } = useTransactions();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [budgetConfig, setBudgetConfig] = useState<BudgetConfig>({
        levels: [0, 0, 0, 0, 0], // Default levels
        lastUpdated: new Date().toISOString()
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);

    // --- Real-time Firestore Listeners ---
    useEffect(() => {
        if (!user) {
            setTimeout(() => {
                setBudgets([]);
                setAlerts([]);
            }, 0);
            return;
        }

        // Listen for Budgets
        const budgetsQuery = query(
            collection(db, "budgets"),
            where("uid", "==", user.uid)
        );
        const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
            const newBudgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
            setBudgets(newBudgets.length > 0 ? newBudgets : [
                { id: '1', category: 'Food & Dining', limit: 500, period: 'monthly' },
                { id: '2', category: 'Shopping', limit: 200, period: 'monthly' },
                { id: '3', category: 'Utilities', limit: 300, period: 'monthly' },
            ]);
        });

        // Listen for Budget Config (single document)
        const configRef = doc(db, "budgetConfigs", user.uid);
        const unsubscribeConfig = onSnapshot(configRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as BudgetConfig;
                console.log("Received budget config from Firestore:", data);
                if (Array.isArray(data.levels)) {
                    setBudgetConfig(data);
                } else {
                    console.warn("Budget config missing levels array, using defaults");
                    setBudgetConfig({ ...data, levels: [0, 0, 0, 0, 0] });
                }
            } else {
                console.log("No budget config found, using defaults");
            }
        });

        // Listen for Alerts (Filtered by current month)
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const alertsQuery = query(
            collection(db, "alerts"),
            where("uid", "==", user.uid),
            where("month", "==", currentMonth),
            where("year", "==", currentYear)
        );
        const unsubscribeAlerts = onSnapshot(alertsQuery, (snapshot) => {
            const newAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
            newAlerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setAlerts(newAlerts);
        });

        return () => {
            unsubscribeBudgets();
            unsubscribeConfig();
            unsubscribeAlerts();
        };
    }, [user]);

    // Save logic removed (handled by individual update functions)

    // Monitoring Expenditure for Alerts
    useEffect(() => {
        const today = new Date();
        const summary = getMonthlySummary(
            today.toLocaleString('default', { month: 'long' }),
            today.getFullYear().toString()
        );

        const totalSpent = summary.totalExpenses;

        const checkAndAddAlerts = async () => {
            if (!user) return;

            for (const [index, limit] of budgetConfig.levels.entries()) {
                const level = index + 1;
                // Skip processing if limit is 0 (disabled/unset)
                if (limit <= 0) continue;

                if (totalSpent >= limit) {
                    const alertId = `budget-level-${level}-${today.getMonth()}-${today.getFullYear()}-${user.uid}`;
                    if (!alerts.find(a => a.id === alertId)) {
                        try {
                            // Using a consistent ID to prevent duplicates if multiple clients trigger
                            await setDoc(doc(db, "alerts", alertId), {
                                uid: user.uid,
                                type: 'budget_level',
                                title: `Budget Limit Reached: Level ${level}`,
                                message: `Your total spending ($${totalSpent.toFixed(2)}) has crossed the level ${level} limit of $${limit.toFixed(2)}.`,
                                date: new Date().toISOString(),
                                isRead: false,
                                level,
                                month: today.getMonth(),
                                year: today.getFullYear(),
                                cleared: false
                            });
                        } catch (e) {
                            console.error("Error adding alert:", e);
                        }
                    }
                }
            }
        };

        checkAndAddAlerts();
    }, [getMonthlySummary, budgetConfig, user, alerts]);

    const updateBudget = async (category: string, limit: number) => {
        if (!user) return;
        const existing = budgets.find(b => b.category === category);
        try {
            if (existing) {
                await updateDoc(doc(db, "budgets", existing.id), { limit });
            } else {
                await addDoc(collection(db, "budgets"), {
                    uid: user.uid,
                    category,
                    limit,
                    period: 'monthly'
                });
            }
        } catch (e) {
            console.error("Error updating budget:", e);
        }
    };

    const updateBudgetConfig = async (levels: number[]): Promise<boolean> => {
        if (!user) {
            console.error("Cannot update budget config: No user authenticated");
            throw new Error("User not authenticated");
        }
        try {
            console.log("Saving budget levels to Firestore:", levels);
            await setDoc(doc(db, "budgetConfigs", user.uid), {
                levels,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            console.log("Budget levels saved successfully");
            return true;
        } catch (e) {
            console.error("Error updating config:", e);
            throw e;
        }
    };

    const deleteBudget = async (id: string) => {
        try {
            await deleteDoc(doc(db, "budgets", id));
        } catch (e) {
            console.error("Error deleting budget:", e);
        }
    };

    const clearAlert = async (id: string) => {
        try {
            // Soft delete (hide) so it doesn't get re-added immediately on next check
            await updateDoc(doc(db, "alerts", id), { cleared: true });
        } catch (e) {
            console.error("Error clearing alert:", e);
        }
    };

    const markAlertAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "alerts", id), { isRead: true });
        } catch (e) {
            console.error("Error marking alert as read:", e);
        }
    };

    const getBudgetStatus = (category: string): BudgetStatus => {
        const budget = budgets.find(b => b.category === category);
        const limit = budget ? budget.limit : 0;

        const today = new Date();
        const summary = getMonthlySummary(
            today.toLocaleString('default', { month: 'long' }),
            today.getFullYear().toString()
        );

        const spent = summary.byCategory[category] || 0;

        return {
            category,
            limit,
            spent,
            remaining: limit - spent,
            percentage: limit > 0 ? (spent / limit) * 100 : 0
        };
    };

    // Helper to get stats for ALL categories (even those without budgets set, or just budgeted ones?)
    // Let's return just budgeted ones for the main view, but user can add more.
    const getAllBudgetsRequest = (): BudgetStatus[] => {
        return budgets.map(b => getBudgetStatus(b.category));
    };

    return (
        <BudgetContext.Provider value={{
            budgets,
            budgetConfig,
            alerts: alerts.filter(a => !a.cleared), // Only show non-cleared alerts to UI
            updateBudget,
            updateBudgetConfig,
            getBudgetStatus,
            getAllBudgetsRequest,
            deleteBudget,
            clearAlert,
            markAlertAsRead
        }}>
            {children}
        </BudgetContext.Provider>
    );
};
