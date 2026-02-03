'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { useCards } from '@/context/CardContext'; // Import CardContext
import type { Account, AccountWithBalance } from '@/types/finance';
import { useCurrency } from '@/context/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
import { ManageAccountModal, type AccountUpdates } from './ManageAccountModal';
import { SimpleBalanceModal } from './SimpleBalanceModal';
import { CardDetailsModal } from './CardDetailsModal';
import { BankDetailsModal } from './BankDetailsModal';
import { CalendarModal } from './CalendarModal';
import type { CreditCard } from '@/types/card';

import { AddAccountForm } from './AddAccountForm';

export const BalanceSheet: React.FC = () => {
  const navigate = useNavigate();
  const {
    getAccountsWithBalances,
    deleteAccount,
    updateAccount,
    isLoading,
    updateBalance,
    addAccount
  } = useFinance();
  const { cards, updateCard } = useCards();
  const { formatCurrency } = useCurrency();
  // existing accounts

  // existing accounts
  const financeAccounts = getAccountsWithBalances();

  // Convert Credit Cards to "Liability" Accounts
  const creditCardAccounts: AccountWithBalance[] = cards
    .filter(c => c.type === 'credit' && c.isActive)
    .map(c => ({
      id: c.id,
      name: `${c.bank} ${c.name} (...${c.lastFour})`,
      type: 'liability',
      category: 'Credit Cards',
      currentBalance: c.currentBalance,
      createdAt: c.createdAt
    }));

  // Merge both lists
  const accountsWithBalances = [...financeAccounts, ...creditCardAccounts];

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingCard, setViewingCard] = useState<CreditCard | null>(null);
  const [viewingBank, setViewingBank] = useState<Account | null>(null);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showSimpleFriendEdit, setShowSimpleFriendEdit] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [initialAccountData, setInitialAccountData] = useState<any>(null);

  const handleSaveAccount = (updates: AccountUpdates) => {
    if (!editingAccount) return;

    // 1. Update basic info (Name, Category, Type)
    // We need to differentiate update source. 
    // FinanceContext handles Bank Accounts (Assets)
    // CardContext handles Credit Cards (Liabilities/Cards)

    if (editingAccount.category === 'Credit Cards') {
      const { name, currentBalance, creditLimit } = updates;

      const card = cards.find(c => c.id === editingAccount.id);
      if (card) {
        const updatesToApply: Partial<CreditCard> = { name };

        let newBalance = card.currentBalance;
        let newLimit = card.creditLimit;

        if (currentBalance !== undefined) {
          updatesToApply.currentBalance = currentBalance;
          newBalance = currentBalance;
        }

        if (creditLimit !== undefined) {
          updatesToApply.creditLimit = creditLimit;
          newLimit = creditLimit;
        }

        // Recalculate Available Credit if either changed
        if (currentBalance !== undefined || creditLimit !== undefined) {
          updatesToApply.availableCredit = newLimit - newBalance;
        }

        updateCard(editingAccount.id, updatesToApply);
      }
    } else {
      // Bank Account
      updateAccount(editingAccount.id, updates);

      if (updates.currentBalance !== undefined) {
        // We need to use updateBalance to record a new snapshot
        updateBalance(editingAccount.id, updates.currentBalance);
      }
    }

    setEditingAccount(null);
  };

  // ... (keeping existing grouping logic) ...

  const groupAccountsByType = (accounts: AccountWithBalance[]) => {
    return accounts.reduce((groups, account) => {
      if (!groups[account.type]) {
        groups[account.type] = {};
      }
      if (!groups[account.type][account.category]) {
        groups[account.type][account.category] = [];
      }
      groups[account.type][account.category].push(account);
      return groups;
    }, {} as Record<string, Record<string, AccountWithBalance[]>>);
  };

  const calculateTotalByType = (accounts: AccountWithBalance[], type: string) => {
    return accounts
      .filter(account => account.type === type)
      .reduce((total, account) => total + account.currentBalance, 0);
  };

  const groupedAccounts = groupAccountsByType(accountsWithBalances);
  const totalAssets = calculateTotalByType(accountsWithBalances, 'asset');
  const totalLiabilities = calculateTotalByType(accountsWithBalances, 'liability');
  const totalEquity = calculateTotalByType(accountsWithBalances, 'equity');
  const netWorth = totalAssets - totalLiabilities;

  const AccountSection: React.FC<{
    title: string;
    accounts: Record<string, AccountWithBalance[]>;
    total: number;
    type: 'asset' | 'liability' | 'equity';
  }> = ({ title, accounts, total }) => (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-300 flex justify-between items-center">
        <span>{title}</span>
        <span className="text-sm font-normal text-gray-500">
          Total: {formatCurrency(total)}
        </span>
      </h2>
      {Object.entries(accounts).map(([category, categoryAccounts]) => (
        <div key={category} className="mb-4 ml-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-2 border-l-4 border-gray-200 pl-2">{category}</h3>
          <div className="space-y-1 ml-2">
            {categoryAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => {
                  const card = cards.find(c => c.id === account.id);
                  if (card) {
                    setViewingCard(card);
                  } else if (account.type === 'asset' && (
                    account.category === 'Cash' ||
                    account.category.includes('Checking') ||
                    account.category.includes('Savings') ||
                    account.category.includes('Bank') ||
                    account.category === 'Cash and Cash Equivalents'
                  )) {
                    // Open Bank Details for Bank Accounts
                    setViewingBank(account);
                  }
                }}
                className={`group flex justify-between items-center py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200 ${(cards.some(c => c.id === account.id) || (account.type === 'asset' && account.category === 'Cash and Cash Equivalents'))
                  ? 'cursor-pointer hover:shadow-md' : ''
                  }`}
              >
                <div className="flex flex-col">
                  <span className="text-gray-800 font-medium">{account.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`font-bold ${account.currentBalance >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                    {formatCurrency(account.currentBalance)}
                  </span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAccount(account);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-blue-100 transition-all"
                      title="Edit Account Name/Type"
                    >
                      <span className="text-sm">✎</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${account.name}?`)) {
                          deleteAccount(account.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 p-1.5 hover:bg-white rounded-full shadow-sm border border-transparent hover:border-red-100 transition-all"
                      title="Delete Account Permanently"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Show loading state during initial data fetch
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Personal Balance Sheet</h1>
            <p className="text-gray-600">Loading your financial data...</p>
          </div>
          <div className="animate-pulse space-y-4">
            {/* Skeleton Loading */}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Personal Balance Sheet</h1>
          <p className="text-gray-600" suppressHydrationWarning>
            As of {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Action Bar */}
        <div className="mb-8 flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInitialAccountData(null);
                setShowAddAccountModal(true);
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-semibold"
            >
              <span>+</span>
              <span>Add Account</span>
            </button>
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition shadow-sm font-semibold"
            >
              <span>📅</span>
              <span>Calendar</span>
            </button>
            <button
              onClick={() => navigate('/cards')}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition shadow-sm font-semibold"
            >
              <span>💳</span>
              <span>Add Card</span>
            </button>
          </div>
          <CurrencySelector size="sm" />
        </div>

        {/* Friend Debt Summary removed as per user request for simplicity */}

        {accountsWithBalances.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-6">
              <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Accounts Yet</h2>
            <p className="text-gray-500 mb-8">Start tracking your finances by adding your first account</p>
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              <span className="mr-2">+</span>
              <span>Add Your First Account</span>
            </button>
          </div>
        )}

        {/* Assets */}
        {groupedAccounts.asset && (
          <AccountSection
            title="Assets"
            accounts={groupedAccounts.asset}
            total={totalAssets}
            type="asset"
          />
        )}

        {/* Liabilities */}
        {groupedAccounts.liability && (
          <AccountSection
            title="Liabilities"
            accounts={groupedAccounts.liability}
            total={totalLiabilities}
            type="liability"
          />
        )}

        {/* Equity */}
        {groupedAccounts.equity && (
          <AccountSection
            title="Equity"
            accounts={groupedAccounts.equity}
            total={totalEquity}
            type="equity"
          />
        )}

        {/* Net Worth Summary */}
        <div className="border-t-2 border-gray-400 pt-6 mt-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-2">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Assets</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {formatCurrency(totalAssets)}
                </div>
              </div>
              <div className="p-2 border-t md:border-t-0 md:border-l border-gray-200">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Liabilities</div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  {formatCurrency(totalLiabilities)}
                </div>
              </div>
              <div
                className="p-2 border-t md:border-t-0 md:border-l border-gray-200 cursor-pointer hover:bg-orange-50 transition-colors rounded-lg group border-transparent hover:border-orange-200"
                onClick={() => {
                  setShowSimpleFriendEdit(true);
                }}
              >
                <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Total Owed by Friends</div>
                <div className="text-2xl font-bold text-orange-600 mt-1 flex items-center justify-center gap-2">
                  <span>{formatCurrency(accountsWithBalances.filter(a => a.category === 'Money Owed (Friends)').reduce((sum, a) => sum + a.currentBalance, 0))}</span>
                  <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Edit</span>
                </div>
              </div>
              <div className="p-2 border-t md:border-t-0 md:border-l border-gray-200">
                <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Net Worth</div>
                <div className={`text-3xl font-extrabold mt-1 ${netWorth >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                  {formatCurrency(netWorth)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {/* Simple Friend Debt Editor */}
      {showSimpleFriendEdit && (
        <SimpleBalanceModal
          title="Total Friend Debt"
          initialValue={accountsWithBalances.filter(a => a.category === 'Money Owed (Friends)').reduce((sum, a) => sum + a.currentBalance, 0)}
          onClose={() => setShowSimpleFriendEdit(false)}
          onSave={async (newValue) => {
            const currentFriends = getAccountsWithBalances().filter(a => a.category === 'Money Owed (Friends)');

            if (currentFriends.length > 0) {
              // Update the first one
              await updateBalance(currentFriends[0].id, newValue);
              // Zero out others if they exist
              for (let i = 1; i < currentFriends.length; i++) {
                await updateBalance(currentFriends[i].id, 0);
              }
            } else {
              // Create a default one and set its balance
              const newAccountId = await addAccount({
                name: 'Friend Debts',
                type: 'asset',
                category: 'Money Owed (Friends)'
              });

              if (newAccountId) {
                await updateBalance(newAccountId, newValue);
              }
            }
          }}
        />
      )}

      {editingAccount && (
        <ManageAccountModal
          account={editingAccount as any}
          onClose={() => setEditingAccount(null)}
          onSave={handleSaveAccount}
        />
      )}

      {viewingCard && (
        <CardDetailsModal
          card={viewingCard}
          onClose={() => setViewingCard(null)}
        />
      )}

      {viewingBank && (
        <BankDetailsModal
          account={viewingBank}
          onClose={() => setViewingBank(null)}
        />
      )}

      {showCalendarModal && (
        <CalendarModal
          onClose={() => setShowCalendarModal(false)}
        />
      )}

      {showAddAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 transform transition-all animate-fade-in-up">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Account</h2>
                <p className="text-sm text-gray-500 mt-1">Track a new asset or liability.</p>
              </div>
              <button
                onClick={() => setShowAddAccountModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AddAccountForm
              initialData={initialAccountData}
              onSuccess={() => {
                setShowAddAccountModal(false);
                setInitialAccountData(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
