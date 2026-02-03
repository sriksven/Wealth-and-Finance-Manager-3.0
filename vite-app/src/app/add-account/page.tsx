'use client';

import { AddAccountForm } from '@/components/AddAccountForm';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AddAccountPage() {
  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Add New Account</h1>
            <p className="text-gray-600">Create a new account to track in your balance sheet</p>
          </div>        
          <AddAccountForm />
        </div>
      </div>
    </ProtectedRoute>
  );
}
