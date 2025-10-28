
import React, { useMemo, useState } from 'react';
import type { User, Budget, BudgetCategory } from '../types';
import { PlusIcon } from './icons';
import { TransactionType } from '../types';

interface BudgetViewProps {
    user: User;
    onSaveBudget: (budget: Budget) => void;
    onOpenBudgetModal: () => void;
}

const allCategories: BudgetCategory[] = ['Housing', 'Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Business Expense', 'Maintenance', 'Other'];

const ProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    const isOverBudget = value > max;
    return (
        <div className="w-full bg-cosmic-bg rounded-full h-3 border border-cosmic-border relative">
            <div
                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-cosmic-danger' : color}`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

export const BudgetView: React.FC<BudgetViewProps> = ({ user, onSaveBudget, onOpenBudgetModal }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"

    const { budget, monthlyExpenses, totalSpent, totalBudgeted } = useMemo(() => {
        const currentBudget = user.budgets.find(b => b.month === currentMonth) || { month: currentMonth, limits: {} };

        const expensesForMonth = user.financialStatement.transactions.filter(t => 
            t.type === TransactionType.EXPENSE && t.date.startsWith(currentMonth)
        );

        const expensesByCategory = expensesForMonth.reduce((acc, t) => {
            const category = t.category as BudgetCategory;
            if (allCategories.includes(category)) {
                const userShare = t.expenseShares?.find(s => s.userId === user.id)?.amount || 0;
                acc[category] = (acc[category] || 0) + userShare;
            }
            return acc;
        }, {} as Partial<Record<BudgetCategory, number>>);

        const totalSpent = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
        const totalBudgeted = Object.values(currentBudget.limits).reduce((sum, limit) => sum + (limit || 0), 0);

        return {
            budget: currentBudget,
            monthlyExpenses: expensesByCategory,
            totalSpent,
            totalBudgeted
        };
    }, [user, currentMonth]);

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Monthly Budget</h1>
                    <input 
                        type="month" 
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="bg-cosmic-surface border border-cosmic-border rounded-md p-1 mt-2 text-cosmic-text-secondary"
                    />
                </div>
                <button onClick={onOpenBudgetModal} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Set/Edit Budget
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                    <h2 className="text-cosmic-text-secondary font-medium">Total Spent This Month</h2>
                    <p className="text-4xl font-bold text-cosmic-text-primary mt-2">${totalSpent.toFixed(2)}</p>
                </div>
                <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                    <h2 className="text-cosmic-text-secondary font-medium">Total Budget for Month</h2>
                    <p className={`text-4xl font-bold mt-2 ${totalSpent > totalBudgeted ? 'text-cosmic-danger' : 'text-cosmic-success'}`}>
                        ${totalBudgeted.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="bg-cosmic-surface p-4 rounded-xl border border-cosmic-border">
                <h2 className="text-xl font-bold text-cosmic-text-primary mb-4 px-2">Budget Categories</h2>
                <div className="space-y-4">
                    {allCategories.map(category => {
                        const spent = monthlyExpenses[category] || 0;
                        const limit = budget.limits[category] || 0;
                        if(limit === 0 && spent === 0) return null;

                        return (
                            <div key={category} className="p-3 bg-cosmic-bg rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold text-cosmic-text-primary">{category}</span>
                                    <div className="text-sm">
                                        <span className={spent > limit ? 'text-cosmic-danger' : 'text-cosmic-text-primary'}>${spent.toFixed(2)}</span>
                                        <span className="text-cosmic-text-secondary"> / ${limit.toFixed(2)}</span>
                                    </div>
                                </div>
                                <ProgressBar value={spent} max={limit} color="bg-cosmic-primary" />
                            </div>
                        );
                    })}
                     {totalBudgeted === 0 && (
                        <p className="text-center py-8 text-cosmic-text-secondary">You haven't set a budget for this month yet. Click 'Set/Edit Budget' to start!</p>
                    )}
                </div>
            </div>
        </div>
    );
};
