import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBudgets } from '@/context/BudgetContext';
import { AlertsPanel } from './AlertsPanel';
import { Bell } from 'lucide-react';

const Navigation: React.FC = () => {
  const { user, isLoading, isAuthConfigured, logout, login } = useAuth();
  const location = useLocation();
  const pathname = location.pathname;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email ?? 'User';
  const photoURL = user?.photoURL;
  const initial = displayName.charAt(0).toUpperCase();

  const { alerts } = useBudgets();
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const alertsPanelRef = useRef<HTMLDivElement | null>(null);
  const unreadAlertsCount = alerts.filter(a => !a.isRead).length;

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileMenuOpen(false);
      setIsMobileMenuOpen(false);
      // Navigate to landing page after logout
      window.location.href = '/Wealth-and-Finance-Manager-2.0/welcome';
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const navItems = [
    { href: '/overview', label: 'Overview', icon: '📊' },
    { href: '/transactions', label: 'Daily Ledger', icon: '🧾' },

    { href: '/add-transaction', label: 'Quick Add', icon: '💵' },
    { href: '/historical', label: 'Growth Trends', icon: '📈' },
    { href: '/cards', label: 'Cards & Wallets', icon: '💳' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen || isAlertsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen, isAlertsOpen]);

  if (isLoading) {
    return null;
  }
  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📈</span>
            <span className="text-xl font-bold text-gray-800 hidden sm:block">Wealth and Finance Manager</span>
            <span className="text-lg font-bold text-gray-800 sm:hidden">Wealth Manager</span>
          </div>

          {/* Desktop Navigation */}
          {(user || !isAuthConfigured) && (
            <div className="hidden md:flex space-x-1 items-center">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Alerts Bell */}
              <div className="relative ml-4" ref={alertsPanelRef}>
                <button
                  onClick={() => setIsAlertsOpen(!isAlertsOpen)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-all focus:outline-none relative"
                  title="Alerts & Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadAlertsCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-2 border-white">
                      {unreadAlertsCount}
                    </span>
                  )}
                </button>
                {isAlertsOpen && (
                  <div className="absolute right-0 mt-2 w-80 h-[450px] z-50">
                    <AlertsPanel onClose={() => setIsAlertsOpen(false)} />
                  </div>
                )}
              </div>

              {/* Profile menu */}
              {isAuthConfigured && user && (
                <div className="relative ml-2" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-all focus:outline-none"
                  >
                    {photoURL ? (
                      <img
                        src={photoURL as string}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="rounded-full border border-gray-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                        {initial}
                      </div>
                    )}
                  </button>
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="mt-1 text-sm font-semibold text-gray-800">{displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <Link
                          to="/disclaimer"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Privacy
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile ... (truncated for brevity in diff, but apply same logic) */}



          {/* Login Button - shown when Auth0 is configured but user is NOT logged in */}
          {!user && isAuthConfigured && (
            <div className="hidden md:block">
              <button
                onClick={login}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Log In
              </button>
            </div>
          )}


          {/* Mobile Menu Button - shown when user logged in OR in offline mode */}
          {(user || !isAuthConfigured) && (
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t">
            <div className="flex items-center space-x-3 px-3 py-3 rounded-md bg-white border border-gray-200">
              {photoURL ? (
                <img src={photoURL} alt="Profile" width={40} height={40} className="rounded-full border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border border-blue-700">
                  {initial}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm text-gray-500">Signed in as</span>
                <span className="text-sm font-semibold text-gray-800">{displayName}</span>
                <span className="text-xs text-gray-500">{displayEmail}</span>
              </div>
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${isActive
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/settings"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            >
              <span className="text-lg">⚙️</span>
              <span>Settings</span>
            </Link>
            <Link
              to="/disclaimer"
              onClick={closeMobileMenu}
              className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            >
              <span className="text-lg">📋</span>
              <span>Privacy</span>
            </Link>
            {/* Only show logout when Auth0 is configured and user is logged in */}
            {isAuthConfigured && user && (
              <button
                onClick={handleLogout}
                className="flex w-full items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              >
                <span className="text-lg">🔒</span>
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;