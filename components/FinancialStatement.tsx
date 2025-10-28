import React, { useMemo, useState } from 'react';
import type { FinancialStatement as FinancialStatementType, User, Team, Transaction } from '../types';
import { TransactionType } from '../types';

interface FinancialStatementProps {
    statement: FinancialStatementType;
    user: User;
    teams: Team[];
    team?: Team;
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
}

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
        <h3 className="text-cosmic-text-secondary text-sm">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

const TransactionRow: React.FC<{ tx: Transaction, onEdit: () => void, onDelete: () => void }> = ({ tx, onEdit, onDelete }) => {
    const isIncome = tx.type === TransactionType.INCOME;
    return (
        <tr className="border-b border-cosmic-border last:border-b-0 hover:bg-cosmic-bg group">
            <td className="px-4 py-3 text-cosmic-text-primary">{new Date(tx.date).toLocaleDateString()}</td>
            <td className="px-4 py-3 text-cosmic-text-primary">{tx.description}</td>
            <td className="px-4 py-3 text-cosmic-text-secondary">{tx.category}</td>
            <td className={`px-4 py-3 font-semibold ${isIncome ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <button onClick={onEdit} className="text-yellow-500 hover:underline text-sm font-semibold">Edit</button>
                    <button onClick={onDelete} className="text-red-500 hover:underline text-sm font-semibold">Delete</button>
                </div>
            </td>
        </tr>
    );
};

export const FinancialStatement: React.FC<FinancialStatementProps> = ({ statement, user, teams, team, onEditTransaction, onDeleteTransaction }) => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [categoryFilter, setCategoryFilter] = useState('all');

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const transactionCategories = useMemo(() => {
        const categories = new Set(statement.transactions.map(tx => tx.category));
        return ['all', ...Array.from(categories)];
    }, [statement.transactions]);

    const filteredTransactions = useMemo(() => {
        return statement.transactions.filter(tx => {
            // Adjust date to avoid timezone issues where '2023-10-01' becomes '2023-09-30T20:00:00'
            const txDate = new Date(tx.date + 'T00:00:00');
            const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
            const end = dateRange.end ? new Date(dateRange.end + 'T00:00:00') : null;
            if (start && txDate < start) return false;
            if (end && txDate > end) return false;
            if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
            return true;
        });
    }, [statement.transactions, dateRange, categoryFilter]);


    const {
        monthlyCashflow,
        passiveIncome,
        totalExpenses,
        netWorth,
    } = useMemo(() => {
        if (team) {
            const teamPassiveIncome = filteredTransactions
                .filter(t => t.type === TransactionType.INCOME && t.isPassive)
                .reduce((sum, t) => sum + t.amount, 0);
            const teamTotalExpenses = filteredTransactions
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0);
            const teamTotalIncome = filteredTransactions
                .filter(t => t.type === TransactionType.INCOME)
                .reduce((sum, t) => sum + t.amount, 0);
            const teamMonthlyCashflow = teamTotalIncome - teamTotalExpenses;
            
            const totalAssets = statement.assets.reduce((sum, a) => sum + a.value, 0);
            const totalLiabilities = statement.liabilities.reduce((sum, l) => sum + l.balance, 0);
            const teamNetWorth = totalAssets - totalLiabilities;
            
            return {
                passiveIncome: teamPassiveIncome,
                totalExpenses: teamTotalExpenses,
                monthlyCashflow: teamMonthlyCashflow,
                netWorth: teamNetWorth
            };

        } else {
            let userTotalIncome = 0;
            let userPassiveIncome = 0;
            let userTotalExpenses = 0;

            filteredTransactions.forEach(t => {
                if (t.type === TransactionType.INCOME) {
                    let incomeShare = 0;
                    if (t.teamId) {
                        const teamContext = teams.find(team => team.id === t.teamId);
                        if (teamContext && teamContext.memberIds.includes(user.id)) {
                            // Assume equal share of team income
                            incomeShare = t.amount / teamContext.memberIds.length;
                        }
                    } else {
                        // Personal income is based on payment shares
                        incomeShare = t.paymentShares.find(s => s.userId === user.id)?.amount || 0;
                    }
                    userTotalIncome += incomeShare;
                    if (t.isPassive) userPassiveIncome += incomeShare;
                } else { // EXPENSE
                    // Expenses are always based on explicit expense shares
                    const userExpenseShare = t.expenseShares?.find(s => s.userId === user.id)?.amount || 0;
                    userTotalExpenses += userExpenseShare;
                }
            });

            const monthlyCashflow = userTotalIncome - userTotalExpenses;
            const totalAssets = statement.assets.reduce((sum, a) => sum + a.value, 0);
            const totalLiabilities = statement.liabilities.reduce((sum, l) => sum + l.balance, 0);
            const netWorth = totalAssets - totalLiabilities;
            return {
                passiveIncome: userPassiveIncome,
                totalExpenses: userTotalExpenses,
                monthlyCashflow,
                netWorth
            };
        }
    }, [filteredTransactions, statement.assets, statement.liabilities, user.id, team, teams]);

    const sortedTransactions = useMemo(() => {
        return [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [filteredTransactions]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-cosmic-text-primary">Financial Statement</h1>
            
            <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border flex items-center gap-4 flex-wrap text-sm">
                <h3 className="text-cosmic-text-secondary font-semibold">Filter by:</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="startDate" className="text-cosmic-text-secondary">From:</label>
                    <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} className="bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-cosmic-text-primary date-input" />
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="endDate" className="text-cosmic-text-secondary">To:</label>
                    <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} className="bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-cosmic-text-primary date-input" />
                </div>
                 <div className="flex items-center gap-2">
                    <label htmlFor="categoryFilter" className="text-cosmic-text-secondary">Category:</label>
                    <select id="categoryFilter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-cosmic-bg border border-cosmic-border rounded p-1.5 text-cosmic-text-primary">
                         {transactionCategories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Cash Flow (for period)" value={`$${monthlyCashflow.toFixed(2)}`} color={monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} />
                <StatCard title="Passive Income (for period)" value={`$${passiveIncome.toFixed(2)}`} color="text-cosmic-primary" />
                <StatCard title="Expenses (for period)" value={`$${totalExpenses.toFixed(2)}`} color="text-cosmic-secondary" />
                <StatCard title="Total Net Worth" value={`$${netWorth.toFixed(2)}`} color="text-white" />
            </div>

            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border overflow-hidden">
                <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Transactions (for period)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-cosmic-bg text-left text-cosmic-text-secondary">
                            <tr>
                                <th className="px-4 py-2 font-semibold">Date</th>
                                <th className="px-4 py-2 font-semibold">Description</th>
                                <th className="px-4 py-2 font-semibold">Category</th>
                                <th className="px-4 py-2 font-semibold">Amount</th>
                                <th className="px-4 py-2 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTransactions.map(tx => (
                                <TransactionRow 
                                    key={tx.id} 
                                    tx={tx} 
                                    onEdit={() => onEditTransaction(tx)} 
                                    onDelete={() => onDeleteTransaction(tx.id)}
                                />
                            ))}
                        </tbody>
                    </table>
                     {sortedTransactions.length === 0 && (
                        <p className="text-center py-8 text-cosmic-text-secondary">No transactions recorded for this period.</p>
                    )}
                </div>
            </div>
            <style>{`.date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }`}</style>
        </div>
    );
};