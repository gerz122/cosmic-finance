import React, { useState } from 'react';
import type { Account } from '../types';
import { AccountType } from '../types';
import { XIcon } from './icons';

interface AddAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddAccount: (account: Omit<Account, 'id' | 'ownerIds'>) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({ isOpen, onClose, onAddAccount }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.CHECKING);
    const [balance, setBalance] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !type) {
            alert('Please fill out all fields.');
            return;
        }

        onAddAccount({
            name,
            type,
            balance: parseFloat(balance) || 0,
        });
        setName('');
        setType(AccountType.CHECKING);
        setBalance('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Add New Account</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Account Name</label>
                        <input type="text" id="accountName" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                    </div>
                    <div>
                        <label htmlFor="accountType" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Account Type</label>
                        <select id="accountType" value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary">
                            {Object.values(AccountType).map(accountType => <option key={accountType} value={accountType}>{accountType}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="initialBalance" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Initial Balance</label>
                        <input type="number" id="initialBalance" value={balance} onChange={e => setBalance(e.target.value)} step="0.01" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" placeholder="0.00" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">Create Account</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
