'use client';

import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';
import transactionsData from '@/data/transactions.json';
import accountsData from '@/data/accounts.json';
import balancesData from '@/data/balances.json';
import cardsData from '@/data/cards.json';

export default function ImportPage() {
    const [status, setStatus] = useState('idle');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState<string[]>([]);

    const importCollection = async (collectionName: string, data: any[], uid: string) => {
        const batchSize = 450;
        const total = data.length;
        let count = 0;

        for (let i = 0; i < total; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = data.slice(i, i + batchSize);

            chunk.forEach((item) => {
                // Use existing ID if available, or generate new
                const docId = item.id || doc(collection(db, collectionName)).id;
                const docRef = doc(db, collectionName, docId);

                // Process item to Ensure strict types
                const processedItem = {
                    ...item,
                    uid: uid,
                    updatedAt: new Date().toISOString()
                };

                // Specific transforms
                if (collectionName === 'balances' && item.date) {
                    processedItem.date = new Date(item.date).toISOString();
                }
                if (collectionName === 'transactions') {
                    processedItem.amount = Number(item.amount) || 0;
                    processedItem.date = item.date ? new Date(item.date).toISOString() : new Date().toISOString();
                }

                batch.set(docRef, processedItem);
            });

            await batch.commit();
            count += chunk.length;
            setLog(prev => [...prev, `Imported ${count}/${total} ${collectionName}...`]);
        }
    };

    const startImport = async () => {
        if (!auth.currentUser) {
            alert('You must be logged in to import data!');
            return;
        }

        if (!confirm(`This will import:\n- ${accountsData.length} Accounts\n- ${balancesData.length} Balances\n- ${cardsData.length} Cards\n- ${transactionsData.length} Transactions\n\nContinue?`)) {
            return;
        }

        setStatus('running');
        setLog([]);
        const uid = auth.currentUser.uid;
        let p = 0;

        try {
            // 1. Import Accounts
            setLog(prev => [...prev, '--- Importing Accounts ---']);
            await importCollection('accounts', accountsData, uid);
            p += 25; setProgress(p);

            // 2. Import Balances
            setLog(prev => [...prev, '--- Importing Balances ---']);
            await importCollection('balances', balancesData, uid);
            p += 25; setProgress(p);

            // 3. Import Cards
            setLog(prev => [...prev, '--- Importing Cards ---']);
            await importCollection('cards', cardsData, uid);
            p += 25; setProgress(p);

            // 4. Import Transactions
            setLog(prev => [...prev, '--- Importing Transactions ---']);
            await importCollection('transactions', transactionsData, uid);
            p += 25; setProgress(p);

            setStatus('completed');
            setLog(prev => [...prev, '✅ All Data Imported Successfully!']);
        } catch (error: unknown) {
            console.error('Import failed', error);
            setStatus('error');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setLog(prev => [...prev, `ERROR: ${errorMessage}`]);
        }
    };

    const handleReset = async () => {
        if (!auth.currentUser) return;

        if (!confirm('⚠️ WARNING: This will delete ALL your data (Accounts, Balances, Cards, Transactions). Are you sure?')) {
            return;
        }

        setStatus('clearing');
        setLog(['Starting cleanup...']);

        try {
            const uid = auth.currentUser.uid;
            const collections = ['accounts', 'balances', 'cards', 'transactions'];

            for (const colName of collections) {
                setLog(prev => [...prev, `Cleaning ${colName}...`]);
                const q = query(collection(db, colName), where('uid', '==', uid));
                const snapshot = await getDocs(q);

                if (snapshot.empty) continue;

                // Delete in chunks
                const batchSize = 450;
                const chunks = [];
                for (let i = 0; i < snapshot.size; i += batchSize) {
                    chunks.push(snapshot.docs.slice(i, i + batchSize));
                }

                for (const chunk of chunks) {
                    const batch = writeBatch(db);
                    chunk.forEach(doc => batch.delete(doc.ref));
                    await batch.commit();
                }
            }

            setStatus('idle');
            setLog(prev => [...prev, '✅ All data deleted successfully.']);
            alert('All data has been deleted.');

        } catch (error) {
            console.error('Delete failed', error);
            setStatus('error');
            setLog(prev => [...prev, `DELETE ERROR: ${(error as Error).message}`]);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Data Migration Tool</h1>

            <div className="bg-gray-100 p-4 rounded mb-4">
                <p><strong>Target User:</strong> {auth.currentUser?.email || 'Not Logged In'}</p>
                <div className="text-sm mt-2 text-gray-600">
                    <div>Accounts: {accountsData.length}</div>
                    <div>Balances: {balancesData.length}</div>
                    <div>Cards: {cardsData.length}</div>
                    <div>Transactions: {transactionsData.length}</div>
                </div>
            </div>

            <div className="flex gap-4">
                {status === 'idle' && (
                    <button
                        onClick={startImport}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
                    >
                        Start Import
                    </button>
                )}

                {(status === 'idle' || status === 'completed') && (
                    <button
                        onClick={handleReset}
                        className="bg-red-100 text-red-700 border border-red-200 px-6 py-2 rounded hover:bg-red-200 font-medium"
                    >
                        🗑️ Delete All Data & Reset
                    </button>
                )}
            </div>

            {(status === 'running' || status === 'clearing') && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="mt-2 text-center">{status === 'clearing' ? 'Deleting data...' : `${progress}% Complete`}</p>
                </div>
            )}

            {status === 'completed' && (
                <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
                    ✅ Import Finished!
                </div>
            )}

            <div className="mt-8 border-t pt-4">
                <h3 className="font-bold mb-2">Log:</h3>
                <pre className="bg-gray-900 text-green-400 p-4 rounded h-64 overflow-auto text-sm">
                    {log.map((l, i) => <div key={i}>{l}</div>)}
                </pre>
            </div>
        </div>
    );
}
