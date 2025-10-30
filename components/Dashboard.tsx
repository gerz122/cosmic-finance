import React, { useMemo, useEffect } from 'react';
import type { User, Transaction, FinancialStatement, HistoricalDataPoint, Team } from '../types';
import { TransactionType, AssetType } from '../types';
import { StarIcon, PlusIcon, SparklesIcon } from './icons';
import { PortfolioLivePL } from './PortfolioLivePL';
import { DoughnutChart } from './DoughnutChart';
import { AdvancedLineChart } from './AdvancedLineChart';

interface DashboardProps {
    user: User;
    teams: Team[];
    effectiveStatement: FinancialStatement;
    historicalData: HistoricalDataPoint[];
    onAddTransactionClick: () => void;
    onTransferClick: () => void;
    onDrawCosmicCard: () => void;
    onCategoryClick: (category: string) => void;
    onTransactionClick: (transaction: Transaction) => void;
    onStatCardClick: (stat: 'netWorth' | 'cashflow' | 'passiveIncome') => void;
    onShowFreedomModal: () => void;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode; subtitle?: string; color: string; onClick?: () => void }> = ({ title, value, subtitle, color, onClick }) => (
    <div 
        className={`bg-cosmic-surface p-6 rounded-xl border border-cosmic-border flex flex-col justify-between hover:border-cosmic-primary transition-all duration-300 transform hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
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

export const Dashboard: React.FC<DashboardProps> = ({ user, teams, effectiveStatement, historicalData, onAddTransactionClick, onTransferClick, onDrawCosmicCard, onCategoryClick, onTransactionClick, onStatCardClick, onShowFreedomModal }) => {

    const { passiveIncome, totalExpenses, netWorth, monthlyCashflow, recentTransactions, stocks, expenseBreakdown } = useMemo(() => {
        // DEFINITIVE FIX: This guard is now extremely robust. It checks not only for the existence
        // of the necessary data structures but also ensures that any property that will be looped over
        // (like '.transactions' or '.assets') is actually an array. This completely prevents the
        // race condition where the component tries to render before sub-collections are loaded.
        if (
            !user?.financialStatement ||
            !effectiveStatement ||
            !Array.isArray(effectiveStatement.transactions) ||
            !Array.isArray(effectiveStatement.assets) ||
            !Array.isArray(effectiveStatement.liabilities) ||
            !Array.isArray(user.financialStatement.assets)
        ) {
            // Return a default, safe state if data is not fully hydrated.
            return { 
                passiveIncome: 0, 
                totalExpenses: 0, 
                netWorth: 0, 
                monthlyCashflow: 0, 
                recentTransactions: [], 
                stocks: [], 
                expenseBreakdown: {} 
            };
        }
        
        const statement = effectiveStatement;
        const userFinancials = user.financialStatement;
        
        let calculatedPassiveIncome = 0;
        let calculatedTotalExpenses = 0;
        let calculatedTotalIncome = 0;
        const calculatedExpenseBreakdown: Record<string, number> = {};

        const currentMonth = new Date().toISOString().slice(0, 7);

        statement.transactions.forEach(transaction => {
            if (!transaction.date.startsWith(currentMonth)) return;
        
            const userExpenseShare = transaction.expenseShares?.find(shareDetail => shareDetail.userId === user.id)?.amount;
            const userIncomeShare = transaction.paymentShares?.find(shareDetail => shareDetail.userId === user.id)?.amount;
        
            if (transaction.type === TransactionType.INCOME) {
                if (userIncomeShare !== undefined) {
                    calculatedTotalIncome += userIncomeShare;
                    if (transaction.isPassive) {
                        calculatedPassiveIncome += userIncomeShare;
                    }
                }
            } else { // EXPENSE
                if (userExpenseShare !== undefined) {
                    calculatedTotalExpenses += userExpenseShare;
                    calculatedExpenseBreakdown[transaction.category] = (calculatedExpenseBreakdown[transaction.category] || 0) + userExpenseShare;
                } else if (transaction.teamId && (!transaction.expenseShares || transaction.expenseShares.length === 0)) {
                    const team = teams.find(teamMember => teamMember.id === transaction.teamId);
                    if (team && team.memberIds.includes(user.id)) {
                        const equalShare = transaction.amount / team.memberIds.length;
                        calculatedTotalExpenses += equalShare;
                        calculatedExpenseBreakdown[transaction.category] = (calculatedExpenseBreakdown[transaction.category] || 0) + equalShare;
                    }
                }
            }
        });
        
        const calculatedMonthlyCashflow = calculatedTotalIncome - calculatedTotalExpenses;

        let totalAssets = 0;
        statement.assets.forEach(asset => {
            let share = 1.0;
            if(asset.shares) share = (asset.shares.find(shareDetail => shareDetail.userId === user.id)?.percentage || 0) / 100;
            else if (asset.teamId) {
                const team = teams.find(t => t.id === asset.teamId);
                if(team && team.memberIds.includes(user.id)) share = 1 / team.memberIds.length; else share = 0;
            }
            totalAssets += asset.value * share;
        });
        
        let totalLiabilities = 0;
        statement.liabilities.forEach(liability => {
            let share = 1.0;
            if(liability.shares) share = (liability.shares.find(shareDetail => shareDetail.userId === user.id)?.percentage || 0) / 100;
            else if (liability.teamId) {
                const team = teams.find(t => t.id === liability.teamId);
                if(team && team.memberIds.includes(user.id)) share = 1 / team.memberIds.length; else share = 0;
            }
            totalLiabilities += liability.balance * share;
        });
        
        const calculatedNetWorth = totalAssets - totalLiabilities;
        
        const recentTransactions = [...statement.transactions].sort((txA, txB) => new Date(txB.date).getTime() - new Date(txA.date).getTime()).slice(0, 5);
        const stocks = (userFinancials.assets || []).filter(asset => asset.type === AssetType.STOCK);
        
        return { 
            passiveIncome: calculatedPassiveIncome, 
            totalExpenses: calculatedTotalExpenses, 
            netWorth: calculatedNetWorth, 
            monthlyCashflow: calculatedMonthlyCashflow, 
            recentTransactions, 
            stocks, 
            expenseBreakdown: calculatedExpenseBreakdown
        };
    }, [user, teams, effectiveStatement]);
    
    // Check for financial freedom
    useEffect(() => {
        if (passiveIncome > 0 && totalExpenses > 0 && passiveIncome >= totalExpenses) {
            onShowFreedomModal();
        }
    }, [passiveIncome, totalExpenses, onShowFreedomModal]);

    const freedomPercentage = totalExpenses > 0 ? Math.round((passiveIncome / totalExpenses) * 100) : (passiveIncome > 0 ? 100 : 0);
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
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Net Worth" value={`$${netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} subtitle="Your total 'score'" color="text-white" onClick={() => onStatCardClick('netWorth')} />
                <StatCard title="Monthly Cash Flow" value={`$${monthlyCashflow.toFixed(2)}`} subtitle="Your 'attack' power" color={monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} onClick={() => onStatCardClick('cashflow')} />
                <StatCard title="Passive Income" value={`$${passiveIncome.toFixed(2)}`} subtitle="Your 'freedom goals'" color="text-cosmic-primary" onClick={() => onStatCardClick('passiveIncome')} />
                 <StatCard title="Portfolio P/L (Live)" value={<PortfolioLivePL stocks={stocks} />} subtitle="Today's stock performance" color="text-white" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">Net Worth Over Time</h2>
                    <div className="h-64">
                         <AdvancedLineChart data={historicalData} series={[{ key: 'netWorth', label: 'Net Worth', color: '#58A6FF' }]} />
                    </div>
                </div>
                <div className="lg:col-span-2 bg-cosmic-surface p-6 rounded-xl border border-cosmic-border space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-cosmic-text-primary">Race to Freedom</h2>
                        <div className="flex items-center gap-2 text-cosmic-primary font-bold text-lg">
                            <StarIcon className="w-6 h-6 text-yellow-400" />
                            <span>{freedomPercentage}%</span>
                        </div>
                    </div>
                    <p className="text-cosmic-text-secondary text-sm">You win when passive income covers all expenses. You've scored <span className="font-bold text-cosmic-primary">${passiveIncome.toFixed(2)}</span> of your <span className="font-bold text-cosmic-secondary">${totalExpenses.toFixed(2)}</span> goal!</p>
                    <ProgressBar value={passiveIncome} max={totalExpenses} />
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border">
                    <h2 className="text-xl font-bold text-cosmic-text-primary mb-4">Recent Plays (Transactions)</h2>
                    <div className="space-y-3">
                        {recentTransactions.length === 0 && <p className="text-cosmic-text-secondary">No recent transactions.</p>}
                        {recentTransactions.map(tx => (
                            <div key={tx.id} onClick={() => onTransactionClick(tx)} className="flex justify-between items-center p-3 bg-cosmic-bg rounded-lg hover:bg-cosmic-border cursor-pointer transition-colors">
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
                                <DoughnutChart data={expenseChartData} size={220} centerLabel="Expenses" onSliceClick={(label) => onCategoryClick(label)} />
                            </div>
                            <div className="w-full space-y-2 text-sm overflow-y-auto max-h-64 pr-2">
                                {expenseChartData.map(item => (
                                    <div key={item.label} onClick={() => onCategoryClick(item.label)} className="flex justify-between items-center p-1 rounded hover:bg-cosmic-bg cursor-pointer">
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