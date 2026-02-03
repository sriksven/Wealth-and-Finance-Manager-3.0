'use client';

import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import { useTransactions } from '@/context/TransactionContext';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface MonthlyPieChartProps {
    month: string;
    year: string;
}

const CATEGORY_COLORS: { [key: string]: string } = {
    'Food': '#10b981',
    'Groceries': '#3b82f6',
    'Transport': '#f59e0b',
    'Shopping': '#ec4899',
    'Entertainment': '#8b5cf6',
    'Bills': '#ef4444',
    'Rent': '#6366f1',
    'Healthcare': '#14b8a6',
    'Education': '#06b6d4',
    'Others': '#6b7280'
};

export const MonthlyPieChart: React.FC<MonthlyPieChartProps> = ({ month, year }) => {
    const { getMonthlySummary } = useTransactions();
    const summary = getMonthlySummary(month, year);

    const categories = useMemo(() => Object.keys(summary.byCategory), [summary.byCategory]);
    const amounts = useMemo(() => Object.values(summary.byCategory), [summary.byCategory]);

    const data = useMemo(() => ({
        labels: categories,
        datasets: [
            {
                label: 'Spending by Category',
                data: amounts,
                backgroundColor: categories.map(cat => CATEGORY_COLORS[cat] || '#6b7280'),
                borderColor: '#ffffff',
                borderWidth: 2,
            }
        ]
    }), [categories, amounts]);

    const options: ChartOptions<'pie'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    padding: 15,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.parsed as number;
                        const total = amounts.reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                    }
                }
            }
        }
    }), [amounts]);

    if (categories.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                No expenses recorded for {month} {year}
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
                {month} {year} - Spending Breakdown
            </h3>

            <div className="mb-6" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <Pie data={data} options={options} />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                    <div className="text-sm text-gray-500">Total Income</div>
                    <div className="text-2xl font-bold text-green-600">
                        ${summary.totalIncome.toFixed(2)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">Total Expenses</div>
                    <div className="text-2xl font-bold text-red-600">
                        ${summary.totalExpenses.toFixed(2)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-gray-500">Net Savings</div>
                    <div className={`text-2xl font-bold ${summary.netSavings >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        ${summary.netSavings.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Category Breakdown Table */}
            <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-700 mb-3">Category Details</h4>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Category</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Amount</th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Percentage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {categories.map((category) => {
                                const amount = summary.byCategory[category];
                                const percentage = ((amount / summary.totalExpenses) * 100).toFixed(1);
                                return (
                                    <tr key={category}>
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                            <span
                                                className="inline-block w-3 h-3 rounded-full mr-2"
                                                style={{ backgroundColor: CATEGORY_COLORS[category] || '#6b7280' }}
                                            ></span>
                                            {category}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                            ${amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-700 font-medium">
                                            {percentage}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
