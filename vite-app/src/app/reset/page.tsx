'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear all localStorage data
        localStorage.clear();

        // Set USD as currency
        localStorage.setItem('finance-currency', 'USD');

        // Redirect to import page after 1 second
        setTimeout(() => {
            navigate('/import');
        }, 1000);
    }, [navigate]);

    return (
        <div className="max-w-2xl mx-auto py-16 px-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Resetting Data...</h1>
                <p className="text-gray-600">Setting currency to USD and clearing old data.</p>
                <p className="text-gray-500 text-sm mt-2">Redirecting to import page...</p>
            </div>
        </div>
    );
}
