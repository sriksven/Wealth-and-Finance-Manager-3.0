import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

// Based on WelcomeScreen.tsx structure but adapted for Login
const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login();
    } catch (err: unknown) {
      console.error("Login failed", err);
      const error = err as { code?: string; message?: string };
      let msg = "Failed to sign in.";
      if (error.code === 'auth/popup-closed-by-user') msg = "Sign-in cancelled.";
      else if (error.code === 'auth/unauthorized-domain') msg = "Domain not authorized in Firebase.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">👋</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Personal Finance Tracker!</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Take control of your finances with a simple, private, and secure balance sheet tracker.
            </p>
          </div>

          {/* Cloud Sync Banner (Updated for Firebase) */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 mb-8 transform hover:scale-[1.01] transition-transform">
            <div className="flex items-center justify-center flex-col sm:flex-row text-center sm:text-left">
              <span className="text-3xl mr-0 sm:mr-4 mb-2 sm:mb-0">☁️</span>
              <div>
                <h2 className="text-lg font-bold text-blue-800">Cloud Sync Enabled (Firebase v2.0)</h2>
                <p className="mt-1 text-blue-700">
                  Your data syncs automatically to the secure Cloud Database across all devices.
                </p>
              </div>
            </div>
          </div>

          {/* Login Action Area (Replaces "Gets Started" buttons) */}
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl mb-8 border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-6">Get Started Now</h3>

            {error && (
              <div className="mb-4 bg-red-100 text-red-700 px-4 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full sm:w-auto flex justify-center py-4 px-8 border border-transparent text-lg font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 shadow-lg transition-all"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {/* Google Icon */}
                <div className="bg-white rounded-full p-1 ml-1">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
              </span>
              <span className="pl-8">{loading ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
            <p className="mt-4 text-sm text-gray-500">Secure access via your Google account</p>
          </div>

          {/* Key Features (Restored from Legacy) */}
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-6 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center"><span className="mr-2">📊</span> Complete balance sheet view</div>
              <div className="flex items-center"><span className="mr-2">📈</span> Historical progress tracking</div>
              <div className="flex items-center"><span className="mr-2">💰</span> Multiple account categories</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center"><span className="mr-2">🔒</span> Complete privacy & security (RLS)</div>
              <div className="flex items-center"><span className="mr-2">☁️</span> Real-time Firebase Sync</div>
              <div className="flex items-center"><span className="mr-2">📱</span> Mobile-friendly design</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
