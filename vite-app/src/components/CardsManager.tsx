'use client';

import React, { useState } from 'react';
import { useCards } from '@/context/CardContext';
import { useCurrency } from '@/context/CurrencyContext';
import type { CreditCard } from '@/types/card';

export default function CardsManager() {
    const { cards, addCard, updateCard, deleteCard } = useCards();
    const { formatCurrency } = useCurrency();
    const [isAdding, setIsAdding] = useState(false);
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [newCard, setNewCard] = useState<{
        name: string;
        type: 'credit' | 'debit';
        bank: string;
        creditLimit: number;
        lastFour: string;
        expiryDate: string;
    }>({
        name: '',
        type: 'credit',
        bank: '',
        creditLimit: 0,
        lastFour: '',
        expiryDate: '',
    });

    const handleEdit = (card: CreditCard) => {
        setEditingCard(card.id);
        setNewCard({
            name: card.name,
            type: card.type,
            bank: card.bank,
            creditLimit: card.type === 'credit' ? card.creditLimit : card.currentBalance,
            lastFour: card.lastFour,
            expiryDate: card.expiryDate,
        });
        setIsAdding(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const isCredit = newCard.type === 'credit';
        const limit = isCredit ? newCard.creditLimit : 0;
        const balance = isCredit ? 0 : newCard.creditLimit;
        const available = isCredit ? limit : balance;

        if (editingCard) {
            // Update existing card
            updateCard(editingCard, {
                name: newCard.name,
                type: newCard.type,
                bank: newCard.bank,
                creditLimit: limit,
                lastFour: newCard.lastFour,
                expiryDate: newCard.expiryDate,
            });
            setEditingCard(null);
        } else {
            // Add new card
            addCard({
                ...newCard,
                creditLimit: limit,
                currentBalance: balance,
                availableCredit: available,
                isActive: true,
            });
        }

        setIsAdding(false);
        setNewCard({
            name: '',
            type: 'credit',
            bank: '',
            creditLimit: 0,
            lastFour: '',
            expiryDate: '',
        });
    };

    const getUtilizationColor = (balance: number, limit: number) => {
        const usage = (balance / limit) * 100;
        if (usage < 30) return 'bg-green-500';
        if (usage < 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">My Cards</h2>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        if (isAdding) {
                            setEditingCard(null);
                            setNewCard({
                                name: '',
                                type: 'credit',
                                bank: '',
                                creditLimit: 0,
                                lastFour: '',
                                expiryDate: '',
                            });
                        }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    {isAdding ? 'Cancel' : '+ Add Card'}
                </button>
            </div>

            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm animate-fade-in">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">{editingCard ? 'Edit Card' : 'Add New Card'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Card Name (e.g., Sapphire Reserve)</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newCard.name}
                                onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newCard.bank}
                                onChange={e => setNewCard({ ...newCard, bank: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Card Type</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newCard.type}
                                onChange={e => setNewCard({ ...newCard, type: e.target.value as 'credit' | 'debit' })}
                            >
                                <option value="credit">Credit Card</option>
                                <option value="debit">Debit Card</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                {newCard.type === 'credit' ? 'Credit Limit' : 'Current Balance'}
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newCard.creditLimit}
                                onChange={e => setNewCard({ ...newCard, creditLimit: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last 4 Digits</label>
                            <input
                                type="text"
                                maxLength={4}
                                required
                                pattern="\d{4}"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newCard.lastFour}
                                onChange={e => setNewCard({ ...newCard, lastFour: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Expiry Date (MM/YY)</label>
                            <input
                                type="text"
                                placeholder="MM/YY"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                                value={newCard.expiryDate}
                                onChange={e => setNewCard({ ...newCard, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition font-semibold"
                    >
                        Save Card
                    </button>
                </form>
            )}

            {cards.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">No cards added yet.</p>
                    <p className="text-gray-400">Add credit or debit cards to track your spending limits.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {cards.map((card) => (
                        <div key={card.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100 relative">
                            {/* Action Buttons */}
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    onClick={() => handleEdit(card)}
                                    className="text-gray-400 hover:text-blue-500 p-1 bg-white rounded-full shadow-sm"
                                    title="Edit Card"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => deleteCard(card.id)}
                                    className="text-gray-400 hover:text-red-500 p-1 bg-white rounded-full shadow-sm"
                                    title="Remove Card"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Card Visual Header */}
                            <div className={`px-6 pb-6 pt-12 text-white bg-gradient-to-r ${card.type === 'credit' ? 'from-slate-700 to-slate-900' : 'from-blue-600 to-blue-800'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-xl tracking-wide">{card.bank}</h3>
                                        <p className="text-sm opacity-80">{card.name}</p>
                                    </div>
                                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                                        {card.type}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="font-mono text-lg tracking-widest opacity-90">
                                        **** **** **** {card.lastFour}
                                    </div>
                                    <div className="text-sm opacity-80 font-mono">
                                        {card.expiryDate}
                                    </div>
                                </div>
                            </div>

                            {/* Card Stats */}
                            <div className="p-6">
                                {card.type === 'credit' ? (
                                    <>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-1 text-gray-600 font-medium">
                                                <span>Utilization</span>
                                                <span>{((card.currentBalance / card.creditLimit) * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full ${getUtilizationColor(card.currentBalance, card.creditLimit)} transition-all duration-500`}
                                                    style={{ width: `${Math.min((card.currentBalance / card.creditLimit) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-center divide-x divide-gray-100">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-semibold">Balance</div>
                                                <div className="text-lg font-bold text-gray-800 mt-1">
                                                    {formatCurrency(card.currentBalance)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-semibold">Available</div>
                                                <div className="text-lg font-bold text-green-600 mt-1">
                                                    {formatCurrency(card.availableCredit)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase font-semibold">Limit</div>
                                                <div className="text-lg font-bold text-gray-600 mt-1">
                                                    {formatCurrency(card.creditLimit)}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Current Balance</div>
                                        <div className="text-3xl font-bold text-gray-800 mt-2">
                                            {formatCurrency(card.currentBalance)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
