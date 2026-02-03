'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import type { Account, Balance } from '@/types/finance';
import type { CreditCard as Card } from '@/types/card';

interface AccountStatsProps {
    accounts: Account[];
    balances: Balance[];
    cards: Card[];
    dateRange: '30d' | '90d' | '1y' | 'all';
    getDateRangeFilter: (range: string) => Date;
}

export const AccountStats: React.FC<AccountStatsProps> = ({ accounts, balances, cards, dateRange, getDateRangeFilter }) => {
    const { formatCurrency } = useCurrency();
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Account Performance</h2>

            {/* Bank Accounts Section */}
            {accounts.length > 0 && (
                <>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="h-1 w-1 rounded-full bg-green-500"></div>
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Bank Accounts</h3>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {accounts.map(account => {
                            const accountBalances = balances
                                .filter(b => b.accountId === account.id)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                            const currentBalance = accountBalances.length > 0 ? accountBalances[0].amount : 0;

                            const startDate = getDateRangeFilter(dateRange);
                            const balancesBeforeStart = balances
                                .filter(b => b.accountId === account.id && new Date(b.date) <= startDate)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                            const startBalance = balancesBeforeStart.length > 0 ? balancesBeforeStart[0].amount : 0;
                            const change = currentBalance - startBalance;
                            const percentChange = startBalance !== 0 ? (change / Math.abs(startBalance)) * 100 : 0;
                            const transactionCount = accountBalances.filter(b => new Date(b.date) >= startDate).length;

                            return (
                                <div
                                    key={account.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-sm">{account.name}</h3>
                                            <p className="text-xs text-gray-500 capitalize">{account.type}</p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${account.type === 'asset' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {account.type}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div>
                                            <p className="text-xs text-gray-500">Current Balance</p>
                                            <p className="text-xl font-bold text-gray-900">{formatCurrency(currentBalance)}</p>
                                        </div>

                                        {/* Sparkline Chart */}
                                        {accountBalances.length > 1 && (
                                            <div className="py-2">
                                                <svg width="100%" height="40" className="overflow-visible">
                                                    {(() => {
                                                        const values = accountBalances.slice().reverse().map(b => b.amount);
                                                        const max = Math.max(...values);
                                                        const min = Math.min(...values);
                                                        const range = max - min || 1;
                                                        const width = 100;
                                                        const height = 40;
                                                        const padding = 2;

                                                        const points = values.map((val, i) => {
                                                            const x = (i / (values.length - 1)) * width;
                                                            const y = height - padding - ((val - min) / range) * (height - 2 * padding);
                                                            return `${x},${y}`;
                                                        }).join(' ');

                                                        return (
                                                            <>
                                                                <defs>
                                                                    <linearGradient id={`gradient-${account.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                                        <stop offset="0%" stopColor={change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                                                                        <stop offset="100%" stopColor={change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.05" />
                                                                    </linearGradient>
                                                                </defs>
                                                                <polygon
                                                                    points={`0,${height} ${points} ${width},${height}`}
                                                                    fill={`url(#gradient-${account.id})`}
                                                                />
                                                                <polyline
                                                                    points={points}
                                                                    fill="none"
                                                                    stroke={change >= 0 ? '#10b981' : '#ef4444'}
                                                                    strokeWidth="2"
                                                                    vectorEffect="non-scaling-stroke"
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </svg>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500">Change ({dateRange})</p>
                                                <div className={`flex items-center text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                    {change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                                    <span>{formatCurrency(Math.abs(change))}</span>
                                                    <span className="ml-1 text-xs">({Math.abs(percentChange).toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Updates</p>
                                                <p className="text-sm font-bold text-gray-700">{transactionCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Credit Cards Section */}
            {cards.length > 0 && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Credit Cards</h3>
                            <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                        <button
                            onClick={() => navigate('/cards')}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-sm"
                        >
                            <Plus className="w-3 h-3" />
                            <span>Add Card</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cards.map(card => (
                            <div
                                key={card.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 text-sm">{card.name}</h3>
                                        <p className="text-xs text-gray-500">Credit Card</p>
                                    </div>
                                    <div className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                                        Card
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Current Balance</p>
                                        <p className="text-xl font-bold text-gray-900">{formatCurrency(card.currentBalance)}</p>
                                    </div>

                                    {/* Utilization Bar */}
                                    <div className="py-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${(card.currentBalance / card.creditLimit) * 100 > 80 ? 'bg-red-500' :
                                                    (card.currentBalance / card.creditLimit) * 100 > 50 ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${Math.min((card.currentBalance / card.creditLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-500">Credit Limit</p>
                                            <p className="text-sm font-medium text-gray-700">{formatCurrency(card.creditLimit)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Utilization</p>
                                            <p className="text-sm font-bold text-gray-700">
                                                {((card.currentBalance / card.creditLimit) * 100).toFixed(0)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
