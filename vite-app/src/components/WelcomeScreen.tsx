'use client';

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  TrendingUp,
  Smartphone,
  Cloud,
  ChevronRight,
  Lock,
  PieChart,
  Zap
} from 'lucide-react';

const WelcomeScreen: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in users to overview
  useEffect(() => {
    if (user) {
      navigate('/overview');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-indigo-500" />,
      title: "Private by Design",
      description: "Your financial data is encrypted and remains yours. No selling, no sharing."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
      title: "Wealth Tracking",
      description: "Monitor your net worth, assets, and liabilities with real-time analytics."
    },
    {
      icon: <Cloud className="w-6 h-6 text-blue-500" />,
      title: "Cloud Sync",
      description: "Seamlessly access your data across all your devices with secure cloud sync."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-purple-500" />,
      title: "Mobile Ready",
      description: "A premium mobile experience that puts your finances in your pocket."
    }
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] -mt-8 -mx-4 overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 px-6 sm:px-12 bg-white flex flex-col items-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-300 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 w-80 h-80 bg-cyan-200 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-semibold border border-indigo-100 mb-4 animate-fade-in">
              <Zap className="w-4 h-4" />
              <span>Personal Finance v2.0 is live</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 leading-tight">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Wealth</span> with Confidence.
            </h1>

            <p className="text-xl text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
              A premium, secure, and private personal finance manager designed to give you total control over your financial future.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center lg:justify-start">
              <button
                onClick={() => login()}
                className="group px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50"
                disabled={isLoading}
              >
                <span>{isLoading ? 'Loading...' : 'Get Started Now'}</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="flex items-center space-x-6 pt-8 justify-center lg:justify-start opacity-70">
              <div className="flex items-center space-x-2 text-sm text-slate-500 font-bold">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>SSL SECURED</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500 font-bold">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>PRIVACY FIRST</span>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 italic uppercase tracking-tighter">Premium Features</h2>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-300 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 bg-white shadow-md rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Visualization Section */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
            <div className="bg-indigo-600/5 absolute inset-0 blur-3xl -z-10 rounded-full"></div>
            <div className="p-8 bg-white border border-slate-100 shadow-2xl rounded-3xl space-y-8">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Monthly Snapshot</h4>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">LIVE DATA</span>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="h-4 w-5/6 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-cyan-400 rounded-full"></div>
                </div>
                <div className="h-4 w-2/3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-emerald-400 rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-500">ASSETS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-500">LIABILITIES</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-block p-2 bg-emerald-50 text-emerald-600 rounded-xl mb-2">
              <PieChart className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-extrabold text-slate-900">Visualize Your <span className="italic">Progress</span></h2>
            <p className="text-lg text-slate-600 font-medium lg:max-w-md">
              Gorgeous, interactive charts help you understand your spending habits and net worth growth at a glance.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-indigo-600 font-black">---&gt;</span>
              <span className="text-slate-800 font-extrabold">Instant Financial Clarity</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / CTA Footer */}
      <footer className="py-20 px-6 bg-slate-900 text-white rounded-t-[4rem]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-black italic">Ready to take control?</h2>
          <p className="text-slate-400 text-lg">Join users who are managing their wealth with privacy first.</p>
          <button
            onClick={() => login()}
            className="px-12 py-5 bg-white text-slate-900 rounded-3xl font-black text-xl hover:bg-slate-100 transition-all shadow-2xl active:scale-95"
          >
            Launch Application
          </button>
          <p className="text-slate-500 text-sm font-bold pt-12">Wealth & Finance Manager v2.0 • Build 2026.02</p>
        </div>
      </footer>
    </div>
  );
};

export default WelcomeScreen;
