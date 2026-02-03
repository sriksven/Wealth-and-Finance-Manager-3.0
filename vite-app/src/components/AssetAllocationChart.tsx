'use client';

import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    type ChartOptions
} from 'chart.js';
import type { Account, Balance } from '@/types/finance';
import { useCurrency } from '@/context/CurrencyContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AssetAllocationChartProps {
    accounts: Account[];
    balances: Balance[];
    height?: number;
}

export const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
    accounts,
    balances,
    height = 300
}) => {
    const { formatCurrency } = useCurrency();

    // Calculate current balance for each account type
    const allocation = useMemo(() => {
        // Get latest balance for each account
        const latestBalances = new Map<string, number>();

        // Group balances by account
        const accountBalances = balances.reduce((acc, balance) => {
            if (!acc[balance.accountId]) {
                acc[balance.accountId] = [];
            }
            acc[balance.accountId].push(balance);
            return acc;
        }, {} as Record<string, Balance[]>);

        // Find latest for each
        Object.keys(accountBalances).forEach(accountId => {
            const sorted = accountBalances[accountId].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            if (sorted.length > 0) {
                latestBalances.set(accountId, sorted[0].amount);
            }
        });

        // Group by account type
        const byType: Record<string, number> = {};
        let total = 0;

        accounts.forEach(account => {
            const balance = latestBalances.get(account.id) || 0;
            if (balance > 0) {
                const type = account.type.charAt(0).toUpperCase() + account.type.slice(1);
                byType[type] = (byType[type] || 0) + balance;
                total += balance;
            }
        });

        return { byType, total };
    }, [accounts, balances]);

    const data = useMemo(() => {
        const labels = Object.keys(allocation.byType);
        const amounts = Object.values(allocation.byType);

        return {
            labels,
            datasets: [
                {
                    data: amounts,
                    backgroundColor: [
                        '#3b82f6', // Blue
                        '#10b981', // Emerald
                        '#f59e0b', // Amber
                        '#6366f1', // Indigo
                        '#ec4899', // Pink
                        '#8b5cf6', // Violet
                        '#14b8a6', // Teal
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                },
            ],
        };
    }, [allocation]);

    const options: ChartOptions<'doughnut'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'bottom',
                align: 'center',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const percentage = ((value / allocation.total) * 100).toFixed(1);
                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                    }
                }
            }
        }
    }), [allocation.total, formatCurrency]);

    if (allocation.total === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400">
                No asset data available
            </div>
        );
    }

    return (
        <div className="relative" style={{ height: `${height}px` }}>
            <Doughnut data={data} options={options} />
            {/* Center Text displaying Total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-sm text-gray-500 font-medium">Total Assets</div>
                <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(allocation.total)}
                </div>
            </div>
        </div>
    );
};
