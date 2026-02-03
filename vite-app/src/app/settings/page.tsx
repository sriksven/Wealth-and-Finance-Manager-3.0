'use client';

import React from 'react';
import Settings from '@/components/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';

const SettingsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
            <Settings />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SettingsPage;
