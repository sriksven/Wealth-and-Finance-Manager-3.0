'use client';

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isAuthConfigured } = useAuth();

  // If Auth0 is not configured, bypass login and show WelcomeScreen for new users
  // This allows the app to work in offline-only mode for developers
  if (!isAuthConfigured) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">Loading...</div>
            <p className="text-gray-400">Please wait while we authenticate you.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
