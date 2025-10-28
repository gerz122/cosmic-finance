import React, { useState, useEffect } from 'react';
import type { User, Budget, BudgetCategory } from '../types';
import { XIcon } from './icons';

interface AddBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (budget: Budget) => void;
    user: User;
}

const allCategories: BudgetCategory[] = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Business Expense', 'Maintenance', 'Other'];

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose, onSave, user }) => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [limits, setLimits] = useState<Partial<Record<BudgetCategory, number>>>({});

    useEffect(() => {
        if (isOpen) {
            const currentBudget = user.budgets.find(b => b.month === month);
            setLimits(currentBudget?.limits || {});
        }
    }, [isOpen, month, user.budgets]);
    
    if (!isOpen) return null;

    const handleLimitChange = (category: BudgetCategory, value: string) => {
        const newLimits = { ...limits };
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue) && numericValue >= 0) {
            newLimits[category] = numericValue;
        } else {
            delete newLimits[category];
        }
        setLimits(newLimits);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const budgetData: Budget = {
            month,
            limits
        };
        onSave(budgetData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-lg shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Set Monthly Budget</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
                    <div className="mb-4">
                        <label htmlFor="budget-month" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Budget for Month</label>
                        <input
                            type="month"
                            id="budget-month"
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2"
                        />
                    </div>
                    <div className="overflow-y-auto space-y-3 pr-2 flex-grow">
                        {allCategories.map(category => (
                            <div key={category} className="grid grid-cols-2 gap-4 items-center">
                                <label htmlFor={`limit-${category}`} className="font-medium text-cosmic-text-primary">{category}</label>
                                <input
                                    type="number"
                                    id={`limit-${category}`}
                                    value={limits[category] || ''}
                                    onChange={e => handleLimitChange(category, e.target.value)}
                                    min="0"
                                    step="10"
                                    placeholder="0.00"
                                    className="bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-right"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-cosmic-border flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Save Budget</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
