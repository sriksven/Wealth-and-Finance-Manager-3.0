'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { useCards } from '@/context/CardContext';
import { NetWorthChart } from './NetWorthChart';
import { AssetAllocationChart } from './AssetAllocationChart';
import { useCurrency } from '@/context/CurrencyContext';
import { CurrencySelector } from './CurrencySelector';
import { ArrowUpRight, ArrowDownRight, TrendingUp, PieChart, Activity } from 'lucide-react';
import { AccountStats } from './AccountStats';

export const HistoricalTracking: React.FC = () => {
  const { accounts, balances, isLoading } = useFinance();
  const { cards } = useCards();
  const { formatCurrency } = useCurrency();
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y' | 'all'>('30d');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getDateRangeFilter = (range: string) => {
    const now = new Date();
    switch (range) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // Beginning of time
    }
  };

  const filteredBalances = useMemo(() => {
    const dateFilter = getDateRangeFilter(dateRange);
    return balances.filter(balance => new Date(balance.date).getTime() >= dateFilter.getTime());
  }, [balances, dateRange]);

  // Calculations for Summary Metrics
  const summaryMetrics = useMemo(() => {
    // Current totals
    let currentAssets = 0;
    let currentLiabilities = 0;

    accounts.forEach(account => {
      // Find latest balance for this account
      const accountBalances = balances
        .filter(b => b.accountId === account.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (accountBalances.length > 0) {
        if (account.type === 'asset') currentAssets += accountBalances[0].amount;
        if (account.type === 'liability') currentLiabilities += accountBalances[0].amount;
      }
    });

    // Add Credit Card Debt (Current)
    const currentCardDebt = cards.reduce((sum, card) => sum + card.currentBalance, 0);
    currentLiabilities += currentCardDebt;

    const currentNetWorth = currentAssets - currentLiabilities;

    // Previous totals (based on range)
    // Simple approach: get balances closest to the start date of the range
    const startDate = getDateRangeFilter(dateRange);
    let startAssets = 0;
    let startLiabilities = 0;

    accounts.forEach(account => {
      // Find balance closest to start date (but not after today, obviously)
      // actually we want the balance that was active AT that start date.
      // so find the last balance record BEFORE or ON start date.
      // If no balance before start date, assume 0 (or first ever balance if we want to be generous).

      const balancesBeforeStart = balances
        .filter(b => b.accountId === account.id && new Date(b.date) <= startDate)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // descending

      if (balancesBeforeStart.length > 0) {
        if (account.type === 'asset') startAssets += balancesBeforeStart[0].amount;
        if (account.type === 'liability') startLiabilities += balancesBeforeStart[0].amount;
      }
    });

    const startNetWorth = startAssets - startLiabilities;
    const change = currentNetWorth - startNetWorth;
    const percentChange = startNetWorth !== 0 ? (change / Math.abs(startNetWorth)) * 100 : 0;

    return {
      currentNetWorth,
      currentAssets,
      currentLiabilities,
      change,
      percentChange
    };
  }, [accounts, balances, cards, dateRange]);


  if (!isClient || isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Growth Trends</h1>
          <p className="text-gray-500">Track your wealth accumulation and portfolio performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <CurrencySelector size="sm" />
          <div className="bg-white border rounded-lg p-1 flex space-x-1">
            {(['30d', '90d', '1y', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${dateRange === r
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {r === 'all' ? 'All Time' : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Worth Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24 text-blue-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Net Worth</p>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(summaryMetrics.currentNetWorth)}
            </div>
            <div className={`flex items-center text-sm ${summaryMetrics.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {summaryMetrics.change >= 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              <span className="font-medium">{formatCurrency(Math.abs(summaryMetrics.change))}</span>
              <span className="mx-1">•</span>
              <span>{Math.abs(summaryMetrics.percentChange).toFixed(1)}% ({dateRange})</span>
            </div>
          </div>
        </div>

        {/* Assets Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PieChart className="w-24 h-24 text-emerald-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Assets</p>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(summaryMetrics.currentAssets)}
            </div>
            <p className="text-sm text-gray-400">Cash, Investments, Property</p>
          </div>
        </div>

        {/* Liabilities Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="w-24 h-24 text-red-600" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 mb-1">Total Liabilities</p>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatCurrency(summaryMetrics.currentLiabilities)}
            </div>
            <p className="text-sm text-gray-400">Loans, Credit Cards, Debt</p>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Line Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">Net Worth Growth</h2>
          </div>
          <NetWorthChart
            accounts={accounts}
            balances={filteredBalances}
            height={400}
          />
        </div>

        {/* Asset Allocation (Spans 1 column) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Asset Allocation</h2>
          <div className="flex-1 flex items-center justify-center">
            <AssetAllocationChart
              accounts={accounts}
              balances={balances} /* Use all balances for current snapshot */
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Account Performance Stats */}
      <AccountStats
        accounts={accounts}
        balances={balances}
        cards={cards}
        dateRange={dateRange}
        getDateRangeFilter={getDateRangeFilter}
      />
    </div>
  );
};
