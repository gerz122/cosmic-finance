import React, { useState, useEffect, useMemo } from 'react';
import type { Asset, Liability, Team, User, Share } from '../types';
import { AssetType } from '../types';
import { XIcon } from './icons';

interface AddAssetLiabilityModalProps {
    isOpen: boolean;
    type: 'asset' | 'liability' | null;
    onClose: () => void;
    onSave: (data: Partial<Asset | Liability>, teamId?: string) => void;
    teams: Team[];
    defaultTeamId?: string;
    itemToEdit?: Asset | Liability | null;
    allUsers: User[];
    currentUser: User;
}

export const AddAssetLiabilityModal: React.FC<AddAssetLiabilityModalProps> = ({ isOpen, type, onClose, onSave, teams, defaultTeamId, itemToEdit, allUsers, currentUser }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [assetType, setAssetType] = useState<AssetType>(AssetType.REAL_ESTATE);
    const [monthlyCashflow, setMonthlyCashflow] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [teamId, setTeamId] = useState(defaultTeamId || '');
    const [shares, setShares] = useState<Share[]>([{ userId: currentUser.id, percentage: 100 }]);
    const [isShared, setIsShared] = useState(false);

    const isEditing = !!itemToEdit;

    useEffect(() => {
        if (isOpen) {
            const effectiveTeamId = (isEditing && itemToEdit?.teamId) || defaultTeamId || '';
            setTeamId(effectiveTeamId);
            setIsShared(false); // Reset shared state

            if (isEditing && itemToEdit) {
                setName(itemToEdit.name);
                if (itemToEdit.shares && itemToEdit.shares.length > 1) {
                    setIsShared(true);
                    setShares(itemToEdit.shares);
                } else {
                     setShares([{ userId: currentUser.id, percentage: 100 }])
                }
                
                if ('value' in itemToEdit) { // It's an Asset
                    setValue(String(itemToEdit.value));
                    setAssetType(itemToEdit.type);
                    setMonthlyCashflow(String(itemToEdit.monthlyCashflow || ''));
                } else { // It's a Liability
                    setValue(String(itemToEdit.balance));
                    setInterestRate(String(itemToEdit.interestRate || ''));
                    setMonthlyPayment(String(itemToEdit.monthlyPayment || ''));
                }
            } else {
                // Reset for new item
                setName('');
                setValue('');
                setAssetType(AssetType.REAL_ESTATE);
                setMonthlyCashflow('');
                setInterestRate('');
                setMonthlyPayment('');
                setShares([{ userId: currentUser.id, percentage: 100 }])
            }
        }
    }, [isOpen, itemToEdit, isEditing, defaultTeamId, currentUser.id]);

    const totalPercentage = useMemo(() => shares.reduce((sum, share) => sum + (share.percentage || 0), 0), [shares]);

    if (!isOpen || !type) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !value) {
            alert('Please provide a name and a value/balance.');
            return;
        }
        if (isShared && Math.abs(totalPercentage - 100) > 0.1) {
             alert(`Ownership percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`);
            return;
        }

        let data: Partial<Asset | Liability>;
        const finalShares = isShared && !teamId ? shares : undefined;

        if (type === 'asset') {
            data = { name, type: assetType, value: parseFloat(value), monthlyCashflow: parseFloat(monthlyCashflow) || 0, shares: finalShares };
        } else {
            data = { name, balance: parseFloat(value), interestRate: parseFloat(interestRate) || 0, monthlyPayment: parseFloat(monthlyPayment) || 0, shares: finalShares };
        }
        onSave(data, teamId || undefined);
        onClose();
    };
    
     const handleAddOwner = () => {
        const existingUserIds = shares.map(s => s.userId);
        const nextUser = allUsers.find(u => !existingUserIds.includes(u.id));
        if (nextUser) {
            setShares(prev => [...prev, { userId: nextUser.id, percentage: 0 }]);
        }
    };

    const handleShareChange = (index: number, field: 'userId' | 'percentage', value: string) => {
        const newShares = [...shares];
        if (field === 'percentage') {
            newShares[index].percentage = parseFloat(value) || 0;
        } else {
            newShares[index].userId = value;
        }
        setShares(newShares);
    };

    const handleRemoveOwner = (index: number) => setShares(shares.filter((_, i) => i !== index));

    
    const renderAssetFields = () => (
        <>
            <div>
                <label htmlFor="assetType" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Asset Type</label>
                <select id="assetType" value={assetType} onChange={e => setAssetType(e.target.value as AssetType)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary">
                    {Object.values(AssetType).filter(currentAssetType => currentAssetType !== AssetType.STOCK).map(currentAssetType => <option key={currentAssetType} value={currentAssetType}>{currentAssetType}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="assetValue" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Current Value ($)</label>
                <input type="number" id="assetValue" value={value} onChange={e => setValue(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
            </div>
            <div>
                <label htmlFor="monthlyCashflow" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Monthly Cashflow ($)</label>
                <input type="number" id="monthlyCashflow" value={monthlyCashflow} onChange={e => setMonthlyCashflow(e.target.value)} step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" placeholder="e.g., 500 for income, -100 for expense" />
            </div>
        </>
    );

    const renderLiabilityFields = () => (
        <>
            <div>
                <label htmlFor="liabilityBalance" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Current Balance ($)</label>
                <input type="number" id="liabilityBalance" value={value} onChange={e => setValue(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
            </div>
             <div>
                <label htmlFor="interestRate" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Interest Rate (%)</label>
                <input type="number" id="interestRate" value={interestRate} onChange={e => setInterestRate(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" />
            </div>
             <div>
                <label htmlFor="monthlyPayment" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Monthly Payment ($)</label>
                <input type="number" id="monthlyPayment" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} min="0" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary" required />
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : 'Liability'}</h2>
                     <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="teamId" className="block text-sm font-medium text-cosmic-text-secondary mb-1">For</label>
                        <select id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!!defaultTeamId} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 disabled:bg-cosmic-border">
                            <option value="">Personal</option>
                            {teams.map(teamRecord => <option key={teamRecord.id} value={teamRecord.id}>{teamRecord.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Name / Description</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>

                    {type === 'asset' ? renderAssetFields() : renderLiabilityFields()}

                    {!teamId && (
                         <div className="space-y-3 pt-3 border-t border-cosmic-border">
                             <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                Share this personal item with another user
                            </label>
                            {isShared && (
                                <div className="space-y-2 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-medium text-cosmic-text-primary">Ownership Split</h3>
                                        <p className={`text-sm font-semibold ${Math.abs(totalPercentage - 100) > 0.1 ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                                            Total: {totalPercentage.toFixed(2)}%
                                        </p>
                                    </div>
                                    {shares.map((share, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <select value={share.userId} onChange={e => handleShareChange(index, 'userId', e.target.value)} className="col-span-6 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm">
                                                {allUsers.map(u => <option key={u.id} value={u.id} disabled={shares.some((s, i) => i !== index && s.userId === u.id)}>{u.name}</option>)}
                                            </select>
                                            <input type="number" value={share.percentage} onChange={e => handleShareChange(index, 'percentage', e.target.value)} className="col-span-4 bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-sm text-right"/>
                                            <span className="text-cosmic-text-secondary text-sm">%</span>
                                            <button type="button" onClick={() => handleRemoveOwner(index)} disabled={shares.length <= 1} className="col-span-1 text-cosmic-danger disabled:text-cosmic-border"><XIcon className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddOwner} className="text-sm text-cosmic-primary font-semibold">+ Add owner</button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-cosmic-border">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">{isEditing ? 'Save Changes' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};