import React, { useState, useEffect, useMemo } from 'react';
import type { Account, User, Share, Team } from '../types';
import { AccountType } from '../types';
import { XIcon } from './icons';

interface EditAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Account) => void;
    accountToEdit: Account | null;
    allUsers: User[];
    team?: Team | null;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({ isOpen, onClose, onSave, accountToEdit, allUsers, team }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<AccountType>(AccountType.CHECKING);
    const [shares, setShares] = useState<Share[]>([]);

    useEffect(() => {
        if (isOpen && accountToEdit) {
            setName(accountToEdit.name);
            setType(accountToEdit.type);
            
            if (accountToEdit.shares && accountToEdit.shares.length > 0) {
                 setShares(accountToEdit.shares);
            } else if (accountToEdit.ownerIds.length > 0) {
                 const equalShare = 100 / accountToEdit.ownerIds.length;
                 setShares(accountToEdit.ownerIds.map(ownerId => ({ userId: ownerId, percentage: equalShare })));
            } else {
                setShares([]);
            }
        }
    }, [isOpen, accountToEdit]);

    const totalPercentage = useMemo(() => shares.reduce((sum, share) => sum + (share.percentage || 0), 0), [shares]);

    if (!isOpen || !accountToEdit) return null;

    const handleShareChange = (userId: string, percentage: string) => {
        const numericPercentage = parseFloat(percentage) || 0;
        setShares(currentShares => {
            const newShares = [...currentShares];
            const shareIndex = newShares.findIndex(s => s.userId === userId);
            if (shareIndex > -1) {
                newShares[shareIndex].percentage = numericPercentage;
            }
            return newShares;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            alert('Please provide an account name.');
            return;
        }
        if (accountToEdit.ownerIds.length > 1 && Math.abs(totalPercentage - 100) > 0.1) {
            alert(`Ownership percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
            return;
        }

        const updatedAccount: Account = {
            ...accountToEdit,
            name,
            type,
            shares: accountToEdit.ownerIds.length > 1 ? shares : undefined,
        };

        onSave(updatedAccount);
        onClose();
    };

    const owners = allUsers.filter(u => accountToEdit.ownerIds.includes(u.id));

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Edit Account</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {team && (
                        <div className="p-2 bg-cosmic-bg rounded-md text-sm text-center">
                            <span className="text-cosmic-text-secondary">This is a team account for: </span>
                            <span className="font-bold text-cosmic-primary">{team.name}</span>
                        </div>
                    )}
                    <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Account Name</label>
                        <input type="text" id="accountName" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>
                    <div>
                        <label htmlFor="accountType" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Account Type</label>
                        <select id="accountType" value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2">
                            {Object.values(AccountType).map(accountType => <option key={accountType} value={accountType}>{accountType}</option>)}
                        </select>
                    </div>

                    {accountToEdit.ownerIds.length > 1 && !accountToEdit.teamId && (
                        <div className="space-y-3 pt-3 border-t border-cosmic-border">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-cosmic-text-primary">Ownership Split</h3>
                                <p className={`text-sm font-semibold ${Math.abs(totalPercentage - 100) > 0.1 ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                                    Total: {totalPercentage.toFixed(2)}%
                                </p>
                            </div>
                            <div className="space-y-2">
                                {owners.map(owner => {
                                    const share = shares.find(s => s.userId === owner.id);
                                    return (
                                        <div key={owner.id} className="flex items-center gap-4">
                                            <label className="w-1/3 truncate">{owner.name}</label>
                                            <div className="flex-grow flex items-center">
                                                <input
                                                    type="number"
                                                    value={share?.percentage || ''}
                                                    onChange={e => handleShareChange(owner.id, e.target.value)}
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-right"
                                                />
                                                <span className="ml-2 text-cosmic-text-secondary">%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};