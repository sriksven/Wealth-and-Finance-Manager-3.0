'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Account, Balance, AccountWithBalance, AccountWithHistory } from '@/types/finance';
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

interface FinanceContextType {
  accounts: Account[];
  balances: Balance[];
  isLoading: boolean;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => Promise<string | undefined>;
  updateBalance: (accountId: string, amount: number) => void;
  updateMultipleBalances: (updates: { accountId: string; amount: number }[], date?: Date, replaceExisting?: boolean) => void;
  getAccountsWithBalances: () => AccountWithBalance[];
  getAccountsWithHistory: () => AccountWithHistory[];
  deleteAccount: (accountId: string) => void;
  updateAccount: (accountId: string, updates: Pick<Account, 'name' | 'category' | 'type'>) => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  clearAllData: () => void;
  triggerCloudSync: () => Promise<void>;
  adjustBalance: (accountId: string, amount: number, date?: Date) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Real-time Firestore Listeners ---

  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        setAccounts([]);
        setBalances([]);
        setIsLoading(false);
      }, 0);
      return;
    }

    // Listen for Accounts
    const accountsQuery = query(
      collection(db, "accounts"),
      where("uid", "==", user.uid)
    );

    const unsubscribeAccounts = onSnapshot(accountsQuery, (snapshot) => {
      const newAccounts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: data.type,
          category: data.category,
          // Handle Firestore Timestamp or ISO string
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now())
        } as Account;
      });
      // Sort in memory to avoid index requirement errors initially
      newAccounts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setAccounts(newAccounts);
    });

    // Listen for Balances
    const balancesQuery = query(
      collection(db, "balances"),
      where("uid", "==", user.uid)
    );

    const unsubscribeBalances = onSnapshot(balancesQuery, (snapshot) => {
      const newBalances = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          accountId: data.accountId,
          amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date || Date.now())
        } as Balance;
      });
      setBalances(newBalances);
      setIsLoading(false); // Assume loaded once we have data
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeBalances();
    };
  }, [user]);


  // --- Actions ---

  const addAccount = React.useCallback(async (accountData: Omit<Account, 'id' | 'createdAt'>): Promise<string | undefined> => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, "accounts"), {
        ...accountData,
        uid: user.uid,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (e) {
      console.error("Error adding account: ", e);
      return undefined;
    }
  }, [user]);

  const updateBalance = React.useCallback(async (accountId: string, amount: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "balances"), {
        accountId,
        amount,
        uid: user.uid,
        date: new Date()
      });
    } catch (e) {
      console.error("Error updating balance: ", e);
    }
  }, [user]);

  const updateMultipleBalances = React.useCallback(async (
    updates: { accountId: string; amount: number }[],
    date?: Date,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _replaceExisting: boolean = false
  ) => {
    if (!user) return;
    const balanceDate = date || new Date();

    // Firestore batch writes could be used here for atomicity, but loop is fine for now
    for (const update of updates) {
      await addDoc(collection(db, "balances"), {
        accountId: update.accountId,
        amount: update.amount,
        uid: user.uid,
        date: balanceDate
      });
    }
  }, [user]);

  const updateAccount = React.useCallback(async (accountId: string, updates: Pick<Account, 'name' | 'category' | 'type'>) => {
    if (!user) return;
    try {
      const docRef = doc(db, "accounts", accountId);
      await updateDoc(docRef, updates);
    } catch (e) {
      console.error("Error updating account: ", e);
    }
  }, [user]);

  const deleteAccount = React.useCallback(async (accountId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "accounts", accountId));
      // Note: This doesn't delete associated balances. 
      // In a real app, you'd want to delete them too or use a cloud function.
    } catch (e) {
      console.error("Error deleting account: ", e);
    }
  }, [user]);

  const getAccountsWithBalances = React.useCallback((): AccountWithBalance[] => {
    return accounts.map(account => {
      const accountBalances = balances
        .filter(balance => balance.accountId === account.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      const currentBalance = accountBalances.length > 0 ? accountBalances[0].amount : 0;
      return { ...account, currentBalance };
    });
  }, [accounts, balances]);

  const getAccountsWithHistory = (): AccountWithHistory[] => {
    return accounts.map(account => {
      const accountBalances = balances
        .filter(balance => balance.accountId === account.id)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      return { ...account, balanceHistory: accountBalances };
    });
  };

  const adjustBalance = React.useCallback(async (accountId: string, amount: number) => {
    const accountsWithBals = getAccountsWithBalances();
    const account = accountsWithBals.find(a => a.id === accountId);
    if (!account) return;

    const newAmount = account.currentBalance + amount;
    await updateBalance(accountId, newAmount);
  }, [getAccountsWithBalances, updateBalance]);

  // --- Import/Export (Client Side Only for now) ---
  const exportData = (): string => {
    return JSON.stringify({ accounts, balances }, null, 2);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const importData = (_jsonData: string): boolean => {
    // This would need to batch write to Firestore
    console.warn("Import not fully implemented for Firestore yet");
    return false;
  };

  const clearAllData = () => {
    console.warn("Clear all not implemented for Firestore yet");
  };

  const triggerCloudSync = async () => {
    // No-op: Firestore is real-time
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        balances,
        isLoading,
        addAccount,
        updateBalance,
        updateMultipleBalances,
        getAccountsWithBalances,
        updateAccount,
        deleteAccount,
        exportData,
        importData,
        clearAllData,
        triggerCloudSync,
        getAccountsWithHistory,
        adjustBalance,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};
