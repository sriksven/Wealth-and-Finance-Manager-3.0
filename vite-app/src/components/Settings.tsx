'use client';

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { setDoc, collection, writeBatch, getDocs, query, where, doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '@/context/AuthContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '@/context/CurrencyContext';
import { useBudgets } from '@/context/BudgetContext';
import { RecurringItemsManager } from './RecurringItemsManager';
import {
  User,
  Settings as SettingsIcon,
  Database,
  Download,
  Trash2,
  Globe,
  FileSpreadsheet,
  FileJson,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Plus
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [resetStatus, setResetStatus] = useState<'idle' | 'resetting' | 'completed' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'success'>('idle');

  const { budgetConfig, updateBudgetConfig } = useBudgets();
  const [tempLevels, setTempLevels] = useState<number[]>(budgetConfig.levels);
  const [budgetStatus, setBudgetStatus] = useState<'idle' | 'saving' | 'success'>('idle');

  useEffect(() => {
    setTimeout(() => setTempLevels(budgetConfig.levels), 0);
  }, [budgetConfig.levels]);

  const handleUpdateBudgetLevels = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetStatus('saving');
    try {
      console.log("Attempting to save budget levels:", tempLevels);
      await updateBudgetConfig(tempLevels);
      setBudgetStatus('success');
      setTimeout(() => setBudgetStatus('idle'), 2000);
    } catch (error) {
      console.error("Failed to update budget levels:", error);
      setBudgetStatus('idle');
      alert(`Failed to save budget levels: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setProfileStatus('saving');
    try {
      await updateProfile(auth.currentUser, { displayName });
      await setDoc(doc(db, 'users', auth.currentUser.uid), { displayName }, { merge: true });
      setProfileStatus('success');
      setTimeout(() => setProfileStatus('idle'), 3000);
      await auth.currentUser.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      setProfileStatus('idle');
    }
  };

  /* import * as XLSX from 'xlsx'; needs to be at top, but for replacing logic inside component: */

  const handleExportData = async (format: 'json' | 'excel') => {
    if (!user) return;
    setExportStatus('exporting');
    try {
      // 1. Fetch ALL Data
      const collections = ['transactions', 'accounts', 'cards', 'balances'];
      const allData: Record<string, any[]> = {};
      for (const col of collections) {
        const q = query(collection(db, col), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        allData[col] = snapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamps to generic ISO strings if needed, though most are likely strings already
          return { id: doc.id, ...data };
        });
      }

      if (format === 'json') {
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `wealth_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else {
        // EXCEL EXPORT
        const XLSX = await import('xlsx');

        const wb = XLSX.utils.book_new();

        // --- SHEET 1: OVERVIEW ---
        const overviewData = [
          ["Wealth and Finance Manager - Export"],
          ["Export Date", new Date().toLocaleString()],
          ["User", user.displayName || user.email],
          [""],
          ["SUMMARY STATS"],
          ["Total Accounts", allData['accounts']?.length || 0],
          ["Total Cards", allData['cards']?.length || 0],
          ["Total Transactions", allData['transactions']?.length || 0]
        ];
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

        // --- SHEET 2: BANK ACCOUNTS ---
        const balancesData = allData['balances'] || [];
        const accountsData = (allData['accounts'] || []).map(acc => {
          // Find latest balance for this account
          const accountBalances = balancesData
            .filter(b => b.accountId === acc.id)
            .sort((a, b) => {
              const dateA = a.date && typeof a.date === 'object' && 'seconds' in a.date ? a.date.seconds : new Date(a.date || 0).getTime() / 1000;
              const dateB = b.date && typeof b.date === 'object' && 'seconds' in b.date ? b.date.seconds : new Date(b.date || 0).getTime() / 1000;
              return dateB - dateA;
            });
          const currentBalance = accountBalances.length > 0 ? (Number(accountBalances[0].amount) || 0) : 0;

          return {
            Name: acc.name,
            Type: acc.type,
            Category: acc.category,
            Current_Balance: currentBalance,
            Institution: acc.institution || 'N/A'
          };
        });
        if (accountsData.length > 0) {
          const wsAccounts = XLSX.utils.json_to_sheet(accountsData);
          XLSX.utils.book_append_sheet(wb, wsAccounts, "Bank Accounts");
        }

        // --- SHEET 3: CREDIT CARDS ---
        const cardsData = (allData['cards'] || []).map(c => ({
          Name: c.name,
          Bank: c.bank,
          Last_4: c.lastFour,
          Limit: c.creditLimit,
          Balance: c.currentBalance,
          Available: (c.creditLimit || 0) - (c.currentBalance || 0),
          Due_Date: c.dueDate
        }));
        if (cardsData.length > 0) {
          const wsCards = XLSX.utils.json_to_sheet(cardsData);
          XLSX.utils.book_append_sheet(wb, wsCards, "Credit Cards");
        }

        // --- SHEET 4+: TRANSACTIONS BY YEAR ---
        const txns = allData['transactions'] || [];

        // Group by year
        const txnsByYear: Record<string, any[]> = {};
        txns.forEach(t => {
          let dateVal = t.date;
          let dateStr = '';

          // Handle Firestore Timestamp or other date formats
          if (dateVal && typeof dateVal === 'object' && 'seconds' in dateVal) {
            // It's likely a Firestore Timestamp
            dateStr = new Date(dateVal.seconds * 1000).toISOString().split('T')[0];
          } else if (dateVal instanceof Date) {
            dateStr = dateVal.toISOString().split('T')[0];
          } else if (typeof dateVal === 'string') {
            dateStr = dateVal;
          }

          if (!dateStr) return;
          const year = dateStr.split('-')[0];
          if (!txnsByYear[year]) txnsByYear[year] = [];

          txnsByYear[year].push({
            Date: dateStr,
            Amount: t.amount,
            Type: t.type,
            Category: t.category,
            Reason: t.reason,
            Account_ID: t.accountId
          });
        });

        // Create a sheet for each year, sorted (newest years first usually preferred, or oldest)
        const sortedYears = Object.keys(txnsByYear).sort().reverse();

        sortedYears.forEach(year => {
          // Sort transactions by date within the year
          const yearTxns = txnsByYear[year].sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
          const wsYear = XLSX.utils.json_to_sheet(yearTxns);
          XLSX.utils.book_append_sheet(wb, wsYear, `${year}`);
        });

        // Write file
        XLSX.writeFile(wb, `WealthData_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setExportStatus('idle');
      alert(`Failed to export data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    if (!confirm('DANGER: This will PERMANENTLY DELETE all your transactions, accounts, cards, and balances. This action cannot be undone.')) return;
    setResetStatus('resetting');
    try {
      const collections = ['transactions', 'balances', 'cards', 'accounts'];
      for (const colName of collections) {
        const q = query(collection(db, colName), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const batchSize = 400;
        for (let i = 0; i < snapshot.docs.length; i += batchSize) {
          const batch = writeBatch(db);
          snapshot.docs.slice(i, i + batchSize).forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }
      setResetStatus('completed');
      setTimeout(() => setResetStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setResetStatus('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 min-h-screen">
      <div className="flex items-center space-x-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transform transition-transform hover:scale-110">
          <SettingsIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-theme-primary tracking-tight">Settings</h1>
          <p className="text-theme-muted font-medium">Manage your wealth profile and data control</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Recurring Items Manager */}
        <section className="bg-theme-card rounded-3xl shadow-xl border border-theme flex flex-col hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
          <div className="p-8 border-b border-theme bg-theme-muted/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-theme-primary">Recurring Items Manager</h2>
            </div>
            <p className="text-theme-muted mt-2">Manage your subscriptions, recurring income, and automated bills.</p>
          </div>
          <div className="p-2">
            <RecurringItemsManager isEmbedded={true} />
          </div>
        </section>

        {/* Budget & Profile Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Expenditure Levels */}
          <section className="bg-theme-card rounded-3xl p-8 shadow-xl border border-theme flex flex-col hover:shadow-2xl transition-shadow duration-300 max-h-[600px] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-theme-primary">Expenditure Levels</h2>
            </div>
            <p className="text-theme-muted mb-4 font-medium text-sm flex justify-between items-center">
              <span>Configure up to 5 budget levels to receive alerts as you reach them.</span>
              {budgetConfig.lastUpdated && (
                <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                  Synced: {new Date(budgetConfig.lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
            <form onSubmit={handleUpdateBudgetLevels} className="space-y-3 flex-1">
              {tempLevels.map((level, index) => (
                <div key={index} className="space-y-0.5">
                  <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest ml-1">Level {index + 1} Limit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted font-bold">$</span>
                    <input
                      type="number"
                      value={level || ''}
                      onChange={e => {
                        const newLevels = [...tempLevels];
                        const val = parseFloat(e.target.value);
                        newLevels[index] = isNaN(val) ? 0 : val;
                        setTempLevels(newLevels);
                      }}
                      className="w-full pl-8 pr-5 py-3 bg-theme-muted border border-theme text-theme-primary rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={budgetStatus === 'saving'}
                className={`w-full py-3 mt-2 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-200 active:scale-[0.98] ${budgetStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {budgetStatus === 'saving' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                ) : budgetStatus === 'success' ? (
                  <><CheckCircle className="w-5 h-5" /> <span>Updated Levels</span></>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Update Budget Levels</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Profile */}
          <section className="bg-theme-card rounded-3xl p-8 shadow-xl border border-theme flex flex-col hover:shadow-2xl transition-shadow duration-300 max-h-[600px] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-theme-primary">Profile</h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-bold text-theme-muted uppercase tracking-wider ml-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-5 py-2 bg-theme-muted border border-theme text-theme-primary rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-theme-muted uppercase tracking-wider ml-1">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-5 py-2 bg-theme-muted border border-theme text-theme-muted rounded-2xl cursor-not-allowed font-medium opacity-60 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={profileStatus === 'saving'}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-200 active:scale-[0.98] ${profileStatus === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {profileStatus === 'saving' ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                ) : profileStatus === 'success' ? (
                  <><CheckCircle className="w-5 h-5" /> <span>Saved Successfully</span></>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        {/* Preferences */}
        <section className="bg-theme-card rounded-3xl p-8 shadow-xl border border-theme hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-theme-primary">Preferences</h2>
          </div>
          <div className="p-5 bg-theme-muted border border-theme rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Globe className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-bold text-theme-primary">Currency</p>
                <p className="text-xs text-theme-muted">Regional formatting</p>
              </div>
            </div>
            <select
              value={selectedCurrency.code}
              onChange={(e) => {
                const currency = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                if (currency) setSelectedCurrency(currency);
              }}
              className="bg-theme-card px-3 py-1.5 border border-theme rounded-xl font-bold text-theme-primary outline-none"
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
          </div>
        </section>

        {/* Data Control */}
        <section className="bg-theme-card rounded-3xl p-8 shadow-xl border border-theme overflow-hidden hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-10">
            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-theme-primary">Data Control</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-theme-muted border-2 border-dashed border-theme rounded-3xl space-y-6">
              <div className="flex items-center space-x-3">
                <Download className="w-6 h-6 text-blue-500" />
                <h3 className="text-xl font-bold text-theme-primary">Data Export</h3>
              </div>
              <p className="text-theme-muted font-medium leading-relaxed">Download your secure backup or use your data with external tools.</p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleExportData('json')}
                  disabled={exportStatus === 'exporting'}
                  className="flex-1 py-4 bg-theme-card border border-theme text-theme-primary rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <FileJson className="w-5 h-5 text-blue-500" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={() => handleExportData('excel')}
                  disabled={exportStatus === 'exporting'}
                  className="flex-1 py-4 bg-theme-card border border-theme text-theme-primary rounded-2xl font-bold hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span>Excel Report</span>
                </button>
              </div>
            </div>
            <div className="p-6 bg-rose-50/50 dark:bg-rose-950/20 border-2 border-dashed border-rose-200 dark:border-rose-900/50 rounded-3xl space-y-6">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6 text-rose-500" />
                <h3 className="text-xl font-bold text-rose-800 dark:text-rose-400">Danger Zone</h3>
              </div>
              <p className="text-rose-700/70 dark:text-rose-400/70 font-medium leading-relaxed">Resetting your account will PERMANENTLY delete all records.</p>
              <button
                onClick={handleResetData}
                disabled={resetStatus === 'resetting'}
                className={`w-full py-4 rounded-2xl font-black text-rose-600 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-900/50 bg-white dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white transition-all transform ${resetStatus === 'completed' ? 'bg-green-500 text-white' : ''}`}
              >
                {resetStatus === 'resetting' ? 'Purging records...' : resetStatus === 'completed' ? 'Account Reset Complete' : 'Full Account Reset'}
              </button>
            </div>
          </div>
        </section>
      </div>
      <footer className="text-center text-theme-muted text-sm font-semibold pt-8 opacity-50">
        Wealth and Finance Manager v2.0 • Build 2026.02
      </footer>
    </div>
  );
};

export default Settings;
