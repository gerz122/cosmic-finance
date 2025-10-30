import React, { useMemo, useState } from 'react';
import type { User, Budget, BudgetCategory } from '../types';
import { PlusIcon } from './icons';
import { TransactionType } from '../types';

interface BudgetViewProps {
    user: User;
    onSaveBudget: (budget: Budget) => void;
    onOpenBudgetModal: () => void;
}

const allCategories: BudgetCategory[] = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Business Expense', 'Maintenance', 'Other', 'Goals'];

// FIX: Completed the ProgressBar component which was cut off in the original file.
const ProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const isOverBudget = value > max && max > 0;
    return (
        <div className="w-full bg-cosmic-bg rounded-full h-3 border border-cosmic-border relative">
            <div
                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-cosmic-danger' : color}`}
                style={{ width: `${percentage}%` }}
            ></div>
             <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-bold text-white text-opacity-80">
                {percentage > 10 && <span>{percentage.toFixed(0)}%</span>}
            </div>
        </div>
    );
};

// FIX: Added the missing BudgetView component and exported it to resolve the import error.
export const BudgetView: React.FC<BudgetViewProps> = ({ user, onOpenBudgetModal }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const currentBudget = useMemo(() => {
        return user.budgets?.find(b => b.month === currentMonth);
    }, [user.budgets, currentMonth]);

    const monthlySpending = useMemo(() => {
        const spending: Partial<Record<BudgetCategory, number>> = {};
        const expenseTransactions = user.financialStatement.transactions.filter(tx => 
            tx.type === TransactionType.EXPENSE && tx.date.startsWith(currentMonth)
        );

        for (const tx of expenseTransactions) {
            let userShare = 0;
            if (tx.expenseShares && tx.expenseShares.length > 0) {
                 const share = tx.expenseShares.find(s => s.userId === user.id);
                 if (share) {
                     userShare = share.amount;
                 }
            } else {
                // If not split, it's a personal transaction, so the full amount applies
                userShare = tx.amount;
            }

            if (userShare > 0) {
                const category = tx.category as BudgetCategory;
                if (allCategories.includes(category)) {
                    spending[category] = (spending[category] || 0) + userShare;
                } else {
                    spending['Other'] = (spending['Other'] || 0) + userShare;
                }
            }
        }
        return spending;
    }, [user.financialStatement.transactions, user.id, currentMonth]);
    
    const totalBudget = useMemo(() => {
        return currentBudget ? Object.values(currentBudget.limits).reduce((sum, limit) => sum + (limit || 0), 0) : 0;
    }, [currentBudget]);

    const totalSpending = useMemo(() => {
        return Object.values(monthlySpending).reduce((sum, spent) => sum + (spent || 0), 0);
    }, [monthlySpending]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Monthly Budget</h1>
                    <p className="text-cosmic-text-secondary">Track your spending against your set limits.</p>
                </div>
                <div className="flex gap-2 items-center">
                    <input 
                        type="month"
                        value={currentMonth}
                        onChange={e => setCurrentMonth(e.target.value)}
                        className="bg-cosmic-surface border border-cosmic-border rounded-md p-2 text-cosmic-text-primary date-input"
                    />
                    <button onClick={onOpenBudgetModal} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        Set Budget
                    </button>
                </div>
            </div>

            <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                 <div className="flex justify-between items-end mb-2">
                    <div>
                        <p className="text-cosmic-text-secondary">Total Spent This Month</p>
                        <p className={`text-3xl font-bold ${totalSpending > totalBudget && totalBudget > 0 ? 'text-cosmic-danger' : 'text-cosmic-text-primary'}`}>${totalSpending.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    <p className="text-cosmic-text-secondary">
                        Budget: <span className="font-bold text-cosmic-text-primary">${totalBudget.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </p>
                </div>
                <ProgressBar value={totalSpending} max={totalBudget} color="bg-cosmic-primary" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allCategories.map(category => {
                    const limit = currentBudget?.limits[category] || 0;
                    const spent = monthlySpending[category] || 0;
                    
                    if (limit === 0 && spent === 0) return null;

                    return (
                        <div key={category} className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-cosmic-text-primary">{category}</h3>
                                <p className="text-sm">
                                    <span className={`font-semibold ${spent > limit && limit > 0 ? 'text-cosmic-danger' : 'text-cosmic-text-primary'}`}>${spent.toFixed(2)}</span>
                                    <span className="text-cosmic-text-secondary"> / ${limit.toFixed(2)}</span>
                                </p>
                            </div>
                            <ProgressBar value={spent} max={limit} color="bg-cosmic-secondary" />
                        </div>
                    );
                })}
            </div>

             {!currentBudget && (
                <div className="text-center bg-cosmic-surface p-8 rounded-lg border border-dashed border-cosmic-border">
                    <h3 className="text-xl font-semibold text-cosmic-text-primary">No Budget Set for {new Date(currentMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                    <p className="text-cosmic-text-secondary mt-2">Click "Set Budget" to create your financial plan for this month.</p>
                </div>
             )}
             <style>{`.date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }`}</style>
        </div>
    );
};
