'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CreditCard } from '@/types/card';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
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

interface CardContextType {
    cards: CreditCard[];
    addCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => void;
    updateCard: (id: string, updates: Partial<CreditCard>) => void;
    deleteCard: (id: string) => void;
    getCardById: (id: string) => CreditCard | undefined;
    syncCards: () => Promise<void>; // No-op
    updateCardBalance: (id: string, amount: number) => void;
    isLoading: boolean; // Added this
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export const useCards = () => {
    const context = useContext(CardContext);
    if (!context) {
        throw new Error('useCards must be used within CardProvider');
    }
    return context;
};

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cards, setCards] = useState<CreditCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Real-time Firestore Listener ---
    useEffect(() => {
        if (!user) {
            setTimeout(() => {
                setCards([]);
                setIsLoading(false);
            }, 0);
            return;
        }

        const q = query(
            collection(db, "cards"),
            where("uid", "==", user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newCards = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
                } as CreditCard;
            }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

            setCards(newCards);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);


    const syncCards = React.useCallback(async () => {
        // No-op for Firestore
    }, []);

    const addCard = React.useCallback(async (cardData: Omit<CreditCard, 'id' | 'createdAt'>) => {
        if (!user) return;
        try {
            await addDoc(collection(db, "cards"), {
                ...cardData,
                uid: user.uid,
                createdAt: new Date()
            });
        } catch (e) {
            console.error("Error adding card: ", e);
        }
    }, [user]);

    const updateCard = React.useCallback(async (id: string, updates: Partial<CreditCard>) => {
        if (!user) return;
        try {
            const docRef = doc(db, "cards", id);
            await updateDoc(docRef, updates);
        } catch (e) {
            console.error("Error updating card: ", e);
        }
    }, [user]);

    const deleteCard = React.useCallback(async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "cards", id));
        } catch (e) {
            console.error("Error deleting card: ", e);
        }
    }, [user]);

    const getCardById = React.useCallback((id: string) => cards.find(c => c.id === id), [cards]);

    const updateCardBalance = React.useCallback(async (id: string, amount: number) => {
        const card = cards.find(c => c.id === id);
        if (card) {
            const newBalance = card.currentBalance + amount;
            const newAvailable = card.creditLimit - newBalance;

            await updateCard(id, {
                currentBalance: newBalance,
                availableCredit: newAvailable
            });
        }
    }, [cards, updateCard]);

    return (
        <CardContext.Provider value={{
            cards,
            addCard,
            updateCard,
            deleteCard,
            getCardById,
            syncCards,
            updateCardBalance,
            isLoading
        }}>
            {children}
        </CardContext.Provider>
    );
};
