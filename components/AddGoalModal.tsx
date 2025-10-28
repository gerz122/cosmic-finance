import React, { useState } from 'react';
import type { Goal } from '../types';
import { XIcon } from './icons';

interface AddGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [targetDate, setTargetDate] = useState('');
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericTarget = parseFloat(targetAmount);
        if (!name || !numericTarget || numericTarget <= 0) {
            alert('Please enter a valid name and target amount.');
            return;
        }

        onSave({
            name,
            targetAmount: numericTarget,
            targetDate: targetDate || undefined,
        });

        setName('');
        setTargetAmount('');
        setTargetDate('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-md shadow-2xl p-6 m-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cosmic-text-primary">Create a New Goal</h2>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="goalName" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Goal Name</label>
                        <input type="text" id="goalName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Emergency Fund" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>
                    <div>
                        <label htmlFor="targetAmount" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Target Amount ($)</label>
                        <input type="number" id="targetAmount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} min="1" step="any" className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2" required />
                    </div>
                    <div>
                        <label htmlFor="targetDate" className="block text-sm font-medium text-cosmic-text-secondary mb-1">Target Date (Optional)</label>
                        <input type="date" id="targetDate" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-cosmic-bg border border-cosmic-border rounded-md p-2 text-cosmic-text-primary date-input" />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-cosmic-surface border border-cosmic-border rounded-md text-cosmic-text-primary hover:bg-cosmic-border">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-cosmic-primary rounded-md text-white font-semibold hover:bg-blue-400">Create Goal</button>
                    </div>
                </form>
            </div>
            <style>{`.date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }`}</style>
        </div>
    );
};