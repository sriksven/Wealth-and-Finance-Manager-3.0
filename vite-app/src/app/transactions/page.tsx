'use client';

import { useState, Suspense } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useTransactions } from '@/context/TransactionContext';
import { useSearchParams, Link } from 'react-router-dom';
import { MonthlyPieChart } from '@/components/MonthlyPieChart';
import { Pie } from 'react-chartjs-2';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, type Transaction } from '@/types/transaction';

function TransactionsContent() {
    const { transactions } = useTransactions();
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    const [searchParams] = useSearchParams();

    // Default to Current Date
    const now = new Date();
    const currentMonthName = now.toLocaleString('default', { month: 'long' });
    const currentYearStr = now.getFullYear().toString();

    const [selectedMonth, setSelectedMonth] = useState(searchParams.get('month') || currentMonthName);
    const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || currentYearStr);



    const monthTransactions = transactions.filter(
        t => t.month === selectedMonth && t.year === selectedYear
    ).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.id.localeCompare(a.id); // Tie-breaker: modification/creation order
    });

    const yearTransactions = transactions.filter(
        t => t.year === selectedYear
    ).sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.id.localeCompare(a.id);
    });

    // Calculate yearly stats
    const yearlyStats = {
        totalIncome: yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        byCategory: yearTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>)
    };

    // Format date in UTC to prevent timezone issues
    const formatDate = (dateInput: string | Date) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString('en-US', { timeZone: 'UTC' });
    };

    // Yearly pie chart data
    const yearlyChartData = {
        labels: Object.keys(yearlyStats.byCategory),
        datasets: [{
            data: Object.values(yearlyStats.byCategory),
            backgroundColor: [
                '#3B82F6', // Blue - Rent
                '#6B7280', // Gray - Others  
                '#EF4444', // Red - Bills
                '#F59E0B', // Orange - Transport
                '#8B5CF6', // Purple - Entertainment
                '#EC4899', // Pink - Shopping
                '#06B6D4', // Cyan - Groceries
                '#10B981', // Green - Food
            ],
        }]
    };

    return (
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                        Transaction History
                    </h1>
                    <p className="text-gray-600">View and analyze your spending patterns</p>
                </div>

                {/* View Mode Toggle & Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        {/* View Mode Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-6 py-2 rounded-md font-semibold transition-all ${viewMode === 'monthly'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setViewMode('yearly')}
                                className={`px-6 py-2 rounded-md font-semibold transition-all ${viewMode === 'yearly'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                Yearly
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4 items-center">
                            {viewMode === 'monthly' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Month
                                    </label>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                    >
                                        {['January', 'February', 'March', 'April', 'May', 'June',
                                            'July', 'August', 'September', 'October', 'November', 'December']
                                            .map(month => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Year
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                                >
                                    {['2027', '2026', '2025', '2024']
                                        .map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                </select>
                            </div>
                            <Link
                                to="/add-transaction"
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md hover:from-blue-700 hover:to-purple-700 transition-all mt-6"
                            >
                                + Add Transaction
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Monthly View */}
                {viewMode === 'monthly' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Pie Chart */}
                        <div>
                            <MonthlyPieChart month={selectedMonth} year={selectedYear} />
                        </div>

                        {/* Transactions List */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                Recent Transactions
                            </h3>

                            {monthTransactions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No transactions for {selectedMonth} {selectedYear}</p>
                                    <Link
                                        to="/add-transaction"
                                        className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
                                    >
                                        Add your first transaction →
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {monthTransactions.map((transaction) => (
                                        <TransactionItem
                                            key={transaction.id}
                                            transaction={transaction}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Yearly View */}
                {viewMode === 'yearly' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Yearly Pie Chart */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                {selectedYear} - Spending Distribution
                            </h3>
                            {Object.keys(yearlyStats.byCategory).length > 0 ? (
                                <Pie data={yearlyChartData} options={{ maintainAspectRatio: true }} />
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    No expenses for {selectedYear}
                                </div>
                            )}
                        </div>

                        {/* Yearly Summary */}
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-6">
                                {selectedYear} Summary
                            </h3>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Income</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        ${yearlyStats.totalIncome.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Expenses</div>
                                    <div className="text-2xl font-bold text-red-600">
                                        ${yearlyStats.totalExpenses.toFixed(2)}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-gray-500">Net</div>
                                    <div className={`text-2xl font-bold ${(yearlyStats.totalIncome - yearlyStats.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ${(yearlyStats.totalIncome - yearlyStats.totalExpenses).toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            <h4 className="text-lg font-semibold text-gray-700 mb-3">Category Breakdown</h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {Object.entries(yearlyStats.byCategory)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([category, amount]) => (
                                        <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="font-semibold text-gray-900">{category}</span>
                                            <span className="text-red-600 font-bold">${amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TransactionsPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<div className="text-center py-12">Loading transactions...</div>}>
                <TransactionsContent />
            </Suspense>
        </ProtectedRoute>
    );
}

const TransactionItem = ({ transaction, formatDate }: { transaction: Transaction, formatDate: (d: Date | string) => string }) => {
    const { updateTransaction, deleteTransaction } = useTransactions();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...transaction });

    const handleUpdate = async () => {
        await updateTransaction(transaction.id, editData);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this transaction? This will also remove it from your Google Sheet.')) {
            await deleteTransaction(transaction.id);
        }
    };

    if (isEditing) {
        return (
            <div className="p-4 rounded-lg bg-white shadow-md border border-blue-200">
                <div className="space-y-3">
                    <input
                        className="w-full p-2 border rounded text-sm"
                        value={editData.reason}
                        onChange={e => setEditData({ ...editData, reason: e.target.value })}
                        placeholder="Description"
                    />
                    <div className="flex gap-2">
                        <select
                            className="flex-1 p-2 border rounded text-xs"
                            value={editData.category}
                            onChange={e => setEditData({ ...editData, category: e.target.value })}
                        >
                            <option value="">Category</option>
                            {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <input
                            type="number"
                            className="w-24 p-2 border rounded text-sm font-bold"
                            value={editData.amount}
                            onChange={e => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <select
                        className="w-full p-2 border rounded text-xs"
                        value={editData.paymentMethod}
                        onChange={e => setEditData({ ...editData, paymentMethod: e.target.value })}
                    >
                        {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        <button onClick={() => setIsEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        <button onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-bold">Save Changes</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`p-3 rounded-lg border-l-4 group transition-all hover:shadow-md ${transaction.type === 'income'
                ? 'bg-green-50 border-green-500'
                : transaction.type === 'transfer'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-red-50 border-red-500'
                }`}
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-800 text-sm">{transaction.reason}</div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setIsEditing(true)} title="Edit" className="text-blue-500 hover:text-blue-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                            <button onClick={handleDelete} title="Delete" className="text-red-400 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{transaction.category}</div>
                    <div className="text-xs text-gray-500 mt-1">{formatDate(transaction.date)} • {transaction.paymentMethod}</div>
                </div>
                <div className={`text-sm font-bold ml-2 ${transaction.type === 'income' ? 'text-green-600' : transaction.type === 'transfer' ? 'text-blue-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '↔ ' : '-'}${transaction.amount.toFixed(2)}
                </div>
            </div>
        </div>
    );
};
