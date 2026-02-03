import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import type { Account } from '@/types/finance';
import type { Transaction } from '@/types/transaction';
import { useCurrency } from '@/context/CurrencyContext';

interface BankDetailsModalProps {
    account: Account & { currentBalance?: number };
    onClose: () => void;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({ account, onClose }) => {
    const { transactions, updateTransaction, deleteTransaction } = useTransactions();
    const { formatCurrency } = useCurrency();

    // Filter transactions for this account
    // Include:
    // 1. Expenses/Transfers FROM this account (accountId === account.id)
    // 2. Income/Transfers TO this account (toAccountId === account.id or accountId === account.id for income)
    const accountTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.accountId === account.id || t.toAccountId === account.id
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, account.id]);


    const [editingTxnId, setEditingTxnId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ amount: string, reason: string }>({ amount: '', reason: '' });

    const handleEditClick = (txn: Transaction) => {
        setEditingTxnId(txn.id);
        setEditForm({
            amount: txn.amount.toString(),
            reason: txn.reason || txn.source || '' // Use source for income if reason empty
        });
    };

    const handleSaveEdit = async (txn: Transaction) => {
        const newAmount = parseFloat(editForm.amount);
        if (isNaN(newAmount)) return;

        await updateTransaction(txn.id, {
            amount: Math.abs(newAmount), // Amount is always positive in Transaction model, type determines sign
            reason: editForm.reason
        });
        setEditingTxnId(null);
    };

    const handleDeleteClick = async (id: string) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            await deleteTransaction(id);
        }
    };

    const getTransactionColor = (txn: Transaction) => {
        // Income is Green
        if (txn.type === 'income') return 'text-green-600';

        // Expense is Red
        if (txn.type === 'expense') return 'text-red-600';

        // Transfer?
        // If money left this account (accountId == this), Red
        // If money entered this account (toAccountId == this), Green
        if (txn.type === 'transfer') {
            return txn.toAccountId === account.id ? 'text-green-600' : 'text-red-600';
        }

        return 'text-gray-900';
    };

    const getSign = (txn: Transaction) => {
        if (txn.type === 'income') return '+';
        if (txn.type === 'expense') return '-';
        if (txn.type === 'transfer') {
            return txn.toAccountId === account.id ? '+' : '-';
        }
        return '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{account.name}</h2>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>Current Balance: <span className="font-semibold text-blue-600">{formatCurrency(account.currentBalance || 0)}</span></span>
                            <span className="text-gray-400">|</span>
                            <span>{account.category}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Transaction List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {accountTransactions.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No transactions found for this account.</p>
                    ) : (
                        accountTransactions.map(txn => (
                            <div key={txn.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:border-blue-100 transition-colors">

                                {editingTxnId === txn.id ? (
                                    // EDIT MODE
                                    <div className="flex-1 w-full gap-2 flex flex-col sm:flex-row items-center">
                                        <input
                                            type="text"
                                            value={editForm.reason}
                                            onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                                            className="border rounded px-2 py-1 flex-1 w-full"
                                            placeholder="Reason"
                                        />
                                        <input
                                            type="number"
                                            value={editForm.amount}
                                            onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
                                            className="border rounded px-2 py-1 w-24"
                                            placeholder="Amount"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => handleSaveEdit(txn)} className="text-green-600 hover:text-green-800 font-medium px-2">Save</button>
                                            <button onClick={() => setEditingTxnId(null)} className="text-gray-500 hover:text-gray-700 px-2">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    // VIEW MODE
                                    <>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{txn.reason || txn.source || 'No description'}</div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(txn.date).toLocaleDateString()} • {txn.category} • {txn.type.toUpperCase()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-2 sm:mt-0">
                                            <span className={`font-bold ${getTransactionColor(txn)}`}>
                                                {getSign(txn)} {formatCurrency(txn.amount)}
                                            </span>

                                            <div className="flex space-x-2">
                                                <button onClick={() => handleEditClick(txn)} className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                                                <button onClick={() => handleDeleteClick(txn.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
