'use client';

import React, { useState } from 'react';
import { useRecurring } from '@/context/RecurringContext';
import { useFinance } from '@/context/FinanceContext';
import { useCards } from '@/context/CardContext';
import type { RecurringTransaction } from '@/types/recurring';
import { useCurrency } from '@/context/CurrencyContext';
import { Calendar, Trash2, Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, X } from 'lucide-react';

interface RecurringItemsManagerProps {
    onClose?: () => void;
    isEmbedded?: boolean;
}

export const RecurringItemsManager: React.FC<RecurringItemsManagerProps> = ({ onClose, isEmbedded = false }) => {
    const { recurringItems, isLoading, addRecurringItem, updateRecurringItem, deleteRecurringItem, refreshRecurringItems } = useRecurring();
    const { accounts } = useFinance();
    const { cards } = useCards();
    const { formatCurrency } = useCurrency();
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState<Partial<RecurringTransaction>>({
        name: '',
        amount: undefined,
        frequency: 'monthly',
        type: 'expense',
        nextDueDate: new Date().toISOString().split('T')[0],
        autoPay: true,
        accountId: 'default',
        category: 'Utilities'
    });

    const categories = [
        "Housing", "Utilities", "Food & Dining", "Transportation",
        "Health & Fitness", "Personal Care", "Entertainment", "Shopping",
        "Home Services", "Education", "Financial", "Business",
        "Fees & Charges", "Salary", "Refunds", "Uncategorized"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || form.amount === undefined || !form.nextDueDate) return;

        setIsSaving(true);

        let success;
        if (editingId) {
            // Update existing item
            success = await updateRecurringItem(editingId, {
                name: form.name,
                amount: Number(form.amount || 0),
                type: form.type as 'expense' | 'income' | 'transfer',
                frequency: form.frequency as 'monthly' | 'weekly' | 'yearly',
                nextDueDate: form.nextDueDate,
                autoPay: form.autoPay || false,
                accountId: form.accountId,
                category: form.category || 'Utilities'
            });
        } else {
            // Add new item
            success = await addRecurringItem({
                name: form.name,
                amount: Number(form.amount || 0),
                type: form.type as 'expense' | 'income' | 'transfer',
                frequency: form.frequency as 'monthly' | 'weekly' | 'yearly',
                nextDueDate: new Date(form.nextDueDate),
                autoPay: form.autoPay || false,
                accountId: form.accountId,
                category: form.category || 'Utilities'
            });
        }

        setIsSaving(false);

        if (success) {
            // Reset form
            setEditingId(null);
            setForm({
                name: '',
                amount: undefined,
                frequency: 'monthly',
                type: 'expense',
                nextDueDate: new Date().toISOString().split('T')[0],
                autoPay: true,
                accountId: 'default',
                category: 'Utilities'
            });
        }
    };

    const handleEdit = (item: RecurringTransaction) => {
        setEditingId(item.id);
        setForm({
            name: item.name,
            amount: item.amount,
            type: item.type,
            frequency: item.frequency,
            nextDueDate: typeof item.nextDueDate === 'string' ? item.nextDueDate : new Date(item.nextDueDate).toISOString().split('T')[0],
            autoPay: item.autoPay,
            accountId: item.accountId || 'default',
            category: item.category
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm({
            name: '',
            amount: undefined,
            frequency: 'monthly',
            type: 'expense',
            nextDueDate: new Date().toISOString().split('T')[0],
            autoPay: true,
            accountId: 'default',
            category: 'Utilities'
        });
    };

    const content = (
        <div className={`flex flex-col h-full ${isEmbedded ? '' : 'max-h-[85vh]'}`}>
            {!isEmbedded && (
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Recurring Items Manager</h2>
                        <p className="text-sm text-gray-500">Manage recurring income, expenses, and transfers.</p>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* List Section */}
                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 text-lg flex items-center space-x-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span>Active Recurring Items</span>
                        </h3>
                        <div className="flex items-center space-x-3">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                {recurringItems.length} Total
                            </div>
                            <button
                                onClick={refreshRecurringItems}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Refresh List"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                            <RefreshCw className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
                            <p className="text-gray-500 font-medium tracking-wide">Loading recurring items...</p>
                        </div>
                    ) : recurringItems.length === 0 ? (
                        <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-bold mb-1">No recurring items yet</p>
                            <p className="text-gray-400 text-sm max-w-[200px]">Add your monthly bills or salary to start tracking.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {recurringItems.map((item: RecurringTransaction) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleEdit(item)}
                                    className={`p-5 border rounded-2xl hover:shadow-md transition-all group relative overflow-hidden cursor-pointer ${editingId === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'
                                        }`}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${item.type === 'income' ? 'bg-green-500' : item.type === 'expense' ? 'bg-red-500' : 'bg-blue-500'
                                        }`} />

                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start space-x-4">
                                            <div className={`p-3 rounded-xl ${item.type === 'income' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                                                }`}>
                                                {item.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                                                    {item.name}
                                                    {item.autoPay && (
                                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tight">
                                                            Auto
                                                        </span>
                                                    )}
                                                    {editingId === item.id && (
                                                        <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tight">
                                                            Editing
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center space-x-3">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-600 capitalize">
                                                        {item.frequency}
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>Due {new Date(item.nextDueDate).toLocaleDateString()}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center space-x-6">
                                            <div>
                                                <div className={`text-lg font-black ${item.type === 'income' ? 'text-green-600' : 'text-gray-900'
                                                    }`}>
                                                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                                    {item.category}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteRecurringItem(item.id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                title="Remove Item"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Form Section */}
                <div className={`w-full lg:w-96 p-6 ${isEmbedded ? 'bg-white border-t lg:border-t-0 lg:border-l' : 'bg-gray-50 border-l'} border-gray-100`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-gray-800">{editingId ? 'Edit Item' : 'Add New Item'}</h3>
                        </div>
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
                                    placeholder="e.g., Netflix, Salary, Rent"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                        <input
                                            type="number"
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-7 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                                            placeholder="0.00"
                                            value={form.amount || ''}
                                            onChange={e => setForm({ ...form, amount: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Type</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                        value={form.type}
                                        onChange={e => setForm({ ...form, type: e.target.value as any })}
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                        <option value="transfer">Transfer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Frequency</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                        value={form.frequency}
                                        onChange={e => setForm({ ...form, frequency: e.target.value as any })}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                                    <select
                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                        value={form.category}
                                        onChange={e => setForm({ ...form, category: e.target.value })}
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Next Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                    value={form.nextDueDate}
                                    onChange={e => setForm({ ...form, nextDueDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Payment/Deposit Account</label>
                                <select
                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm font-medium text-gray-700"
                                    value={form.accountId}
                                    onChange={e => setForm({ ...form, accountId: e.target.value })}
                                >
                                    <option value="default">Use Default/None</option>

                                    {accounts.length > 0 && (
                                        <optgroup label="Bank Accounts" className="font-bold text-gray-400 py-2">
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>🏦 {acc.name}</option>
                                            ))}
                                        </optgroup>
                                    )}

                                    {cards.length > 0 && (
                                        <optgroup label="Credit Cards" className="font-bold text-gray-400 py-2">
                                            {cards.map(card => (
                                                <option key={card.id} value={card.id}>💳 {card.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 mt-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="autopay" className="text-sm font-bold text-gray-700">Enable Auto-Pay</label>
                                    <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors cursor-pointer"
                                        onClick={() => setForm(f => ({ ...f, autoPay: !f.autoPay }))}>
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.autoPay ? 'translate-x-6' : 'translate-x-1'} ${form.autoPay ? 'bg-blue-600' : ''}`}
                                            style={{ backgroundColor: form.autoPay ? '#2563eb' : 'white' }} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                                    When enabled, a transaction will be automatically recorded on the due date.
                                </p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`w-full ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] mt-2 flex items-center justify-center space-x-2 disabled:cursor-not-allowed`}
                        >
                            {isSaving ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <Plus className="w-5 h-5" />
                            )}
                            <span>{isSaving ? (editingId ? 'Updating...' : 'Adding Item...') : (editingId ? 'Update Item' : 'Add Recurring Item')}</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    if (isEmbedded) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {content}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-fade-in-up">
                {content}
            </div>
        </div>
    );
};
