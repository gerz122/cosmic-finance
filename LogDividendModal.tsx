import React, { useState, useEffect, useMemo } from 'react';
import type { Asset, Account, User, Team } from '../types';
import { XIcon } from './icons';

interface LogDividendModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogDividend: (amount: number, accountId: string) => void;
    stock: Asset;
    user: User;
    teams: Team[];
}

export const LogDividendModal: React.FC<LogDividendModalProps> = ({ isOpen, onClose, onLogDividend, stock, user, teams }) => {
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState('');

    const relevantAccounts = useMemo(() => {
        if (stock.teamId) {
            const team = teams.find(t => t.id === stock.teamId);
            return team?.accounts || [];
        }
        return user.accounts;
    }, [stock, user.accounts, teams]);

    useEffect(() => {
        if(isOpen && relevantAccounts.length > 0) {
            setAccountId(relevantAccounts[0].id)
        } else {
            setAccountId('');
        }
    }, [isOpen, relevantAccounts]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0 || !accountId) {
            alert('Please enter a valid dividend amount and select an account.');
            return;
        }

        onLogDividend(numericAmount, accountId);
        setAmount('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-sm shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Log Dividend</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <p className="text-cosmic-text-secondary mb-4">
                    Enter the total dividend amount received from <span className="font-bold text-cosmic-text-primary">{stock.name} ({stock.ticker})</span>.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="dividend-amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Total Dividend Received ($)</label>
                        <input
                            type="number"
                            id="dividend-amount"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="0.01"
                            step="0.01"
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary"
                            required
                            autoFocus
                        />
                    </div>
                     <div>
                        <label htmlFor="account" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Deposit to Account</label>
                        <select 
                            id="account" 
                            value={accountId} 
                            onChange={e => setAccountId(e.target.value)}
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary"
                            required
                        >
                            <option value="" disabled>Select an account</option>
                            {relevantAccounts.map(accountItem => (
                                <option key={accountItem.id} value={accountItem.id}>{accountItem.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">Log Dividend</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
