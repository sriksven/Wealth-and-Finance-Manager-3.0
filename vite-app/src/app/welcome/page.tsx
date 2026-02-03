import React from 'react';
import { Link } from 'react-router-dom';

const WelcomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📈</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Personal Finance Tracker</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Take control of your finances with a simple, private, and secure balance sheet tracker
              that keeps all your data local to your browser.
            </p>
          </div>

          {/* Privacy Banner */}
          <div className="bg-green-50 border border-green-200 rounded-md p-6 mb-8">
            <div className="flex items-center justify-center">
              <div className="flex-shrink-0">
                <span className="text-2xl mr-3">🔒</span>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-medium text-green-800">100% Private & Secure</h2>
                <p className="mt-1 text-green-700">
                  Your financial data stays on your device. No servers, no accounts, no data sharing.
                </p>
              </div>
            </div>
          </div>

          {/* Getting Started Steps */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">🚀 Getting Started in 3 Easy Steps</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Step 1 */}
              <div className="bg-blue-50 rounded-lg p-6 text-center">
                <div className="text-3xl mb-4">1️⃣</div>
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Add Your Accounts</h3>
                <p className="text-blue-700 mb-4">
                  Create accounts for your assets (savings, investments), liabilities (loans, credit cards),
                  and equity to build your financial picture.
                </p>
                <Link
                  to="/add-account"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block"
                >
                  Add Account
                </Link>
              </div>

              {/* Step 2 */}
              <div className="bg-purple-50 rounded-lg p-6 text-center">
                <div className="text-3xl mb-4">2️⃣</div>
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Track Progress</h3>
                <p className="text-purple-700 mb-4">
                  View your balance sheet and historical tracking to see your net worth
                  and financial progress over time.
                </p>
                <Link
                  to="/historical"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-block"
                >
                  View Tracking
                </Link>
              </div>
            </div>
          </section>

          {/* Features Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">✨ Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">📊</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Balance Sheet View</h3>
                    <p className="text-gray-600">See all your assets, liabilities, and net worth at a glance</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">📈</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Historical Tracking</h3>
                    <p className="text-gray-600">Track your financial progress with charts and trends over time</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">💰</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Multiple Account Types</h3>
                    <p className="text-gray-600">Support for various asset and liability categories</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">📤</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Data Export/Import</h3>
                    <p className="text-gray-600">Backup and restore your data with easy export/import tools</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">🔒</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Complete Privacy</h3>
                    <p className="text-gray-600">All data stored locally - no servers, no tracking, no accounts</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="text-2xl mr-3 mt-1">📱</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Mobile Friendly</h3>
                    <p className="text-gray-600">Works perfectly on desktop, tablet, and mobile devices</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Account Categories Guide */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">📝 Account Categories Guide</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-3">💚 Assets</h3>
                <p className="text-green-700 text-sm mb-3">Things you own that have value:</p>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Cash & Savings Accounts</li>
                  <li>• Investment Accounts</li>
                  <li>• Real Estate</li>
                  <li>• Personal Property</li>
                  <li>• Retirement Accounts</li>
                </ul>
              </div>
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">❤️ Liabilities</h3>
                <p className="text-red-700 text-sm mb-3">Money you owe to others:</p>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Credit Card Debt</li>
                  <li>• Student Loans</li>
                  <li>• Car Loans</li>
                  <li>• Mortgages</li>
                  <li>• Personal Loans</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">💙 Equity</h3>
                <p className="text-blue-700 text-sm mb-3">Your net worth calculation:</p>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Total Assets minus Liabilities</li>
                  <li>• Automatically calculated</li>
                  <li>• Track wealth building progress</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Important Tips */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">💡 Important Tips</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
              <ul className="space-y-3 text-yellow-800">
                <li className="flex items-start">
                  <span className="font-bold mr-2">💾</span>
                  <span><strong>Regular Backups:</strong> Export your data regularly using the Settings page to prevent data loss.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">🔄</span>
                  <span><strong>Update Regularly:</strong> Record new balances monthly or quarterly to track your progress.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">🎯</span>
                  <span><strong>Be Accurate:</strong> Use actual account balances for the most useful financial picture.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">📱</span>
                  <span><strong>Browser Specific:</strong> Data is tied to this specific browser - bookmark this site!</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
            <Link
              to="/add-account"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors text-center flex-1"
            >
              🚀 Start by Adding an Account
            </Link>
            <Link
              to="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md font-medium transition-colors text-center"
            >
              📊 View Balance Sheet
            </Link>
            <Link
              to="/disclaimer"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-colors text-center"
            >
              📋 Read Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
