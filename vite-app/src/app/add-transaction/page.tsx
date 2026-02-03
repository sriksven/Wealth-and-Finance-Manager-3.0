'use client';

import { AddTransactionForm } from '@/components/AddTransactionForm';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AddTransactionPage() {
    return (
        <ProtectedRoute>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Add Transaction
                        </h1>
                        <p className="text-gray-600">Record your daily income and expenses</p>
                    </div>
                    <AddTransactionForm />
                </div>
            </div>
        </ProtectedRoute>
    );
}
