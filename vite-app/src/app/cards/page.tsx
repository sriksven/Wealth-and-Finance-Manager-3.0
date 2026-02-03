'use client';


import ProtectedRoute from '@/components/ProtectedRoute';
import CardsManager from '@/components/CardsManager';

export default function CardsPage() {
    return (
        <ProtectedRoute>
            <div className="max-w-4xl mx-auto py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Wallet & Cards</h1>
                    <p className="text-gray-600">Manage your credit and debit cards, track limits and utilization.</p>
                </div>
                <CardsManager />
            </div>
        </ProtectedRoute>
    );
}
