'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

import type { RecurringTransaction } from '@/types/recurring';
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
    where
} from 'firebase/firestore';

interface RecurringContextType {
    recurringItems: RecurringTransaction[];
    isLoading: boolean;
    addRecurringItem: (item: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'lastProcessedDate'> & { nextDueDate: Date }) => Promise<boolean>;
    updateRecurringItem: (id: string, updates: Partial<RecurringTransaction>) => void;
    deleteRecurringItem: (id: string) => void;
    checkDueBills: () => Promise<void>;
    refreshRecurringItems: () => void;
}

const RecurringContext = createContext<RecurringContextType | undefined>(undefined);

export const useRecurring = () => {
    const context = useContext(RecurringContext);
    if (!context) {
        throw new Error('useRecurring must be used within a RecurringProvider');
    }
    return context;
};

export const RecurringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { addTransaction } = useTransactions();
    const [recurringItems, setRecurringItems] = useState<RecurringTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Use ref to break infinite loop in checkDueBills
    const itemsRef = React.useRef<RecurringTransaction[]>([]);
    const isChecking = React.useRef(false);

    useEffect(() => {
        itemsRef.current = recurringItems;
    }, [recurringItems]);

    // --- Real-time Firestore Listener ---
    useEffect(() => {
        if (!user) {
            setRecurringItems([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        const q = query(
            collection(db, "recurring_items"),
            where("uid", "==", user.uid)
        );

        console.log("📡 RecurringContext: Setting up real-time listener for uid:", user.uid);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`📦 RecurringContext: Received snapshot update with ${snapshot.docs.length} items`);
            const items = snapshot.docs.map(doc => {
                const data = doc.data();
                return { id: doc.id, ...data } as RecurringTransaction;
            });
            setRecurringItems(items);
            setIsLoading(false);
        }, (error) => {
            console.error("❌ RecurringContext: Snapshot error:", error);
            setIsLoading(false);
        });

        return () => {
            console.log("📡 RecurringContext: Cleaning up listener");
            unsubscribe();
        };
    }, [user]);

    const refreshRecurringItems = React.useCallback(() => {
        if (!user) return;
        console.log("🔄 RecurringContext: Manual refresh triggered");
        setIsLoading(true);
        // The onSnapshot will automatically update and set isLoading to false
        // This dummy update is just to force a re-render if needed, but Firestore is real-time
        setRecurringItems(prev => [...prev]);
        setTimeout(() => setIsLoading(false), 500);
    }, [user]);

    // Moved useEffect below checkDueBills to avoid 'used before declaration' error

    const checkDueBills = React.useCallback(async () => {
        if (isChecking.current || !user) return;

        const itemsToProcess = itemsRef.current;
        if (itemsToProcess.length === 0) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let hasUpdates = false;

        // We'll track processed IDs to avoid multi-processing in one go
        const processedThisRun = new Set<string>();

        isChecking.current = true;
        try {
            for (const item of itemsToProcess) {
                if (processedThisRun.has(item.id)) continue;

                const dueDate = new Date(item.nextDueDate);
                dueDate.setHours(0, 0, 0, 0);

                // If due date is today or passed AND autopay is ON
                if (dueDate <= today && item.autoPay) {
                    console.log(`💸 Auto-processing recurring item: ${item.name}`);
                    processedThisRun.add(item.id);

                    // 1. Process Transaction
                    await addTransaction({
                        amount: item.amount,
                        type: item.type,
                        category: item.category,
                        reason: `Auto-Pay: ${item.name}`,
                        date: new Date(item.nextDueDate),
                        paymentMethod: 'Other',
                        accountId: item.accountId || 'default',
                        source: item.type === 'income' ? item.name : undefined,
                        year: dueDate.getFullYear().toString(),
                        month: dueDate.toLocaleString('default', { month: 'long' }),
                        time: new Date().toLocaleTimeString('en-GB')
                    });

                    // 2. Advance Date
                    const nextDate = new Date(dueDate);
                    if (item.frequency === 'monthly') {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else if (item.frequency === 'weekly') {
                        nextDate.setDate(nextDate.getDate() + 7);
                    } else if (item.frequency === 'yearly') {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    }

                    const nextDueDateStr = nextDate.toISOString().split('T')[0];
                    const lastProcessedDateStr = new Date().toISOString();

                    // 3. Sync to Firestore immediately
                    const docRef = doc(db, "recurring_items", item.id);
                    await updateDoc(docRef, {
                        nextDueDate: nextDueDateStr,
                        lastProcessedDate: lastProcessedDateStr
                    });

                    hasUpdates = true;
                }
            }
        } catch (error) {
            console.error("❌ checkDueBills error:", error);
        } finally {
            isChecking.current = false;
        }

        if (hasUpdates) {
            console.log("✅ Finished syncing recurring item updates.");
        }
    }, [user, addTransaction]);

    // Check for due bills on load and whenever checkDueBills changes (which depends on subscriptions)
    useEffect(() => {
        checkDueBills();
    }, [checkDueBills]);

    const addRecurringItem = async (itemData: Omit<RecurringTransaction, 'id' | 'nextDueDate' | 'lastProcessedDate'> & { nextDueDate: Date }) => {
        if (!user) {
            console.error("❌ RecurringContext: No user available for addRecurringItem");
            return false;
        }

        try {
            const dateStr = itemData.nextDueDate instanceof Date
                ? itemData.nextDueDate.toISOString().split('T')[0]
                : String(itemData.nextDueDate);

            const payload = {
                name: itemData.name,
                amount: itemData.amount,
                type: itemData.type,
                frequency: itemData.frequency,
                category: itemData.category,
                accountId: itemData.accountId,
                autoPay: itemData.autoPay ?? true,
                uid: user.uid,
                nextDueDate: dateStr,
                createdAt: new Date().toISOString()
            };

            console.log("Saving recurring item to Firestore:", payload);

            const docRef = await addDoc(collection(db, "recurring_items"), payload);
            console.log("✅ Success! Item added with ID:", docRef.id);
            return true;
        } catch (e) {
            console.error("❌ Error adding recurring item:", e);
            return false;
        }
    };

    const updateRecurringItem = React.useCallback(async (id: string, updates: Partial<RecurringTransaction>) => {
        try {
            const docRef = doc(db, "recurring_items", id);
            await updateDoc(docRef, updates);
            return true;
        } catch (e) {
            console.error("Error updating recurring item:", e);
            return false;
        }
    }, []);

    const deleteRecurringItem = React.useCallback(async (id: string) => {
        try {
            await deleteDoc(doc(db, "recurring_items", id));
            return true;
        } catch (e) {
            console.error("Error deleting recurring item:", e);
            return false;
        }
    }, []);

    return (
        <RecurringContext.Provider value={{
            recurringItems,
            isLoading,
            addRecurringItem,
            updateRecurringItem,
            deleteRecurringItem,
            checkDueBills,
            refreshRecurringItems
        }}>
            {children}
        </RecurringContext.Provider>
    );
};
