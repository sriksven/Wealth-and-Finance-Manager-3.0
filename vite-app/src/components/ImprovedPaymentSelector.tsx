'use client';


import { useFinance } from '@/context/FinanceContext';
import { useCards } from '@/context/CardContext';

interface PaymentSelectorProps {
    value: {
        type: 'bank' | 'card' | 'cash' | 'friend' | '';
        accountId?: string;
        cardId?: string;
    };
    onChange: (selection: { type: 'bank' | 'card' | 'cash' | 'friend' | ''; accountId?: string; cardId?: string }) => void;
    label?: string;
    required?: boolean;
}

export default function ImprovedPaymentSelector({ value, onChange, label = "Payment Method", required = false }: PaymentSelectorProps) {
    const { getAccountsWithBalances } = useFinance();
    const { cards } = useCards();

    const bankAccounts = getAccountsWithBalances().filter(a => a.type === 'asset' && a.category !== 'Money Owed (Friends)');
    const friendAccounts = getAccountsWithBalances().filter(a => a.category === 'Money Owed (Friends)');
    const activeCards = cards.filter(c => c.isActive);

    const handleTypeChange = (newType: 'bank' | 'card' | 'cash' | 'friend' | '') => {
        onChange({ type: newType, accountId: '', cardId: '' });
    };

    const handleAccountChange = (accountId: string) => {
        onChange({ ...value, accountId });
    };

    const handleCardChange = (cardId: string) => {
        onChange({ ...value, cardId });
    };

    return (
        <div className="space-y-3">
            {/* Step 1: Select Type */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <select
                    value={value.type}
                    onChange={(e) => handleTypeChange(e.target.value as 'bank' | 'card' | 'cash' | 'friend' | '')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                    required={required}
                >
                    <option value="">Select Payment Type</option>
                    <option value="bank">🏦 Bank Account</option>
                    <option value="card">💳 Credit/Debit Card</option>
                    <option value="cash">💵 Cash / Other</option>
                    <option value="friend">🤝 Friend / Debt Settled</option>
                </select>
            </div>

            {/* Step 2: Select Specific Account/Card */}
            {value.type === 'bank' && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank Account</label>
                    <select
                        value={value.accountId || ''}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white"
                        required={required}
                    >
                        <option value="">Choose account...</option>
                        {bankAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.name} (${acc.currentBalance.toFixed(2)})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {value.type === 'friend' && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Friend Who Paid</label>
                    {friendAccounts.length > 0 ? (
                        <select
                            value={value.accountId || ''}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            className="w-full px-4 py-2 border border-orange-300 rounded-md focus:ring-2 focus:ring-orange-500 bg-white"
                            required={required}
                        >
                            <option value="">Choose friend...</option>
                            {friendAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.name} (Owes you: ${acc.currentBalance.toFixed(2)})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-sm text-orange-600 bg-orange-100 p-3 rounded-md">
                            No balance-tracking friends found. Add one in <a href="/settings" className="underline font-bold">Accounts</a> with category "Money Owed (Friends)".
                        </div>
                    )}
                </div>
            )}

            {value.type === 'card' && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Card</label>
                    {activeCards.length > 0 ? (
                        <select
                            value={value.cardId || ''}
                            onChange={(e) => handleCardChange(e.target.value)}
                            className="w-full px-4 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 bg-white"
                            required={required}
                        >
                            <option value="">Choose card...</option>
                            {activeCards.map(card => (
                                <option key={card.id} value={card.id}>
                                    {card.bank} {card.name} (..{card.lastFour}) - ${card.currentBalance.toFixed(2)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="text-sm text-red-600 bg-red-100 p-3 rounded-md">
                            No cards found. <a href="/cards" className="underline font-bold">Add a card</a> first.
                        </div>
                    )}
                </div>
            )}

            {value.type === 'cash' && (
                <div className="animate-fade-in">
                    <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
                        ✅ Cash payment selected. No account will be debited.
                    </div>
                </div>
            )}
        </div>
    );
}
