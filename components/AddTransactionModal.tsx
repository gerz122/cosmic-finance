import React, { useState, useEffect } from 'react';
import type { Transaction, TransactionType as TType } from '../types';
import { TransactionType } from '../types';
import { XIcon } from './icons';

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const defaultCategories = [
    'Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Job', 'Investment', 'Loan', 'Shopping'
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAddTransaction }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0]);
    const [customCategory, setCustomCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<TType>(TransactionType.EXPENSE);
    const [isPassive, setIsPassive] = useState(false);
    
    const finalCategory = selectedCategory === 'Other' ? customCategory : selectedCategory;

    useEffect(() => {
        if (!isOpen) {
            // Reset form on close
            setDescription('');
            setAmount('');
            setSelectedCategory(defaultCategories[0]);
            setCustomCategory('');
            setDate(new Date().toISOString().split('T')[0]);
            setType(TransactionType.EXPENSE);
            setIsPassive(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = parseFloat(amount);
        if (!description || !numericAmount || numericAmount <= 0 || !finalCategory || !date) {
            alert('Please fill out all fields correctly.');
            return;
        }

        onAddTransaction({
            description,
            amount: numericAmount,
            type,
            category: finalCategory,
            date,
            isPassive: type === TransactionType.INCOME ? isPassive : undefined,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Add New "Play"</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <div className="pl-4">
                            <label className="flex items-center">
                                <input type="checkbox" checked={isPassive} onChange={(e) => setIsPassive(e.target.checked)} className="w-4 h-4 rounded text-cosmic-primary bg-cosmic-bg border-cosmic-border focus:ring-cosmic-primary" />
                                <span className="ml-2 text-sm text-cosmic-text-secondary">Is this passive income?</span>
                            </label>
                        </div>
                    )}
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Description</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="amount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Amount</label>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} min="0.01" step="0.01" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Category</label>
                            <select id="category" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary">
                                {defaultCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                <option value="Other">Other...</option>
                            </select>
                        </div>
                    </div>
                     {selectedCategory === 'Other' && (
                        <div>
                            <label htmlFor="customCategory" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Custom Category Name</label>
                            <input type="text" id="customCategory" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
                        </div>
                    )}
                    <div>
                         <label htmlFor="date" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Date</label>
                         <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary focus:outline-none focus:ring-2 focus:ring-cosmic-primary" required />
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