'use client';

import React, { useMemo } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  type TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Balance, Account } from '@/types/finance';
import { useCurrency } from '@/context/CurrencyContext';
import { useCards } from '@/context/CardContext';

// Explicitly register adapter to handle side-effect failure
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

interface NetWorthChartProps {
  accounts: Account[];
  balances: Balance[];
  height?: number;
}

interface NetWorthDataPoint {
  date: Date;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ accounts, balances, height = 400 }) => {
  const { formatCurrency, selectedCurrency } = useCurrency();
  const { cards } = useCards();

  const netWorthData = useMemo(() => {
    // Debug logging
    console.log('NetWorthChart balances:', balances.length, balances[0]);

    // Get all unique dates from balances using Local Time to avoid UTC shifting issues
    const uniqueDayKeys = new Set(balances.map(b => {
      if (!(b.date instanceof Date) || isNaN(b.date.getTime())) {
        console.error('Invalid date found in balance:', b);
        return null;
      }
      return `${b.date.getFullYear()}-${b.date.getMonth()}-${b.date.getDate()}`;
    }).filter(k => k !== null) as string[]);

    const allDates = [...uniqueDayKeys]
      .map(key => {
        const [year, month, day] = key.split('-').map(Number);
        return new Date(year, month, day, 23, 59, 59, 999);
      })
      .sort((a, b) => a.getTime() - b.getTime());

    const dataPoints: NetWorthDataPoint[] = [];

    for (const date of allDates) {
      let totalAssets = 0;
      let totalLiabilities = 0;

      // For each account, get the most recent balance up to this date
      for (const account of accounts) {
        const accountBalances = balances
          .filter(b => b.accountId === account.id && b.date <= date)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        if (accountBalances.length > 0) {
          const mostRecentBalance = accountBalances[0].amount;

          if (account.type === 'asset') {
            totalAssets += mostRecentBalance;
          } else if (account.type === 'liability') {
            totalLiabilities += Math.abs(mostRecentBalance); // Convert to positive for display
          }
        }
      }

      // Add credit card liabilities (current balances only - they don't have historical tracking yet)
      const creditCardDebt = cards
        .filter(c => c.type === 'credit' && c.isActive)
        .reduce((sum, card) => sum + card.currentBalance, 0);

      totalLiabilities += creditCardDebt;

      dataPoints.push({
        date,
        assets: totalAssets,
        liabilities: totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
      });
    }

    return dataPoints;
  }, [accounts, balances, cards]);

  const data = useMemo(() => ({
    labels: netWorthData.map(point => point.date),
    datasets: [
      {
        label: 'Net Worth',
        data: netWorthData.map(point => point.netWorth),
        borderColor: '#3b82f6', // Bright Blue
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.3, // Smooth curves
        pointRadius: 0,
        pointHoverRadius: 6,
      },
      {
        label: 'Assets',
        data: netWorthData.map(point => point.assets),
        borderColor: '#10b981', // Emerald
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        hidden: true, // Hidden by default to keep chart clean
      },
      {
        label: 'Liabilities',
        data: netWorthData.map(point => point.liabilities),
        borderColor: '#ef4444', // Red
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 6,
        hidden: true,
      },
    ],
  }), [netWorthData]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 15,
          padding: 20,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
          family: "'Inter', sans-serif"
        },
        bodyFont: {
          size: 13,
          family: "'Inter', sans-serif"
        },
        callbacks: {
          label: function (context: TooltipItem<'line'>) {
            const y = context.parsed.y;
            return y == null ? '' : `${context.dataset.label}: ${formatCurrency(y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          tooltipFormat: 'MMM d, yyyy', // Format for tooltip title
          displayFormats: {
            day: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          color: '#6b7280'
        }
      },
      y: {
        position: 'right' as const,
        grid: {
          color: '#f3f4f6',
        },
        border: {
          display: false
        },
        ticks: {
          callback: function (value: number | string) {
            return formatCurrency(Number(value));
          },
          font: {
            family: "'Inter', sans-serif",
            size: 11
          },
          color: '#6b7280'
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }), [formatCurrency, selectedCurrency.symbol]);

  if (netWorthData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-dashed border-gray-200">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No historical data yet</p>
          <p className="text-gray-400 text-sm mt-1">Add balances to see your net worth growth</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: `${height}px` }} className="w-full relative">
      <Line data={data} options={options} key={JSON.stringify(netWorthData.length)} />
    </div>
  );
};
