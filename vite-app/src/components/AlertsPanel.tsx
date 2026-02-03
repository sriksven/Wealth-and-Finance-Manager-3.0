'use client';

import React from 'react';
import { useBudgets } from '@/context/BudgetContext';
import { AlertCircle, X, CheckCircle2, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface AlertsPanelProps {
    onClose: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ onClose }) => {
    const { alerts, clearAlert, markAlertAsRead } = useBudgets();

    const unreadCount = alerts.filter(a => !a.isRead).length;

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h2 className="font-bold text-gray-900">Alerts & Notifications</h2>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} NEW
                        </span>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <CheckCircle2 className="w-12 h-12 text-green-100 mb-3" />
                        <p className="text-gray-500 font-medium">All clear!</p>
                        <p className="text-gray-400 text-sm">No active alerts at this time.</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-lg border transition-all ${alert.isRead ? 'bg-white border-gray-100 opacity-80' : 'bg-blue-50 border-blue-100 shadow-sm'
                                }`}
                            onClick={() => markAlertAsRead(alert.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-full ${alert.type === 'budget_level' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{alert.title}</h3>
                                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{alert.message}</p>
                                        <p className="text-[10px] text-gray-400 mt-2">
                                            {format(new Date(alert.date), 'MMM d, h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearAlert(alert.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {alerts.length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <button
                        onClick={() => alerts.forEach(a => markAlertAsRead(a.id))}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                        Mark all as read
                    </button>
                </div>
            )}
        </div>
    );
};
