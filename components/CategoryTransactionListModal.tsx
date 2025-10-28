
import React from 'react';
import type { Transaction } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';

interface CategoryTransactionListModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: string;
    transactions: Transaction[];
}

export const CategoryTransactionListModal: React.FC<CategoryTransactionListModalProps> = ({ isOpen, onClose, category, transactions }) => {
    if (!isOpen) return null;

    const isPassiveFilter = category === 'Passive Income';

    const filteredTransactions = transactions
        .filter(t => {
            if (isPassiveFilter) {
                return t.isPassive === true;
            }
            // Default behavior for expense categories
            return t.category === category && t.type === TransactionType.EXPENSE;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const title = isPassiveFilter ? "Passive Income Sources" : `"${category}" Expenses`;
    const totalLabel = isPassiveFilter ? "Total Passive Income:" : "Total Expenses:";
    const amountColor = isPassiveFilter ? 'text-cosmic-success' : 'text-cosmic-danger';
    const sign = isPassiveFilter ? '+' : '-';

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-cosmic-text-primary">{title}</h2>
                        <p className="text-cosmic-text-secondary">{totalLabel} <span className={`font-bold ${amountColor}`}>${total.toFixed(2)}</span></p>
                    </div>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto space-y-3 pr-2">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(tx => (
                             <div key={tx.id} className="flex justify-between items-center p-3 bg-cosmic-bg rounded-lg">
                                <div>
                                    <p className="font-semibold text-cosmic-text-primary">{tx.description}</p>
                                    <p className="text-sm text-cosmic-text-secondary">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                                <p className={`font-bold text-lg ${amountColor}`}>{sign}${tx.amount.toFixed(2)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-cosmic-text-secondary text-center py-8">No transactions found for this filter.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
