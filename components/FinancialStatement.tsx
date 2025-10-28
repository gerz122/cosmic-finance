import React, { useMemo } from 'react';
import type { FinancialStatement as FinancialStatementType, User, Team, Transaction } from '../types';
import { TransactionType } from '../types';

interface FinancialStatementProps {
    statement: FinancialStatementType;
    user: User;
    teamMates: User[];
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

export const FinancialStatement: React.FC<FinancialStatementProps> = ({ statement, user, team, onEditTransaction, onDeleteTransaction }) => {
    const {
        monthlyCashflow,
        passiveIncome,
        totalExpenses,
        netWorth,
    } = useMemo(() => {
        // If a team is passed, calculate totals for the entire team.
        // Otherwise, calculate totals for the current user's share.
        if (team) {
            const teamPassiveIncome = statement.transactions
                .filter(t => t.type === TransactionType.INCOME && t.isPassive)
                .reduce((sum, t) => sum + t.amount, 0);
            const teamTotalExpenses = statement.transactions
                .filter(t => t.type === TransactionType.EXPENSE)
                .reduce((sum, t) => sum + t.amount, 0);
            const teamTotalIncome = statement.transactions
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
            // User-specific calculation
            let userTotalIncome = 0;
            let userPassiveIncome = 0;
            let userTotalExpenses = 0;

            statement.transactions.forEach(t => {
                const userPaymentShare = t.paymentShares.find(s => s.userId === user.id)?.amount || 0;
                const userExpenseShare = t.expenseShares?.find(s => s.userId === user.id)?.amount || 0;

                if (t.type === TransactionType.INCOME) {
                    userTotalIncome += userPaymentShare;
                    if (t.isPassive) userPassiveIncome += userPaymentShare;
                } else {
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
    }, [statement, user.id, team]);

    const sortedTransactions = useMemo(() => {
        return [...statement.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [statement.transactions]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-cosmic-text-primary">Financial Statement</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Monthly Cash Flow" value={`$${monthlyCashflow.toFixed(2)}`} color={monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} />
                <StatCard title="Passive Income" value={`$${passiveIncome.toFixed(2)}`} color="text-cosmic-primary" />
                <StatCard title="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} color="text-cosmic-secondary" />
                <StatCard title="Net Worth" value={`$${netWorth.toFixed(2)}`} color="text-white" />
            </div>

            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border overflow-hidden">
                <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">All Transactions</h3>
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
                        <p className="text-center py-8 text-cosmic-text-secondary">No transactions recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
