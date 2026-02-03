'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
// Remove useCurrency if not used

interface SimpleBalanceModalProps {
    title: string;
    initialValue: number;
    onClose: () => void;
    onSave: (newValue: number) => void;
}

export const SimpleBalanceModal: React.FC<SimpleBalanceModalProps> = ({
    title,
    initialValue,
    onClose,
    onSave
}) => {
    const [value, setValue] = useState(initialValue.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const numValue = parseFloat(value) || 0;
            await onSave(numValue);
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                            <input
                                type="number"
                                step="0.01"
                                autoFocus
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl text-3xl font-black text-gray-900 focus:outline-none transition-all"
                                placeholder="0.00"
                                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            />
                        </div>
                        <p className="text-sm text-gray-500 text-center">
                            Enter the new total amount owed to you.
                        </p>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="flex-1 py-3 px-4 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] py-3 px-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-100 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:bg-gray-400 disabled:shadow-none"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            <span>{isSaving ? 'Saving...' : 'Update Total'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
