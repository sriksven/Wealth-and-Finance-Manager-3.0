'use client';

import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { ACCOUNT_CATEGORIES } from '@/types/finance';
import type { AccountType } from '@/types/finance';
import { useAnalytics } from '@/hooks/useAnalytics';

interface AddAccountFormProps {
  onSuccess?: () => void;
  initialData?: {
    name?: string;
    type?: AccountType;
    category?: string;
  };
}

export const AddAccountForm: React.FC<AddAccountFormProps> = ({ onSuccess, initialData }) => {
  const { addAccount } = useFinance();
  const { trackEvent } = useAnalytics();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'asset' as AccountType,
    category: initialData?.category || (ACCOUNT_CATEGORIES.asset[0] as string),
  });

  const handleTypeChange = (newType: AccountType) => {
    setFormData({
      ...formData,
      type: newType,
      category: ACCOUNT_CATEGORIES[newType][0], // Set default category
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;

    addAccount({
      name: formData.name.trim(),
      type: formData.type,
      category: formData.category,
    });

    // Track account creation
    trackEvent('account_created', {
      account_type: formData.type,
      account_category: formData.category,
    });

    // Reset form
    setFormData({
      name: '',
      type: 'asset',
      category: ACCOUNT_CATEGORIES.asset[0],
    });

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-2">
          Account Name
        </label>
        <input
          type="text"
          id="accountName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Checking Account, Credit Card, etc."
          required
        />
      </div>

      <div>
        <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
          Account Type
        </label>
        <select
          id="accountType"
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value as AccountType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="equity">Equity</option>
        </select>
      </div>

      <div>
        <label htmlFor="accountCategory" className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <select
          id="accountCategory"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {ACCOUNT_CATEGORIES[formData.type].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Add Account
      </button>
    </form>
  );
};
