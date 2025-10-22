import React, { useMemo } from 'react';
import type { User, FinancialStatement, Transaction } from '../types';
import { TransactionType } from '../types';
import { StarIcon, PlusIcon, SparklesIcon } from './icons';

interface DashboardProps {
    user: User;
    onAddTransactionClick: () => void;
    onTransferClick: () => void;
    onDrawCosmicCard: () => void;
}

const StatCard: React.FC<{ title: string; value: string; subtitle?: string; color: string; }> = ({ title, value, subtitle, color }) => (
    <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border flex flex-col justify-between hover:border-cosmic-primary transition-all duration-300 transform hover:-translate-y-1">
        <div>
            <h3 className="text-cosmic-text-secondary font-medium">{title}</h3>
            <p className={`text-4xl font-bold ${color}`}>{value}</p>
        </div>
        {subtitle && <p className="text-sm text-cosmic-text-secondary mt-2">{subtitle}</p>}
    </div>
);

const ProgressBar: React.FC<{ value: number; max: number; }> = ({ value, max }) => {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-cosmic-surface rounded-full h-4 border border-cosmic-border">
            <div
                className="bg-gradient-to-r from-cosmic-secondary to-cosmic-primary h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onAddTransactionClick, onTransferClick, onDrawCosmicCard }) => {

    const { passiveIncome, totalExpenses, netWorth, monthlyCashflow, recentTransactions } = useMemo(() => {
        const statement = user.financialStatement;
        const passiveIncome = statement.transactions.filter(t => t.type === TransactionType.INCOME && t.isPassive).reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = statement.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = statement.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const netWorth = statement.assets.reduce((sum, a) => sum + a.value, 0) - statement.liabilities.reduce((sum, l) => sum + l.balance, 0);
        const monthlyCashflow = totalIncome - totalExpenses;
        const recentTransactions = [...statement.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        return { passiveIncome, totalExpenses, netWorth, monthlyCashflow, recentTransactions };
    }, [user.financialStatement]);

    const freedomPercentage = totalExpenses > 0 ? Math.round((passiveIncome / totalExpenses) * 100) : 100;

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-cosmic-text-primary">Welcome back, {user.name}!</h1>
                    <p className="text-cosmic-text-secondary">Here's your "Cosmic Tournament" summary.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={onDrawCosmicCard} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-shadow">
                        <SparklesIcon className="w-5 h-5" />
                        Explore Cosmos
                    </button>
                    <button onClick={onTransferClick} className="flex items-center gap-2 bg-cosmic-surface text-cosmic-primary font-bold py-2 px-4 rounded-lg border border-cosmic-primary hover:bg-cosmic-border transition-colors">
                        Transfer Money
                    </button>
                    <button onClick={onAddTransactionClick} className="flex items-center gap-2 bg-cosmic-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                        Add Transaction
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Net Worth" value={`$${netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} subtitle="Your total 'score'" color="text-white" />
                <StatCard title="Monthly Cash Flow" value={`$${monthlyCashflow.toFixed(2)}`} subtitle="Your 'attack' power" color={monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} />
                <StatCard title="Passive Income" value={`$${passiveIncome.toFixed(2)}`} subtitle="Your 'freedom goals'" color="text-cosmic-primary" />
            </div>

            <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-cosmic-text-primary">Race to Financial Freedom</h2>
                    <div className="flex items-center gap-2 text-cosmic-primary font-bold text-lg">
                        <StarIcon className="w-6 h-6 text-yellow-400" />
                        <span>{freedomPercentage}%</span>
                    </div>
                </div>
                <p className="text-cosmic-text-secondary">You win the game when your passive income covers all your expenses. You've scored <span className="font-bold text-cosmic-primary">${passiveIncome.toFixed(2)}</span> of your <span className="font-bold text-cosmic-secondary">${totalExpenses.toFixed(2)}</span> goal!</p>
                <ProgressBar value={passiveIncome} max={totalExpenses} />
            </div>

             <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">Recent Plays (Transactions)</h2>
                <div className="space-y-3">
                    {recentTransactions.length === 0 && <p className="text-cosmic-text-secondary">No recent transactions.</p>}
                    {recentTransactions.map(tx => (
                        <div key={tx.id} className="flex justify-between items-center p-3 bg-cosmic-bg rounded-lg">
                            <div>
                                <p className="font-semibold text-cosmic-text-primary">{tx.description}</p>
                                {/* FIX: Corrected typo from toLocaleDateDateString to toLocaleDateString */}
                                <p className="text-sm text-cosmic-text-secondary">{tx.category} &bull; {new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                            <p className={`font-bold text-lg ${tx.type === TransactionType.INCOME ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                                {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};