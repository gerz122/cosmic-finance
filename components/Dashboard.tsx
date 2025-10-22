import React, { useMemo } from 'react';
import type { User, Transaction } from '../types';
import { TransactionType, AssetType } from '../types';
import { StarIcon, PlusIcon, SparklesIcon } from './icons';
import { PortfolioLivePL } from './PortfolioLivePL';
import { DoughnutChart } from './DoughnutChart';

interface DashboardProps {
    user: User;
    onAddTransactionClick: () => void;
    onTransferClick: () => void;
    onDrawCosmicCard: () => void;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; subtitle?: string; color: string; }> = ({ title, value, subtitle, color }) => (
    <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border flex flex-col justify-between hover:border-cosmic-primary transition-all duration-300 transform hover:-translate-y-1">
        <div>
            <h3 className="text-cosmic-text-secondary font-medium">{title}</h3>
            <div className={`text-4xl font-bold ${color}`}>{value}</div>
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

    const { passiveIncome, totalExpenses, netWorth, monthlyCashflow, recentTransactions, stocks, expenseBreakdown } = useMemo(() => {
        const statement = user.financialStatement;
        // FIX: Coerce amounts to numbers to prevent type errors with arithmetic operations.
        // If data from an external source (like a DB) has numbers as strings, the `+` operator
        // would concatenate, turning the `reduce` result into a string and causing `-` operations to fail.
        const passiveIncome = statement.transactions.filter(t => t.type === TransactionType.INCOME && t.isPassive).reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpenses = statement.transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + Number(t.amount), 0);
        const totalIncome = statement.transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + Number(t.amount), 0);
        // FIX: The original net worth calculation was a single long line which might cause type inference issues.
        // It's broken down into multiple lines for clarity and correctness.
        const totalAssets = statement.assets.reduce((sum, a) => sum + Number(a.value), 0);
        const totalLiabilities = statement.liabilities.reduce((sum, l) => sum + Number(l.balance), 0);
        const netWorth = totalAssets - totalLiabilities;
        const monthlyCashflow = totalIncome - totalExpenses;
        const recentTransactions = [...statement.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        const stocks = statement.assets.filter(a => a.type === AssetType.STOCK);
        const expenseBreakdown = statement.transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
                return acc;
            }, {} as Record<string, number>);

        return { passiveIncome, totalExpenses, netWorth, monthlyCashflow, recentTransactions, stocks, expenseBreakdown };
    }, [user.financialStatement]);

    const freedomPercentage = totalExpenses > 0 ? Math.round((passiveIncome / totalExpenses) * 100) : 100;

    const expenseChartColors = ['#58A6FF', '#F778BA', '#3FB950', '#F85149', '#A371F7', '#E3B341', '#1F6FEB', '#F28C38'];

    const expenseChartData = useMemo(() => {
        return Object.entries(expenseBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([label, value], index) => ({
                label,
                value,
                color: expenseChartColors[index % expenseChartColors.length],
            }));
    }, [expenseBreakdown]);

    const totalExpensesForChart = useMemo(() => expenseChartData.reduce((sum, item) => sum + item.value, 0), [expenseChartData]);

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Net Worth" value={`$${netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} subtitle="Your total 'score'" color="text-white" />
                <StatCard title="Monthly Cash Flow" value={`$${monthlyCashflow.toFixed(2)}`} subtitle="Your 'attack' power" color={monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} />
                <StatCard title="Passive Income" value={`$${passiveIncome.toFixed(2)}`} subtitle="Your 'freedom goals'" color="text-cosmic-primary" />
                 <StatCard title="Portfolio P/L (Live)" value={<PortfolioLivePL stocks={stocks} />} subtitle="Today's stock performance" color="text-white" />
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">Recent Plays (Transactions)</h2>
                    <div className="space-y-3">
                        {recentTransactions.length === 0 && <p className="text-cosmic-text-secondary">No recent transactions.</p>}
                        {recentTransactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center p-3 bg-cosmic-bg rounded-lg">
                                <div>
                                    <p className="font-semibold text-cosmic-text-primary">{tx.description}</p>
                                    <p className="text-sm text-cosmic-text-secondary">{tx.category} &bull; {new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                                <p className={`font-bold text-lg ${tx.type === TransactionType.INCOME ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                                    {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">Expense Breakdown</h2>
                    {totalExpensesForChart > 0 ? (
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-shrink-0">
                                <DoughnutChart data={expenseChartData} size={220} centerLabel="Expenses" />
                            </div>
                            <div className="w-full space-y-2 text-sm overflow-y-auto max-h-64 pr-2">
                                {expenseChartData.map(item => (
                                    <div key={item.label} className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                                            <span className="text-cosmic-text-primary truncate" title={item.label}>{item.label}</span>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <span className="font-bold text-cosmic-text-primary">${item.value.toFixed(2)}</span>
                                            <span className="text-cosmic-text-secondary ml-2">
                                                ({((item.value / totalExpensesForChart) * 100).toFixed(0)}%)
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-cosmic-text-secondary">No expense data for this period.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
