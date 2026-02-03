import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CardProvider } from './context/CardContext';
import { TransactionProvider } from './context/TransactionContext';
import { BudgetProvider } from './context/BudgetContext';
import { RecurringProvider } from './context/RecurringContext';

// Import Pages (Components)
import Navigation from './components/Navigation';
import Dashboard from './app/page';
import CardsPage from './app/cards/page';
import TransactionsPage from './app/transactions/page';
import AddTransactionPage from './app/add-transaction/page';
import HistoricalPage from './app/historical/page';
import AddAccountPage from './app/add-account/page';

import DisclaimerPage from './app/disclaimer/page';
import Settings from './components/Settings';
import WelcomeScreen from './components/WelcomeScreen';
import ProtectedRoute from './components/ProtectedRoute';

// We need to create wrappers or fix imports in these files later
// For now, let's setup the shell

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-lg">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h1>
          <p className="text-red-700 mb-4">The application encountered an unexpected error.</p>
          <pre className="bg-white p-4 rounded border border-red-100 text-sm text-red-600 overflow-auto">
            {this.state.error?.toString()}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Separate component that has access to auth context
const AppRoutes: React.FC = () => {
  const { isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">Loading...</div>
                <p className="text-gray-400">Please wait while we load your account.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/overview" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/cards" element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
            <Route path="/add-transaction" element={<ProtectedRoute><AddTransactionPage /></ProtectedRoute>} />
            <Route path="/historical" element={<ProtectedRoute><HistoricalPage /></ProtectedRoute>} />
            <Route path="/add-account" element={<ProtectedRoute><AddAccountPage /></ProtectedRoute>} />
            <Route path="/disclaimer" element={<ProtectedRoute><DisclaimerPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  console.log('App component rendering');
  return (
    <Router basename="/Wealth-and-Finance-Manager-2.0">
      <AuthProvider>
        <CurrencyProvider>
          <FinanceProvider>
            <CardProvider>
              <TransactionProvider>
                <BudgetProvider>
                  <RecurringProvider>
                    <AppRoutes />
                  </RecurringProvider>
                </BudgetProvider>
              </TransactionProvider>
            </CardProvider>
          </FinanceProvider>
        </CurrencyProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
