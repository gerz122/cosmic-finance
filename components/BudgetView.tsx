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

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
        <h3 className="text-cosmic-text-secondary text-sm">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

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
                const userShare = t.expenseShares?.find(s => s.userId === user.id)?.amount || t.amount;
                acc[category] = (acc[category] || 0) + userShare;
            }
            return acc;
        }, {} as Partial<Record<BudgetCategory, number>>);

        // FIX: Ensure values are treated as numbers to avoid type errors.
        const totalSpent = Object.values(expensesByCategory).reduce((sum, amount) => sum + Number(amount || 0), 0);
        const totalBudgeted = Object.values(currentBudget.limits).reduce((sum, limit) => sum + Number(limit || 0), 0);

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
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Monthly Budget</h1>
                    <input 
                        type="month" 
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="bg-cosmic-surface border border-cosmic-border rounded-md p-2 text-cosmic-text-primary"
                    />
                </div>
                 <button onClick={onOpenBudgetModal} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                    <PlusIcon className="w-5 h-5" />
                    Set/Edit Budget
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Total Budgeted" value={`$${totalBudgeted.toFixed(2)}`} color="text-cosmic-primary" />
                <StatCard title="Total Spent" value={`$${totalSpent.toFixed(2)}`} color="text-cosmic-secondary" />
                <StatCard title="Remaining" value={`$${(totalBudgeted - totalSpent).toFixed(2)}`} color={(totalBudgeted - totalSpent) >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} />
            </div>

            <div className="bg-cosmic-surface p-4 rounded-xl border border-cosmic-border">
                <h2 className="text-xl font-bold text-cosmic-text-primary mb-2 px-2">Budget Breakdown</h2>
                <div className="space-y-3">
                     {allCategories.map(category => {
                        const spent = monthlyExpenses[category] || 0;
                        const limit = budget.limits[category] || 0;
                        if (limit === 0 && spent === 0) return null; // Don't show empty categories
                        
                        const isOver = spent > limit && limit > 0;
                        const remaining = limit - spent;
                        
                        return (
                            <div key={category} className="p-2 rounded-lg">
                                <div className="flex justify-between items-center mb-1 text-sm">
                                    <span className="font-medium text-cosmic-text-primary">{category}</span>
                                    <span className={`font-semibold ${isOver ? 'text-cosmic-danger' : 'text-cosmic-text-secondary'}`}>
                                        ${spent.toFixed(2)} / ${limit > 0 ? limit.toFixed(2) : 'no limit'}
                                    </span>
                                </div>
                                {limit > 0 && <ProgressBar value={spent} max={limit} color="bg-cosmic-primary" />}
                                {limit > 0 && (
                                    <p className={`text-xs mt-1 text-right ${remaining >= 0 ? 'text-cosmic-text-secondary' : 'text-cosmic-danger'}`}>
                                        {remaining >= 0 ? `$${remaining.toFixed(2)} remaining` : `$${Math.abs(remaining).toFixed(2)} over budget`}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                    {totalBudgeted === 0 && <p className="text-cosmic-text-secondary text-center py-8">No budget set for this month. Click 'Set/Edit Budget' to get started.</p>}
                </div>
            </div>
        </div>
    );
};