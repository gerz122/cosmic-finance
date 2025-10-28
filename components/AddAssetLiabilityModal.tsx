import React, { useState, useEffect } from 'react';
import type { Asset, Liability, Team } from '../types';
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
}

export const AddAssetLiabilityModal: React.FC<AddAssetLiabilityModalProps> = ({ isOpen, type, onClose, onSave, teams, defaultTeamId, itemToEdit }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [assetType, setAssetType] = useState<AssetType>(AssetType.REAL_ESTATE);
    const [monthlyCashflow, setMonthlyCashflow] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyPayment, setMonthlyPayment] = useState('');
    const [teamId, setTeamId] = useState(defaultTeamId || '');

    const isEditing = !!itemToEdit;

    useEffect(() => {
        if (isOpen) {
            if (isEditing && itemToEdit) {
                setName(itemToEdit.name);
                setTeamId(itemToEdit.teamId || '');
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
                setName('');
                setValue('');
                setAssetType(AssetType.REAL_ESTATE);
                setMonthlyCashflow('');
                setInterestRate('');
                setMonthlyPayment('');
                setTeamId(defaultTeamId || '');
            }
        }
    }, [isOpen, itemToEdit, isEditing, defaultTeamId]);

    if (!isOpen || !type) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !value) {
            alert('Please provide a name and a value/balance.');
            return;
        }

        let data: Partial<Asset | Liability>;
        if (type === 'asset') {
            data = { name, type: assetType, value: parseFloat(value), monthlyCashflow: parseFloat(monthlyCashflow) || 0 };
        } else {
            data = { name, balance: parseFloat(value), interestRate: parseFloat(interestRate) || 0, monthlyPayment: parseFloat(monthlyPayment) || 0 };
        }
        onSave(data, teamId || undefined);
        onClose();
    };
    
    const renderAssetFields = () => (
        <>
            <div>
                <label htmlFor="assetType" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Asset Type</label>
                <select id="assetType" value={assetType} onChange={e => setAssetType(e.target.value as AssetType)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary">
                    {Object.values(AssetType).filter(t => t !== AssetType.STOCK).map(t => <option key={t} value={t}>{t}</option>)}
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
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">{isEditing ? 'Edit' : 'Add'} {type === 'asset' ? 'Asset' : 'Liability'}</h2>
                     <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="teamId" className="block text-sm font-medium text-cosmic-text-secondary mb-1">For</label>
                        <select id="teamId" value={teamId} onChange={e => setTeamId(e.target.value)} disabled={!!defaultTeamId} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 disabled:bg-cosmic-border">
                            <option value="">Personal</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Name / Description</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>

                    {type === 'asset' ? renderAssetFields() : renderLiabilityFields()}
                    
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">{isEditing ? 'Save Changes' : 'Save'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};