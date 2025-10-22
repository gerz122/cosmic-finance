import React, { useState, useMemo } from 'react';
import type { User } from '../types';
import { AssetType } from '../types';
import { XIcon } from './icons';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (toUserId: string, amount: number) => void;
    currentUser: User;
    otherUsers: User[];
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onTransfer, currentUser, otherUsers }) => {
    const [amount, setAmount] = useState('');
    const [recipientId, setRecipientId] = useState<string>(otherUsers[0]?.id || '');
    
    const cashBalance = useMemo(() => {
        const cashAsset = currentUser.financialStatement.assets.find(a => a.type === AssetType.CASH);
        return cashAsset ? cashAsset.value : 0;
    }, [currentUser]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!recipientId || !numericAmount || numericAmount <= 0) {
            alert('Please select a recipient and enter a valid amount.');
            return;
        }
        if (numericAmount > cashBalance) {
            alert('Insufficient funds. You cannot transfer more than your cash balance.');
            return;
        }

        onTransfer(recipientId, numericAmount);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Transfer Cash</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <p className="text-sm text-cosmic-text-secondary">Your available cash balance: <span className="font-bold text-cosmic-primary">${cashBalance.toFixed(2)}</span></p>
                    </div>
                    <div>
                        <label htmlFor="recipient" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Recipient</label>
                        <select 
                            id="recipient" 
                            value={recipientId} 
                            onChange={e => setRecipientId(e.target.value)} 
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary"
                        >
                            {otherUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
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
                            max={cashBalance}
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
