import React, { useState, useEffect, useMemo } from 'react';
import type { Transaction, TransactionType as TType, User, Share } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
    currentUser: User;
    teamMembers: User[];
}

const defaultCategories = [
    'Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Job', 'Investment', 'Loan', 'Shopping'
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction, currentUser, teamMembers }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TType>(TransactionType.EXPENSE);
    const [isPassive, setIsPassive] = useState(false);
    
    // Shared transaction state
    const [isShared, setIsShared] = useState(false);
    const [payerId, setPayerId] = useState(currentUser.id);
    const [splitType, setSplitType] = useState<'percent' | 'fixed'>('percent');
    const [shares, setShares] = useState<Record<string, string>>({});

    const filteredCategories = useMemo(() => 
        defaultCategories.filter(c => c.toLowerCase().includes(categoryInput.toLowerCase()))
    , [categoryInput]);
    
    useEffect(() => {
        if (!isOpen) {
            // Reset form on close
            setDescription(''); setAmount(''); setCategoryInput('');
            setDate(new Date().toISOString().split('T')[0]);
            setType(TransactionType.EXPENSE); setIsPassive(false);
            setIsShared(false); setPayerId(currentUser.id);
            setShares({}); setSplitType('percent');
        } else {
             setPayerId(currentUser.id);
             // Auto-split equally by default when shared is toggled
            const initialShares: Record<string, string> = {};
            teamMembers.forEach(member => {
                initialShares[member.id] = (100 / teamMembers.length).toFixed(2);
            });
            setShares(initialShares);
        }
    }, [isOpen, currentUser.id, teamMembers]);
    
    useEffect(() => {
        // Reset and recalculate shares when team members or split type changes
        const newShares: Record<string, string> = {};
        if (isShared) {
            teamMembers.forEach(member => {
                newShares[member.id] = splitType === 'percent' ? (100 / teamMembers.length).toFixed(2) : (parseFloat(amount || '0') / teamMembers.length).toFixed(2);
            });
            setShares(newShares);
        }
    }, [isShared, splitType, teamMembers, amount]);


    if (!isOpen) return null;
    
    const handleShareChange = (userId: string, value: string) => {
        setShares(prev => ({...prev, [userId]: value}));
    }

    const validateShares = (): { finalShares: Share[] | null, error: string | null } => {
        const numericAmount = parseFloat(amount);
        if (!isShared) return { finalShares: null, error: null };

        const finalShares: Share[] = [];
        let total = 0;
        
        for(const member of teamMembers) {
            const shareValue = parseFloat(shares[member.id] || '0');
            if(isNaN(shareValue)) return { finalShares: null, error: `Invalid share for ${member.name}` };
            if(shareValue > 0) {
                 finalShares.push({userId: member.id, amount: 0}); // placeholder
                 total += shareValue;
            }
        }
        
        if (splitType === 'percent') {
            if (Math.abs(total - 100) > 0.01) {
                return { finalShares: null, error: `Percentages must add up to 100%. Current total: ${total.toFixed(2)}%` };
            }
            // convert percentages to fixed amounts
            finalShares.forEach(s => {
                const percentage = parseFloat(shares[s.userId] || '0') / 100;
                s.amount = numericAmount * percentage;
            });
        } else { // fixed
            if (Math.abs(total - numericAmount) > 0.01) {
                 return { finalShares: null, error: `Fixed amounts must add up to the total transaction amount of $${numericAmount}. Current total: $${total.toFixed(2)}` };
            }
            finalShares.forEach(s => {
                s.amount = parseFloat(shares[s.userId] || '0');
            });
        }
        return { finalShares, error: null };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!description || !numericAmount || numericAmount <= 0 || !categoryInput || !date) {
            alert('Please fill out all required fields.');
            return;
        }
        
        const { finalShares, error } = validateShares();
        if (error) {
            alert(error);
            return;
        }

        onAddTransaction({
            description,
            amount: numericAmount,
            type,
            category: categoryInput,
            date,
            isPassive: type === TransactionType.INCOME ? isPassive : undefined,
            isShared,
            payerId: isShared ? payerId : currentUser.id,
            shares: finalShares || undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-2xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Add New "Play"</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Type</label>
                            <div className="flex gap-4">
                                <label className="flex items-center">
                                    <input type="radio" name="type" value={TransactionType.EXPENSE} checked={type === TransactionType.EXPENSE} onChange={() => setType(TransactionType.EXPENSE)} className="w-4 h-4 text-cosmic-secondary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-secondary" />
                                    <span className="ml-2 text-cosmic-text-primary">Expense</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="type" value={TransactionType.INCOME} checked={type === TransactionType.INCOME} onChange={() => setType(TransactionType.INCOME)} className="w-4 h-4 text-cosmic-success bg-cosmic-bg border-cosmic-border focus:ring-cosmic-success" />
                                    <span className="ml-2 text-cosmic-text-primary">Income</span>
                                </label>
                            </div>
                        </div>
                         {type === TransactionType.INCOME && (
                            <div className="pl-4 self-center">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={isPassive} onChange={(e) => setIsPassive(e.target.checked)} className="w-4 h-4 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                    <span className="ml-2 text-sm text-cosmic-text-secondary">Is this passive income?</span>
                                </label>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Description</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Amount</label>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                        </div>
                        <div className="relative">
                            <label htmlFor="category" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Category</label>
                            <input list="category-suggestions" id="category" value={categoryInput} onChange={e => setCategoryInput(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required/>
                            <datalist id="category-suggestions">
                                {filteredCategories.map(cat => <option key={cat} value={cat}/>)}
                            </datalist>
                        </div>
                        <div>
                             <label htmlFor="date" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Date</label>
                             <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                        </div>
                    </div>
                    {/* Sharing Section */}
                    <div className="space-y-3 pt-3 border-t border-cosmic-border">
                         <label className="flex items-center gap-2">
                            <input type="checkbox" checked={isShared} onChange={e => setIsShared(e.target.checked)} className="w-5 h-5 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                            <span className="font-medium text-cosmic-text-primary">Shared Transaction</span>
                        </label>
                        {isShared && (
                            <div className="p-3 bg-cosmic-bg rounded-lg space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="payer" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Who Paid?</label>
                                        <select id="payer" value={payerId} onChange={e => setPayerId(e.target.value)} className="w-full bg-cosmic-surface border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary">
                                            {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-cosmic-text-secondary mb-1">Split Method</label>
                                         <select value={splitType} onChange={e => setSplitType(e.target.value as 'percent' | 'fixed')} className="w-full bg-cosmic-surface border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary">
                                            <option value="percent">By Percentage (%)</option>
                                            <option value="fixed">By Fixed Amount ($)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-cosmic-text-secondary mb-2">Define Shares:</p>
                                    <div className="space-y-2">
                                        {teamMembers.map(member => (
                                            <div key={member.id} className="flex items-center gap-3">
                                                <label htmlFor={`share-${member.id}`} className="w-1/3 text-cosmic-text-primary text-sm truncate">{member.name}</label>
                                                <input
                                                    type="number"
                                                    id={`share-${member.id}`}
                                                    value={shares[member.id] || ''}
                                                    onChange={e => handleShareChange(member.id, e.target.value)}
                                                    step="0.01"
                                                    className="flex-grow bg-cosmic-surface border border-cosmic-border rounded-md p-1.5 text-cosmic-text-primary focus:outline-none focus:ring-1 focus:ring-cosmic-primary"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400 transition-colors">Save Transaction</button>
                    </div>
                </form>
            </div>
        </div>
    );
};