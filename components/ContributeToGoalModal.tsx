import React, { useState, useEffect } from 'react';
import type { Goal, User } from '../types';
import { XIcon } from './icons';

interface ContributeToGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContribute: (goal: Goal, amount: number, fromAccountId: string) => void;
    goal: Goal;
    user: User;
}

export const ContributeToGoalModal: React.FC<ContributeToGoalModalProps> = ({ isOpen, onClose, onContribute, goal, user }) => {
    const [amount, setAmount] = useState('');
    const [fromAccountId, setFromAccountId] = useState('');

    useEffect(() => {
        if (isOpen && user.accounts.length > 0) {
            setFromAccountId(user.accounts[0].id);
        }
    }, [isOpen, user.accounts]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0 || !fromAccountId) {
            alert('Please enter a valid amount and select an account.');
            return;
        }

        const fromAccount = user.accounts.find(acc => acc.id === fromAccountId);
        if (fromAccount && fromAccount.balance < numericAmount) {
            alert('Insufficient funds in the selected account.');
            return;
        }
        
        onContribute(goal, numericAmount, fromAccountId);
        setAmount('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-sm shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Contribute to Goal</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                <p className="text-cosmic-text-secondary mb-4">
                    Contribute to <span className="font-bold text-cosmic-text-primary">{goal.name}</span>
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="contribution-amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Amount ($)</label>
                        <input
                            type="number" id="contribution-amount" value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min="0.01" step="0.01"
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2"
                            required autoFocus
                        />
                    </div>
                    <div>
                        <label htmlFor="from-account" className="block text-sm font-medium text-cosmic-text-secondary mb-1">From Account</label>
                        <select
                            id="from-account" value={fromAccountId}
                            onChange={e => setFromAccountId(e.target.value)}
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2"
                            required
                        >
                             <option value="" disabled>Select an account</option>
                            {user.accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} (${acc.balance.toFixed(2)})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Contribute</button>
                    </div>
                </form>
            </div>
        </div>
    );
};