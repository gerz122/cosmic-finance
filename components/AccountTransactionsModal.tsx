import React, { useMemo } from 'react';
import type { Transaction, Account } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';

interface AccountTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account;
    allTransactions: Transaction[];
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
}

const TransactionRow: React.FC<{ tx: Transaction, onEdit: () => void, onDelete: () => void }> = ({ tx, onEdit, onDelete }) => {
    const isIncome = tx.type === TransactionType.INCOME;
    return (
        <div className="flex justify-between items-center p-3 bg-cosmic-bg rounded-lg group">
            <div>
                <p className="font-semibold text-cosmic-text-primary">{tx.description}</p>
                <p className="text-sm text-cosmic-text-secondary">{new Date(tx.date).toLocaleDateString()} &bull; {tx.category}</p>
            </div>
            <div className="flex items-center gap-4">
                <p className={`font-bold text-lg ${isIncome ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                    {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
                </p>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <button onClick={onEdit} className="text-yellow-500 hover:underline text-xs font-semibold">EDIT</button>
                    <button onClick={onDelete} className="text-red-500 hover:underline text-xs font-semibold">DEL</button>
                </div>
            </div>
        </div>
    );
};


export const AccountTransactionsModal: React.FC<AccountTransactionsModalProps> = ({ 
    isOpen, onClose, account, allTransactions, onEditTransaction, onDeleteTransaction 
}) => {
    if (!isOpen) return null;

    const filteredTransactions = useMemo(() => {
        return allTransactions
            .filter(tx => tx.paymentShares.some(ps => ps.accountId === account.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allTransactions, account.id]);
    
    const balanceColor = account.balance >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger';

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-2xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-cosmic-text-primary">{account.name}</h2>
                        <p className="text-cosmic-text-secondary">Current Balance: <span className={`font-bold ${balanceColor}`}>${account.balance.toFixed(2)}</span></p>
                    </div>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-y-auto space-y-3 pr-2">
                    {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(tx => (
                           <TransactionRow 
                                key={tx.id} 
                                tx={tx} 
                                onEdit={() => onEditTransaction(tx)} 
                                onDelete={() => onDeleteTransaction(tx.id)} 
                            />
                        ))
                    ) : (
                        <p className="text-cosmic-text-secondary text-center py-8">No transactions found for this account.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
