import React from 'react';
import type { Transaction, User, Account } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';

interface TransactionSplitDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction;
    allUsers: User[];
    allAccounts: Account[];
}

const DetailRow: React.FC<{ user: User | undefined; accountName?: string; amount: number; isCredit?: boolean }> = ({ user, accountName, amount, isCredit }) => (
    <div className="flex items-center justify-between py-2 border-b border-cosmic-border last:border-b-0">
        <div className="flex items-center gap-3">
            <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full" />
            <div>
                <p className="font-semibold text-cosmic-text-primary">{user?.name || 'Unknown'}</p>
                {accountName && <p className="text-xs text-cosmic-text-secondary">{accountName}</p>}
            </div>
        </div>
        <p className={`font-mono font-semibold text-lg ${isCredit ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
            {isCredit ? '+' : '-'}${amount.toFixed(2)}
        </p>
    </div>
);


export const TransactionSplitDetailModal: React.FC<TransactionSplitDetailModalProps> = ({ isOpen, onClose, transaction, allUsers, allAccounts }) => {
    if (!isOpen) return null;

    const findUser = (id: string) => allUsers.find(u => u.id === id);
    const findAccount = (id: string) => allAccounts.find(a => a.id === id);

    const isExpense = transaction.type === TransactionType.EXPENSE;

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">Transaction Flow</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-3 bg-cosmic-bg rounded-lg mb-4">
                    <p className="text-sm text-cosmic-text-secondary">{transaction.description}</p>
                    <p className={`text-2xl font-bold ${isExpense ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                        ${transaction.amount.toFixed(2)}
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <h3 className="font-bold text-cosmic-text-primary mb-2">{isExpense ? 'Paid From' : 'Received Into'}</h3>
                        <div className="space-y-1">
                            {transaction.paymentShares.map((share, idx) => {
                                const user = findUser(share.userId);
                                const account = findAccount(share.accountId);
                                return <DetailRow key={`pay-${idx}`} user={user} accountName={account?.name} amount={share.amount} isCredit={!isExpense} />;
                            })}
                        </div>
                    </div>
                    
                    {isExpense && transaction.expenseShares && (
                         <div>
                            <h3 className="font-bold text-cosmic-text-primary mb-2">Split For</h3>
                            <div className="space-y-1">
                               {transaction.expenseShares.map((share, idx) => {
                                    const user = findUser(share.userId);
                                    return <DetailRow key={`exp-${idx}`} user={user} amount={share.amount} />;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
