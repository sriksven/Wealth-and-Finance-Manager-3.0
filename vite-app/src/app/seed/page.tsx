'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SeedDataPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('');

    const seedData = () => {
        setStatus('Seeding data...');

        const accounts = [
            {
                id: 'acc_chase_college_savings',
                name: 'Chase College Savings',
                type: 'asset',
                category: 'Cash and Cash Equivalents',
                createdAt: new Date('2026-01-17').toISOString()
            },
            {
                id: 'acc_bofa_checking',
                name: 'Bank of America Checking',
                type: 'asset',
                category: 'Cash and Cash Equivalents',
                createdAt: new Date('2026-01-17').toISOString()
            },
            {
                id: 'acc_chime_checking',
                name: 'Chime Checking',
                type: 'asset',
                category: 'Cash and Cash Equivalents',
                createdAt: new Date('2026-01-17').toISOString()
            },
            {
                id: 'acc_capital_one_checking',
                name: 'Capital One Checking',
                type: 'asset',
                category: 'Cash and Cash Equivalents',
                createdAt: new Date('2026-01-17').toISOString()
            },
            {
                id: 'acc_capital_one_savings',
                name: 'Capital One Savings',
                type: 'asset',
                category: 'Cash and Cash Equivalents',
                createdAt: new Date('2026-01-17').toISOString()
            }
        ];

        const balances = [
            {
                id: 'bal_chase_1',
                accountId: 'acc_chase_college_savings',
                amount: 2845.05,
                date: new Date('2026-01-17').toISOString()
            },
            {
                id: 'bal_bofa_1',
                accountId: 'acc_bofa_checking',
                amount: 1221.66,
                date: new Date('2026-01-17').toISOString()
            },
            {
                id: 'bal_chime_1',
                accountId: 'acc_chime_checking',
                amount: 56.67,
                date: new Date('2026-01-17').toISOString()
            },
            {
                id: 'bal_capital_checking_1',
                accountId: 'acc_capital_one_checking',
                amount: 238.06,
                date: new Date('2026-01-17').toISOString()
            },
            {
                id: 'bal_capital_savings_1',
                accountId: 'acc_capital_one_savings',
                amount: 16749.63,
                date: new Date('2026-01-17').toISOString()
            }
        ];

        try {
            localStorage.setItem('finance-accounts', JSON.stringify(accounts));
            localStorage.setItem('finance-balances', JSON.stringify(balances));

            const totalNetWorth = balances.reduce((sum, b) => sum + b.amount, 0);

            setStatus(`✅ Success! Added ${accounts.length} accounts and ${balances.length} balances. Total Net Worth: $${totalNetWorth.toFixed(2)}`);

            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (error) {
            setStatus(`❌ Error: ${(error as Error).message}`);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-16 px-4">
            <div className="bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Seed Initial Data</h1>
                <p className="text-gray-600 mb-6">
                    This will add your bank accounts with their current balances:
                </p>

                <div className="space-y-2 mb-8 bg-gray-50 p-4 rounded">
                    <div className="flex justify-between">
                        <span>Chase College Savings</span>
                        <span className="font-semibold">$2,845.05</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Bank of America Checking</span>
                        <span className="font-semibold">$1,221.66</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Chime Checking</span>
                        <span className="font-semibold">$56.67</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Capital One Checking</span>
                        <span className="font-semibold">$238.06</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Capital One Savings</span>
                        <span className="font-semibold">$16,749.63</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total Net Worth</span>
                        <span className="text-green-600">$21,111.07</span>
                    </div>
                </div>

                <button
                    onClick={seedData}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all mb-4"
                >
                    Add Bank Accounts & Balances
                </button>

                {status && (
                    <div className={`p-4 rounded-lg ${status.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
