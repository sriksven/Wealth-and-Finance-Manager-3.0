import React, { useState, useMemo } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useRecurring } from '@/context/RecurringContext';
import { Repeat, X, Plus, Calendar } from 'lucide-react';

interface CalendarModalProps {
    onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ onClose }) => {
    const { transactions } = useTransactions();
    const { recurringItems } = useRecurring();
    const { formatCurrency } = useCurrency();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const calendarData = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const startDayOfWeek = firstDayOfMonth.getDay();
        const days = [];
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [currentMonth, currentYear]);

    const calendarCellData = useMemo(() => {
        const data: Record<number, {
            income: number,
            expense: number,
            txnCount: number,
            transactions: any[],
            recurring: { name: string, amount: number, type: string }[]
        }> = {};

        transactions.forEach(txn => {
            const txnDate = new Date(txn.date);
            if (txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear) {
                const day = txnDate.getDate();
                if (!data[day]) data[day] = { income: 0, expense: 0, txnCount: 0, transactions: [], recurring: [] };
                if (txn.type === 'income') data[day].income += txn.amount;
                if (txn.type === 'expense') data[day].expense += txn.amount;
                data[day].transactions.push(txn);
                data[day].txnCount++;
            }
        });

        recurringItems.forEach(item => {
            const dueDate = new Date(item.nextDueDate);
            if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
                const day = dueDate.getDate();
                if (!data[day]) data[day] = { income: 0, expense: 0, txnCount: 0, transactions: [], recurring: [] };
                data[day].recurring.push({
                    name: item.name,
                    amount: item.amount,
                    type: item.type
                });
            }
        });
        return data;
    }, [transactions, recurringItems, currentMonth, currentYear]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col animate-fade-in-up">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {monthNames[currentMonth]} {currentYear}
                        </h2>
                        <div className="flex gap-1">
                            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded text-gray-600">◀</button>
                            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded text-gray-600">▶</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 p-4 overflow-hidden flex gap-4">
                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-7 gap-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="text-center font-bold text-gray-400 text-sm py-2">{d}</div>
                            ))}
                            {calendarData.map((day, i) => {
                                if (day === null) return <div key={`empty-${i}`} className="bg-gray-50/50 rounded-xl border border-transparent"></div>;
                                const cellStats = calendarCellData[day];
                                const isSelected = selectedDay === day;

                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDay(day)}
                                        className={`bg-white border rounded-xl p-2 cursor-pointer transition-all flex flex-col min-h-[110px] relative group ${isSelected
                                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md transform scale-[1.02] z-10'
                                            : 'border-gray-100 hover:border-blue-300 hover:shadow-lg'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-xs font-black transition-colors ${isSelected ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`}>
                                                    {day}
                                                </span>
                                                {cellStats && cellStats.txnCount > 0 && (
                                                    <div className="flex gap-0.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />
                                                        {cellStats.txnCount > 1 && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {cellStats && cellStats.txnCount > 0 && (
                                                <span className={`text-[9px] px-1 rounded font-bold ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {cellStats.txnCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-end gap-1 mt-1 overflow-hidden">
                                            {cellStats && (
                                                <>
                                                    {cellStats.recurring.slice(0, 2).map((rec, idx) => (
                                                        <div key={idx} className={`text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-1 border truncate ${rec.type === 'income' ? 'bg-green-100/50 border-green-200 text-green-800' : 'bg-blue-100/50 border-blue-200 text-blue-800'
                                                            }`}>
                                                            <Repeat className="w-2 h-2" />
                                                            <span className="truncate">{rec.name}</span>
                                                        </div>
                                                    ))}
                                                    {cellStats.recurring.length > 2 && (
                                                        <div className="text-[8px] text-gray-400 font-bold px-1">+ {cellStats.recurring.length - 2} more</div>
                                                    )}
                                                    {cellStats.income > 0 && (
                                                        <div className="text-[10px] bg-green-500 text-white font-bold px-1.5 py-0.5 rounded shadow-sm flex justify-between">
                                                            <span>IN</span>
                                                            <span className="truncate">{formatCurrency(cellStats.income)}</span>
                                                        </div>
                                                    )}
                                                    {cellStats.expense > 0 && (
                                                        <div className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded shadow-sm flex justify-between">
                                                            <span>OUT</span>
                                                            <span className="truncate">{formatCurrency(cellStats.expense)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Day Details Panel */}
                    <div className="w-80 bg-gray-50 rounded-xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in">
                        {selectedDay ? (
                            <>
                                <div className="p-4 border-b border-gray-200 bg-white">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {monthNames[currentMonth]} {selectedDay}, {currentYear}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">Daily Summary</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {/* Summary Stats */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                                            <p className="text-[10px] text-green-600 font-bold uppercase">Income</p>
                                            <p className="text-sm font-black text-green-700">{formatCurrency(calendarCellData[selectedDay]?.income || 0)}</p>
                                        </div>
                                        <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                                            <p className="text-[10px] text-rose-600 font-bold uppercase">Expenses</p>
                                            <p className="text-sm font-black text-rose-700">{formatCurrency(calendarCellData[selectedDay]?.expense || 0)}</p>
                                        </div>
                                    </div>

                                    {/* Transactions List */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Transactions</h4>
                                        {calendarCellData[selectedDay]?.transactions?.length > 0 ? (
                                            calendarCellData[selectedDay].transactions.map((txn, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                                                    <div className="min-w-0 flex-1 mr-2">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{txn.reason || txn.category}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{txn.category} • {txn.time}</p>
                                                    </div>
                                                    <span className={`text-sm font-black whitespace-nowrap ${txn.type === 'income' ? 'text-green-600' : 'text-rose-600'}`}>
                                                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 text-center py-4 italic">No transactions recorded</p>
                                        )}
                                    </div>

                                    {/* Recurring List */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Recurring Items</h4>
                                        {calendarCellData[selectedDay]?.recurring?.length > 0 ? (
                                            calendarCellData[selectedDay].recurring.map((rec, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-purple-200 transition-all">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                                                        <Repeat className="w-3 h-3 text-purple-500 shrink-0" />
                                                        <p className="text-sm font-bold text-gray-900 truncate">{rec.name}</p>
                                                    </div>
                                                    <span className="text-sm font-black text-gray-700 whitespace-nowrap">
                                                        {formatCurrency(rec.amount)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 text-center py-4 italic">No recurring items due</p>
                                        )}
                                    </div>
                                </div>
                                <div className="p-4 bg-white border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            // Handle redirection or modal opening for adding transaction on this day
                                            alert("Feature coming soon: Add transaction for specific date");
                                        }}
                                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Transaction
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                    <Calendar className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Select a date</h3>
                                <p className="text-xs text-gray-400">Click on any day in the calendar to view detailed transaction history and summaries.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
