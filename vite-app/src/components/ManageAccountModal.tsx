'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ACCOUNT_CATEGORIES } from '@/types/finance';
import type { Account, ACCOUNT_CATEGORIES_TYPE } from '@/types/finance';
import { useCards } from '@/context/CardContext';

export interface AccountUpdates {
  name: string;
  type: Account['type'];
  category: string;
  currentBalance?: number;
  creditLimit?: number;
}


interface ManageAccountModalProps {
  account: Account & { currentBalance?: number }; // Allow balance to be passed in
  onSave: (updates: AccountUpdates) => void;
  onClose: () => void;
}

export const ManageAccountModal: React.FC<ManageAccountModalProps> = ({ account, onSave, onClose }) => {
  const { cards } = useCards();
  const linkedCard = cards.find(c => c.id === account.id);

  const [name, setName] = useState(account.name);
  const [type, setType] = useState<Account['type']>(account.type);
  const [category, setCategory] = useState(account.category);
  const [balance, setBalance] = useState<string>(account.currentBalance?.toString() || '0');
  const [limit, setLimit] = useState<string>(linkedCard?.creditLimit?.toString() || '0');


  const categoryOptions = useMemo(() => {
    const options = (ACCOUNT_CATEGORIES as ACCOUNT_CATEGORIES_TYPE)[type];
    return options.includes(category as string) ? options : [...options, category];
  }, [category, type]);

  useEffect(() => {
    const options = (ACCOUNT_CATEGORIES as ACCOUNT_CATEGORIES_TYPE)[type];
    if (!options.includes(category)) {
      setTimeout(() => setCategory(options[0]), 0);
    }
  }, [category, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSave({
      name: trimmedName,
      category,
      type,
      currentBalance: parseFloat(balance),
      creditLimit: linkedCard ? parseFloat(limit) : undefined
    });

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit Account</h2>
            <p className="text-sm text-gray-500">Update the account name, type, or category.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-gray-700 mb-1">
              Account Name
            </label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Checking Account"
              required
            />
          </div>

          <div>
            <label htmlFor="account-balance" className="block text-sm font-medium text-gray-700 mb-1">
              Current Balance ($)
            </label>
            <input
              id="account-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Manually overriding the balance will create a correction entry.
            </p>
          </div>

          {linkedCard && (
            <div>
              <label htmlFor="credit-limit" className="block text-sm font-medium text-gray-700 mb-1">
                Credit Limit ($)
              </label>
              <input
                id="credit-limit"
                type="number"
                step="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: {((parseFloat(limit) || 0) - (parseFloat(balance) || 0)).toFixed(2)}
              </p>
            </div>
          )}


          <div>
            <label htmlFor="account-type" className="block text-sm font-medium text-gray-700 mb-1">
              Account Type
            </label>
            <select
              id="account-type"
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
            </select>
          </div>

          <div>
            <label htmlFor="account-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="account-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categoryOptions.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
