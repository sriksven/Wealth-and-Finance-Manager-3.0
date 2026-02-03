'use client';

import React, { useState } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { useCards } from '@/context/CardContext';
import { useFinance } from '@/context/FinanceContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/types/transaction';
import { useNavigate } from 'react-router-dom';
import ImprovedPaymentSelector from '@/components/ImprovedPaymentSelector';

export const AddTransactionForm: React.FC = () => {
    const navigate = useNavigate();
    const { addTransaction } = useTransactions();
    const { cards } = useCards();
    const { getAccountsWithBalances } = useFinance();
    const bankAccounts = getAccountsWithBalances().filter(a => a.type === 'asset');

    const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'transfer'>('expense');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        source: '',
        category: '',
        accountId: '', // Source account for expense/transfer, destination for income
        toAccountId: '', // For bank-to-bank transfers
        transferToCardId: '',
        transferMethod: '', // For transfer payment method
        time: new Date().toLocaleTimeString([], { hour12: false }),
        destinationType: 'card' // Default to card bill
    });

    // New payment selector state
    const [paymentSelection, setPaymentSelection] = useState<{
        type: 'bank' | 'card' | 'cash' | 'friend' | '';
        accountId?: string;
        cardId?: string;
    }>({
        type: '',
        accountId: '',
        cardId: ''
    });

    // Split expense state
    const [isSplit, setIsSplit] = useState(false);
    const [myShare, setMyShare] = useState('');
    const [splitWithFriendAccountId, setSplitWithFriendAccountId] = useState('');

    const friendAccounts = getAccountsWithBalances().filter(a => a.category === 'Money Owed (Friends)');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const year = selectedDate.getFullYear().toString();
            const month = selectedDate.toLocaleString('en-US', { month: 'long' });

            // Ensure date is treated as local date for the transaction record
            const dateStr = selectedDate.toISOString().split('T')[0];
            const transactionDate = new Date(dateStr + 'T' + formData.time);

            const amountVal = parseFloat(formData.amount);
            if (!amountVal || amountVal <= 0) {
                throw new Error('Please enter a valid amount');
            }

            if (activeTab === 'expense') {
                // Determine payment method string from selection
                let paymentMethodStr = 'Cash';
                let sourceAccountId = formData.accountId || 'default';

                if (paymentSelection.type === 'bank' && paymentSelection.accountId) {
                    paymentMethodStr = 'Bank';
                    sourceAccountId = paymentSelection.accountId;
                } else if (paymentSelection.type === 'card' && paymentSelection.cardId) {
                    const card = cards.find(c => c.id === paymentSelection.cardId);
                    paymentMethodStr = card?.type === 'credit' ? 'Credit Card' : 'Debit Card';
                    // CORRECT FIX: Use cardId as accountId
                    sourceAccountId = paymentSelection.cardId;
                } else if (paymentSelection.type === 'cash') {
                    paymentMethodStr = 'Cash';
                    sourceAccountId = 'default';
                } else if (paymentSelection.type === 'friend' && paymentSelection.accountId) {
                    paymentMethodStr = 'Friend Debt';
                    sourceAccountId = paymentSelection.accountId;
                }

                if (isSplit) {
                    const myShareVal = parseFloat(myShare);
                    const otherShareVal = amountVal - myShareVal;

                    if (isNaN(myShareVal) || myShareVal < 0 || myShareVal > amountVal) {
                        throw new Error('Please enter a valid amount for your share');
                    }

                    // 1. Record YOUR actual expense (what you spent on yourself)
                    if (myShareVal > 0) {
                        await addTransaction({
                            accountId: sourceAccountId,
                            type: 'expense' as const,
                            amount: myShareVal,
                            category: formData.category || 'Others',
                            reason: formData.reason || 'Expense',
                            paymentMethod: paymentMethodStr,
                            date: transactionDate,
                            time: formData.time,
                            month,
                            year
                        });
                    }

                    // 2. Record THE SPLIT (what they owe you)
                    if (otherShareVal > 0) {
                        if (splitWithFriendAccountId) {
                            // Method B: Record as a TRANSFER to the Friend's Virtual Account
                            const friendAcc = friendAccounts.find(a => a.id === splitWithFriendAccountId);
                            await addTransaction({
                                accountId: sourceAccountId,
                                toAccountId: splitWithFriendAccountId,
                                type: 'transfer' as const,
                                amount: otherShareVal,
                                category: 'Lending / Reimbursable',
                                reason: (formData.reason || 'Expense') + ` (Split - Owed by ${friendAcc?.name || 'Friend'})`,
                                paymentMethod: paymentMethodStr,
                                date: transactionDate,
                                time: formData.time,
                                month,
                                year
                            });
                        } else {
                            // Method A (Fallback): Record as a LENDING expense
                            await addTransaction({
                                accountId: sourceAccountId,
                                type: 'expense' as const,
                                amount: otherShareVal,
                                category: 'Lending / Reimbursable',
                                reason: (formData.reason || 'Expense') + ' (Split - Owed by Friend)',
                                paymentMethod: paymentMethodStr,
                                date: transactionDate,
                                time: formData.time,
                                month,
                                year
                            });
                        }
                    }

                } else {
                    // Standard Single Transaction
                    const newTxn = {
                        accountId: sourceAccountId,
                        type: 'expense' as const,
                        amount: amountVal,
                        category: formData.category || 'Others',
                        reason: formData.reason || 'Expense',
                        paymentMethod: paymentMethodStr,
                        date: transactionDate,
                        time: formData.time,
                        month,
                        year
                    };

                    await addTransaction(newTxn);
                }
            } else if (activeTab === 'income') {
                // Determine payment method for income
                let paymentMethodStr = 'Cash';
                let destAccountId = formData.accountId || 'default';

                if (paymentSelection.type === 'bank' && paymentSelection.accountId) {
                    paymentMethodStr = 'Bank';
                    destAccountId = paymentSelection.accountId;
                } else if (paymentSelection.type === 'friend' && paymentSelection.accountId) {
                    paymentMethodStr = 'Friend Debt';
                    destAccountId = paymentSelection.accountId;
                } else if (paymentSelection.type === 'cash') {
                    paymentMethodStr = 'Cash';
                    destAccountId = 'default';
                }

                // For Reimbursements from a split friend, record as a TRANSFER from their account
                if (formData.category === 'Reimbursement' && splitWithFriendAccountId) {
                    const friendAcc = friendAccounts.find(a => a.id === splitWithFriendAccountId);
                    await addTransaction({
                        accountId: splitWithFriendAccountId, // From friend's virtual account
                        toAccountId: destAccountId,        // To my bank/cash account
                        type: 'transfer' as const,
                        amount: amountVal,
                        category: 'Reimbursement',
                        reason: (formData.reason || formData.source || 'Reimbursement') + ` (Settle up from ${friendAcc?.name || 'Friend'})`,
                        paymentMethod: paymentMethodStr,
                        date: transactionDate,
                        time: formData.time,
                        month,
                        year
                    });
                } else {
                    // Standard Income
                    await addTransaction({
                        accountId: destAccountId,
                        type: 'income' as const,
                        amount: amountVal,
                        category: formData.category || 'Other Income',
                        reason: formData.reason || formData.source || 'Income',
                        paymentMethod: paymentMethodStr,
                        date: transactionDate,
                        time: formData.time,
                        month,
                        year
                    });
                }
            } else if (activeTab === 'transfer') {
                // CASE 1: Credit Card Bill Payment
                if (formData.transferToCardId) {
                    const card = cards.find(c => c.id === formData.transferToCardId);
                    const cardName = card ? `${card.bank} ${card.name}` : 'Credit Card';

                    await addTransaction({
                        accountId: formData.accountId || 'default',
                        toAccountId: formData.transferToCardId,
                        type: 'transfer' as const,
                        amount: amountVal,
                        category: 'Credit Card Payment',
                        reason: `Payment to ${cardName}`,
                        paymentMethod: 'Bank',
                        date: transactionDate,
                        time: formData.time,
                        month,
                        year
                    });
                }
                // CASE 2: Bank to Bank Transfer
                else if (formData.accountId && formData.toAccountId) {
                    const fromAcc = bankAccounts.find(a => a.id === formData.accountId);
                    const toAcc = bankAccounts.find(a => a.id === formData.toAccountId);

                    await addTransaction({
                        accountId: formData.accountId,
                        toAccountId: formData.toAccountId,
                        type: 'transfer' as const,
                        amount: amountVal,
                        category: 'Transfer',
                        reason: formData.reason || `Transfer from ${fromAcc?.name} to ${toAcc?.name}`,
                        paymentMethod: 'Transfer',
                        date: transactionDate,
                        time: formData.time,
                        month,
                        year
                    });
                }
            }

            setStatus({
                type: 'success',
                message: '✅ Saved successfully!'
            });

            // Redirect
            setTimeout(() => {
                navigate('/transactions');
            }, 1000);

        } catch (error) {
            setStatus({
                type: 'error',
                message: '❌ Error: ' + (error as Error).message
            });
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'expense' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('expense')}
                >
                    Add Expense
                </button>
                <button
                    className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'income' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('income')}
                >
                    Add Income
                </button>
                <button
                    className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-colors ${activeTab === 'transfer' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('transfer')}
                >
                    Pay Card / Transfer
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
                {/* Date Picker (Common) */}
                <div className="bg-gray-50 p-6 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={selectedDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                                const dateParts = e.target.value.split('-');
                                if (dateParts.length === 3) {
                                    const year = parseInt(dateParts[0]);
                                    const month = parseInt(dateParts[1]) - 1;
                                    const day = parseInt(dateParts[2]);
                                    setSelectedDate(new Date(year, month, day));
                                }
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm font-medium text-gray-900"
                            required
                        />
                    </div>
                </div>

                {activeTab === 'expense' && (
                    <div className="bg-red-50 p-6 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-red-700 uppercase mb-4">Expense Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                                required
                            >
                                <option value="">Select Category</option>
                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                name="reason"
                                placeholder="What was this for?"
                                value={formData.reason}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
                                required
                            />
                        </div>

                        {/* Split Expense Toggle */}
                        <div className="bg-white p-4 rounded-md border border-red-100">
                            <div className="flex items-center mb-2">
                                <input
                                    type="checkbox"
                                    id="splitExpense"
                                    checked={isSplit}
                                    onChange={(e) => setIsSplit(e.target.checked)}
                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                />
                                <label htmlFor="splitExpense" className="ml-2 block text-sm font-medium text-gray-700">
                                    Split this expense? (e.g. with roommate)
                                </label>
                            </div>

                            <div className="text-xs text-gray-500 mb-2 ml-6">
                                💡 <strong>Method B (Recommended):</strong> Create a &quot;Friend Account&quot; in Settings to track exactly who owes you what.
                            </div>

                            {isSplit && (
                                <div className="mt-3 pl-6 space-y-4 animate-fade-in border-l-2 border-red-100">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">My Share ($)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={myShare}
                                            onChange={(e) => setMyShare(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Split With (Friend Account)</label>
                                        <select
                                            value={splitWithFriendAccountId}
                                            onChange={(e) => setSplitWithFriendAccountId(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-red-500 bg-white"
                                        >
                                            <option value="">Lending (No specific account)</option>
                                            {friendAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                        {friendAccounts.length === 0 && (
                                            <p className="mt-1 text-[10px] text-orange-600 italic">
                                                No friend accounts found. Add one in Settings &gt; Accounts with category &quot;Money Owed (Friends)&quot;.
                                            </p>
                                        )}
                                    </div>

                                    {formData.amount && myShare && (
                                        <div className="text-sm bg-gray-50 p-2 rounded border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-gray-500">My Share:</span>
                                                <span className="font-bold text-gray-700">${parseFloat(myShare).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Owed by {friendAccounts.find(a => a.id === splitWithFriendAccountId)?.name || 'others'}:</span>
                                                <span className="font-bold text-red-600">
                                                    ${(parseFloat(formData.amount) - (parseFloat(myShare) || 0)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment Selector */}
                        <ImprovedPaymentSelector
                            value={paymentSelection}
                            onChange={setPaymentSelection}
                            label="How did you pay?"
                            required
                        />
                    </div>
                )}

                {activeTab === 'income' && (
                    <div className="bg-green-50 p-6 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-green-700 uppercase mb-4">Income Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category / Source</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">Select Category</option>
                                {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From Whom / Description</label>
                            <input
                                name="source"
                                placeholder="Employer, Mom, etc."
                                value={formData.source}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <ImprovedPaymentSelector
                            value={paymentSelection}
                            onChange={setPaymentSelection}
                            label="How did you receive it?"
                            required
                        />
                    </div>
                )}

                {activeTab === 'transfer' && (
                    <div className="bg-blue-50 p-6 rounded-lg space-y-4">
                        <h3 className="text-sm font-semibold text-blue-700 uppercase mb-4">Pay Bill / Transfer</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Record a credit card bill payment or move money between accounts.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <input
                                name="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">From (Account)</label>
                                <select
                                    name="accountId"
                                    value={formData.accountId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                                    required
                                >
                                    <option value="">Select Source</option>
                                    {bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">To (Card or Bank)</label>
                                <select
                                    name="destinationType"
                                    value={formData.destinationType}
                                    onChange={(e) => {
                                        const type = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            destinationType: type,
                                            toAccountId: type === 'card' ? '' : prev.toAccountId,
                                            transferToCardId: type === 'bank' ? '' : prev.transferToCardId
                                        }));
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="card">Credit Card Bill</option>
                                    <option value="bank">Other Bank Account</option>
                                </select>
                            </div>
                        </div>

                        {formData.destinationType === 'card' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Credit Card</label>
                                <select
                                    name="transferToCardId"
                                    value={formData.transferToCardId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                                    required={formData.destinationType === 'card'}
                                >
                                    <option value="">Select Card to Pay</option>
                                    {cards.filter(c => c.type === 'credit' && c.isActive).map(card => (
                                        <option key={card.id} value={card.id}>
                                            {card.bank} {card.name} (Debt: ${card.currentBalance.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {formData.destinationType === 'bank' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Destination Bank</label>
                                <select
                                    name="toAccountId"
                                    value={formData.toAccountId}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                                    required={formData.destinationType === 'bank'}
                                >
                                    <option value="">Choose bank...</option>
                                    {bankAccounts.filter(a => a.id !== formData.accountId).map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                            <select
                                name="transferMethod"
                                value={formData.transferMethod}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select Method</option>
                                <option value="Bank">Bank Transfer</option>
                                <option value="Zelle">Zelle</option>
                                <option value="Cash">Cash</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <input
                                name="reason"
                                placeholder="e.g. Monthly Bill Payment"
                                value={formData.reason}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                )}

                {/* Status Message */}
                {status && (
                    <div className={`p-4 rounded-md shadow-sm ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                        {status.message}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 rounded-xl text-white font-bold text-lg shadow-md transition-all active:scale-[0.98] ${loading ? 'bg-gray-400 cursor-not-allowed' :
                        activeTab === 'expense' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' :
                            activeTab === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' :
                                'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                        }`}
                >
                    {loading ? (
                        <span className="flex items-center justify-center">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                            Saving...
                        </span>
                    ) : activeTab === 'transfer' ? 'Record Payment' : 'Save Transaction'}
                </button>
            </form>
        </div>
    );
};
