import React, { useState, useEffect } from 'react';
import type { User, Account } from '../types';
import { XIcon } from './icons';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (fromAccountId: string, toAccountId: string, amount: number) => void;
    currentUser: User;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onTransfer, currentUser }) => {
    const [amount, setAmount] = useState('');
    const [fromAccountId, setFromAccountId] = useState<string>(currentUser.accounts?.[0]?.id || '');
    const [toAccountId, setToAccountId] = useState<string>(currentUser.accounts?.[1]?.id || '');

    useEffect(() => {
        if (isOpen && currentUser.accounts?.length > 0) {
            setFromAccountId(currentUser.accounts[0].id);
            setToAccountId(currentUser.accounts.length > 1 ? currentUser.accounts[1].id : '');
        }
    }, [isOpen, currentUser.accounts]);
    
    const fromAccountBalance = (currentUser.accounts || []).find(a => a.id === fromAccountId)?.balance || 0;

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!fromAccountId || !toAccountId || !numericAmount || numericAmount <= 0) {
            alert('Please select valid accounts and enter a valid amount.');
            return;
        }
        if (numericAmount > fromAccountBalance) {
            alert('Insufficient funds. You cannot transfer more than the account balance.');
            return;
        }
        if (fromAccountId === toAccountId) {
            alert('Cannot transfer to the same account.');
            return;
        }

        onTransfer(fromAccountId, toAccountId, numericAmount);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Transfer Between Accounts</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label htmlFor="fromAccount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">From</label>
                        <select 
                            id="fromAccount" 
                            value={fromAccountId} 
                            onChange={e => setFromAccountId(e.target.value)} 
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                        >
                            {(currentUser.accounts || []).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                         <p className="text-xs text-cosmic-text-secondary mt-1">Balance: <span className="font-bold text-cosmic-primary">${fromAccountBalance.toFixed(2)}</span></p>
                    </div>
                     <div>
                        <label htmlFor="toAccount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">To</label>
                        <select 
                            id="toAccount" 
                            value={toAccountId} 
                            onChange={e => setToAccountId(e.target.value)} 
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                        >
                             {(currentUser.accounts || []).filter(a => a.id !== fromAccountId).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Amount</label>
                        <input 
                            type="number" 
                            id="amount" 
                            value={amount} 
                            onChange={e => setAmount(e.target.value)} 
                            min="0.01" 
                            step="0.01"
                            max={fromAccountBalance}
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" 
                            required 
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">Confirm Transfer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};