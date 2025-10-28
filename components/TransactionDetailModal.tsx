import React from 'react';
import type { Transaction, User } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';

interface TransactionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction;
    users: User[];
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ isOpen, onClose, transaction, users }) => {
    if (!isOpen) return null;

    const findUser = (id: string) => users.find(u => u.id === id);

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Transaction Details</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-cosmic-bg rounded-lg">
                        <p className="text-sm text-cosmic-text-secondary">Description</p>
                        <p className="text-lg font-semibold text-cosmic-text-primary">{transaction.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-cosmic-bg rounded-lg">
                            <p className="text-sm text-cosmic-text-secondary">Amount</p>
                            <p className={`text-2xl font-bold ${transaction.type === TransactionType.INCOME ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                                {transaction.type === TransactionType.INCOME ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-4 bg-cosmic-bg rounded-lg">
                            <p className="text-sm text-cosmic-text-secondary">Date</p>
                            <p className="text-lg font-semibold text-cosmic-text-primary">{new Date(transaction.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-cosmic-bg rounded-lg">
                            <p className="text-sm text-cosmic-text-secondary">Category</p>
                            <p className="text-lg font-semibold text-cosmic-text-primary">{transaction.category}</p>
                        </div>
                        <div className="p-4 bg-cosmic-bg rounded-lg">
                            <p className="text-sm text-cosmic-text-secondary">Type</p>
                            <p className="text-lg font-semibold text-cosmic-text-primary">{transaction.type}</p>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-cosmic-bg rounded-lg">
                        <h3 className="text-lg font-bold text-cosmic-text-primary mb-2">Split Details</h3>
                        <div className="mt-2 space-y-1">
                            <p className="text-sm text-cosmic-text-secondary">{transaction.type === TransactionType.INCOME ? 'Received by:' : 'Paid by:'}</p>
                            {transaction.paymentShares?.map((share, index) => (
                                 <div key={index} className="flex justify-between text-sm">
                                    <span className="text-cosmic-text-primary">{findUser(share.userId)?.name || 'Unknown User'}</span>
                                    <span className="font-mono text-cosmic-success">${share.amount.toFixed(2)}</span>
                                 </div>
                            ))}
                        </div>
                         {transaction.expenseShares && transaction.expenseShares.length > 0 && (
                            <div className="mt-4 space-y-1">
                                <p className="text-sm text-cosmic-text-secondary">Expense split for:</p>
                                {transaction.expenseShares?.map((share, index) => (
                                     <div key={index} className="flex justify-between text-sm">
                                        <span className="text-cosmic-text-primary">{findUser(share.userId)?.name || 'Unknown User'}</span>
                                        <span className="font-mono text-cosmic-danger">-${share.amount.toFixed(2)}</span>
                                     </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};