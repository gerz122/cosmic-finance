import React, { useMemo, useState } from 'react';
import type { FinancialStatement as FinancialStatementType, User, Team, Transaction, Asset, Liability } from '../types';
import { TransactionType } from '../types';

interface FinancialStatementProps {
    statement: FinancialStatementType;
    user: User;
    allUsers: User[];
    teams: Team[];
    team?: Team;
    onEditTransaction: (transaction: Transaction) => void;
    onDeleteTransaction: (transactionId: string) => void;
    onViewReceipt: (url: string) => void;
    onViewSplitDetails: (transaction: Transaction) => void;
}

const TransactionRowWithDetails: React.FC<{ tx: Transaction, allUsers: User[], onEdit: () => void, onDelete: () => void, onViewReceipt: (url: string) => void, onViewSplitDetails: (transaction: Transaction) => void }> = ({ tx, allUsers, onEdit, onDelete, onViewReceipt, onViewSplitDetails }) => {
    const isIncome = tx.type === TransactionType.INCOME;
    
    const findUserAvatar = (userId: string) => allUsers.find(userRecord => userRecord.id === userId)?.avatar;

    return (
        <tr className="border-b border-cosmic-border last:border-b-0 hover:bg-cosmic-bg group text-sm">
            <td className="px-2 py-2 text-cosmic-text-secondary">{new Date(tx.date).toLocaleDateString()}</td>
            <td className="px-2 py-2 text-cosmic-text-primary font-medium">{tx.description}</td>
            <td className="px-2 py-2 text-cosmic-text-secondary">{tx.category}</td>
             <td className="px-2 py-2">
                <button onClick={() => onViewSplitDetails(tx)} className="flex -space-x-2 hover:opacity-80 transition-opacity">
                    {tx.paymentShares.map(paymentShare => {
                        const avatar = findUserAvatar(paymentShare.userId);
                        return avatar ? <img key={paymentShare.userId} src={avatar} alt={paymentShare.userId} className="w-6 h-6 rounded-full border-2 border-cosmic-surface" title={`${allUsers.find(u => u.id === paymentShare.userId)?.name} paid $${paymentShare.amount.toFixed(2)}`} /> : null;
                    })}
                </button>
            </td>
             <td className="px-2 py-2">
                <button onClick={() => onViewSplitDetails(tx)} className="flex -space-x-2 hover:opacity-80 transition-opacity">
                    {tx.expenseShares?.map(expenseShare => {
                         const avatar = findUserAvatar(expenseShare.userId);
                         return avatar ? <img key={expenseShare.userId} src={avatar} alt={expenseShare.userId} className="w-6 h-6 rounded-full border-2 border-cosmic-surface" title={`${allUsers.find(u => u.id === expenseShare.userId)?.name}'s share was $${expenseShare.amount.toFixed(2)}`} /> : null;
                    })}
                </button>
            </td>
            <td className={`px-2 py-2 font-semibold text-right ${isIncome ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                {isIncome ? '+' : '-'}${tx.amount.toFixed(2)}
            </td>
             <td className="px-2 py-2 text-center">
                {tx.receiptUrl && (
                    <button onClick={() => onViewReceipt(tx.receiptUrl!)} className="text-cosmic-text-secondary hover:text-cosmic-primary">
                        📎
                    </button>
                )}
            </td>
            <td className="px-2 py-2 text-right">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                    <button onClick={onEdit} className="text-yellow-500 hover:underline text-xs font-semibold">EDIT</button>
                    <button onClick={onDelete} className="text-red-500 hover:underline text-xs font-semibold">DEL</button>
                </div>
            </td>
        </tr>
    );
};

export const FinancialStatement: React.FC<FinancialStatementProps> = ({ statement, user, allUsers, teams, team, onEditTransaction, onDeleteTransaction, onViewReceipt, onViewSplitDetails }) => {
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
        return statement.transactions.filter(transactionRecord => {
            const txDate = new Date(transactionRecord.date + 'T00:00:00');
            const start = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
            const end = dateRange.end ? new Date(dateRange.end + 'T00:00:00') : null;
            if (start && txDate < start) return false;
            if (end && txDate > end) return false;
            if (categoryFilter !== 'all' && transactionRecord.category !== categoryFilter) return false;
            return true;
        }).sort((txA, txB) => new Date(txB.date).getTime() - new Date(txA.date).getTime());
    }, [statement.transactions, dateRange, categoryFilter]);

    const { income, passiveIncome, expenses, monthlyCashflow, netWorth, assets, liabilities } = useMemo(() => {
        let totalIncome = 0, totalPassive = 0, totalExpenses = 0;
        
        const relevantTransactions = dateRange.start || dateRange.end || categoryFilter !== 'all' ? filteredTransactions : statement.transactions;

        relevantTransactions.forEach(transactionRecord => {
            if (transactionRecord.type === TransactionType.INCOME) {
                let incomeShare = 0;
                if(team) {
                    incomeShare = transactionRecord.amount;
                } else {
                    const userShare = transactionRecord.paymentShares.find(shareDetail => shareDetail.userId === user.id)?.amount;
                    if(userShare) {
                        incomeShare = userShare;
                    } else if (transactionRecord.teamId) {
                        const teamData = teams.find(teamMember => teamMember.id === transactionRecord.teamId);
                        if(teamData) incomeShare = transactionRecord.amount / teamData.memberIds.length;
                    }
                }
                totalIncome += incomeShare;
                if(transactionRecord.isPassive) totalPassive += incomeShare;
            } else { // EXPENSE
                let expenseShare = 0;
                 if(team) {
                    expenseShare = transactionRecord.amount;
                 } else {
                    const userShare = transactionRecord.expenseShares?.find(shareDetail => shareDetail.userId === user.id)?.amount;
                     if (userShare) {
                        expenseShare = userShare;
                    } else if (transactionRecord.teamId) {
                        const teamData = teams.find(teamMember => teamMember.id === transactionRecord.teamId);
                        if(teamData) expenseShare = transactionRecord.amount / teamData.memberIds.length;
                    }
                }
                totalExpenses += expenseShare;
            }
        });

        const cashflow = totalIncome - totalExpenses;
        
        let totalAssets = 0;
        statement.assets.forEach(assetRecord => {
            if(team) {
                totalAssets += assetRecord.value;
            } else {
                 let share = 1.0;
                if(assetRecord.shares) share = (assetRecord.shares.find(shareDetail => shareDetail.userId === user.id)?.percentage || 0) / 100;
                else if (assetRecord.teamId) {
                    const teamData = teams.find(teamMember => teamMember.id === assetRecord.teamId);
                    if(teamData) share = 1 / teamData.memberIds.length; else share = 0;
                }
                totalAssets += assetRecord.value * share;
            }
        });
        
        let totalLiabilities = 0;
        statement.liabilities.forEach(liabilityRecord => {
             if(team) {
                totalLiabilities += liabilityRecord.balance;
            } else {
                let share = 1.0;
                if(liabilityRecord.shares) share = (liabilityRecord.shares.find(shareDetail => shareDetail.userId === user.id)?.percentage || 0) / 100;
                else if (liabilityRecord.teamId) {
                    const teamData = teams.find(teamMember => teamMember.id === liabilityRecord.teamId);
                    if(teamData) share = 1 / teamData.memberIds.length; else share = 0;
                }
                totalLiabilities += liabilityRecord.balance * share;
            }
        });

        const totalNetWorth = totalAssets - totalLiabilities;
        
        return {
            income: totalIncome,
            passiveIncome: totalPassive,
            expenses: totalExpenses,
            monthlyCashflow: cashflow,
            netWorth: totalNetWorth,
            assets: statement.assets,
            liabilities: statement.liabilities,
        };
    }, [filteredTransactions, statement, user.id, team, teams, dateRange, categoryFilter]);
    
    const handleExport = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Description,Category,Type,Is Passive,Amount,Paid By,Expense For\n";

        filteredTransactions.forEach(tx => {
            const paidBy = tx.paymentShares.map(p => `${allUsers.find(u => u.id === p.userId)?.name}: ${p.amount.toFixed(2)}`).join('; ');
            const expenseFor = (tx.expenseShares || []).map(e => `${allUsers.find(u => u.id === e.userId)?.name}: ${e.amount.toFixed(2)}`).join('; ');
            const row = [
                tx.date,
                `"${tx.description.replace(/"/g, '""')}"`,
                tx.category,
                tx.type,
                tx.isPassive ? 'Yes' : 'No',
                tx.amount.toFixed(2),
                `"${paidBy}"`,
                `"${expenseFor}"`,
            ].join(',');
            csvContent += row + "\r\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "financial_statement.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const incomeTransactions = filteredTransactions.filter(transactionRecord => transactionRecord.type === TransactionType.INCOME);
    const expenseTransactions = filteredTransactions.filter(transactionRecord => transactionRecord.type === TransactionType.EXPENSE);

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
                <button onClick={handleExport} className="ml-auto bg-cosmic-primary text-white text-xs font-semibold px-3 py-2 rounded-md hover:bg-blue-400">Export to CSV</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Statement */}
                <div className="bg-cosmic-surface rounded-lg border border-cosmic-border space-y-4 p-4">
                    <h2 className="text-xl font-bold text-center text-cosmic-text-primary">Income Statement</h2>
                    {/* Income */}
                    <div className="bg-cosmic-bg p-3 rounded-lg">
                        <h3 className="font-semibold text-cosmic-success mb-2">Income</h3>
                        <div className="max-h-60 overflow-y-auto pr-2">
                            {incomeTransactions.map(tx => <p key={tx.id} className="flex justify-between text-sm py-1 border-b border-cosmic-border last:border-0"><span>{tx.description}</span><span>+${tx.amount.toFixed(2)}</span></p>)}
                            {incomeTransactions.length === 0 && <p className="text-xs text-cosmic-text-secondary">No income this period.</p>}
                        </div>
                        <div className="font-bold text-right mt-2 text-cosmic-success">Total: ${income.toFixed(2)}</div>
                        <div className="font-semibold text-right mt-1 text-sm text-cosmic-primary">Passive: ${passiveIncome.toFixed(2)}</div>
                    </div>
                     {/* Expenses */}
                    <div className="bg-cosmic-bg p-3 rounded-lg">
                        <h3 className="font-semibold text-cosmic-danger mb-2">Expenses</h3>
                         <div className="max-h-60 overflow-y-auto pr-2">
                           {expenseTransactions.map(tx => <p key={tx.id} className="flex justify-between text-sm py-1 border-b border-cosmic-border last:border-0"><span>{tx.description}</span><span>-${tx.amount.toFixed(2)}</span></p>)}
                           {expenseTransactions.length === 0 && <p className="text-xs text-cosmic-text-secondary">No expenses this period.</p>}
                        </div>
                        <div className="font-bold text-right mt-2 text-cosmic-danger">Total: ${expenses.toFixed(2)}</div>
                    </div>
                     {/* Cashflow */}
                     <div className="text-center bg-cosmic-bg p-4 rounded-lg">
                        <h3 className="font-semibold text-cosmic-text-secondary">Monthly Cash Flow</h3>
                        <p className={`text-3xl font-bold ${monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>${monthlyCashflow.toFixed(2)}</p>
                    </div>
                </div>

                {/* Balance Sheet */}
                <div className="bg-cosmic-surface rounded-lg border border-cosmic-border space-y-4 p-4">
                    <h2 className="text-xl font-bold text-center text-cosmic-text-primary">Balance Sheet</h2>
                    {/* Assets */}
                    <div className="bg-cosmic-bg p-3 rounded-lg">
                        <h3 className="font-semibold text-cosmic-primary mb-2">Assets</h3>
                        <div className="max-h-60 overflow-y-auto pr-2">
                           {assets.map(assetItem => <p key={assetItem.id} className="flex justify-between text-sm py-1 border-b border-cosmic-border last:border-0"><span>{assetItem.name}</span><span>${assetItem.value.toLocaleString()}</span></p>)}
                        </div>
                        <div className="font-bold text-right mt-2 text-cosmic-primary">Total: ${assets.reduce((sum, assetItem)=>sum+assetItem.value,0).toLocaleString()}</div>
                    </div>
                    {/* Liabilities */}
                    <div className="bg-cosmic-bg p-3 rounded-lg">
                        <h3 className="font-semibold text-cosmic-secondary mb-2">Liabilities</h3>
                        <div className="max-h-60 overflow-y-auto pr-2">
                            {liabilities.map(liabilityItem => <p key={liabilityItem.id} className="flex justify-between text-sm py-1 border-b border-cosmic-border last:border-0"><span>{liabilityItem.name}</span><span>${liabilityItem.balance.toLocaleString()}</span></p>)}
                        </div>
                         <div className="font-bold text-right mt-2 text-cosmic-secondary">Total: ${liabilities.reduce((sum, liabilityItem)=>sum+liabilityItem.balance,0).toLocaleString()}</div>
                    </div>
                     {/* Net Worth */}
                     <div className="text-center bg-cosmic-bg p-4 rounded-lg">
                        <h3 className="font-semibold text-cosmic-text-secondary">Net Worth</h3>
                        <p className="text-3xl font-bold text-white">${netWorth.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border overflow-hidden">
                <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">Transaction Ledger (for period)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-cosmic-bg text-left text-cosmic-text-secondary">
                            <tr>
                                <th className="px-2 py-2 font-semibold">Date</th>
                                <th className="px-2 py-2 font-semibold">Description</th>
                                <th className="px-2 py-2 font-semibold">Category</th>
                                <th className="px-2 py-2 font-semibold">Paid By</th>
                                <th className="px-2 py-2 font-semibold">For Whom</th>
                                <th className="px-2 py-2 font-semibold text-right">Amount</th>
                                <th className="px-2 py-2 font-semibold text-center">Receipt</th>
                                <th className="px-2 py-2 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map(tx => (
                                <TransactionRowWithDetails
                                    key={tx.id}
                                    tx={tx}
                                    allUsers={allUsers}
                                    onEdit={() => onEditTransaction(tx)}
                                    onDelete={() => onDeleteTransaction(tx.id)}
                                    onViewReceipt={onViewReceipt}
                                    onViewSplitDetails={onViewSplitDetails}
                                />
                            ))}
                        </tbody>
                    </table>
                     {filteredTransactions.length === 0 && (
                        <p className="text-center py-8 text-cosmic-text-secondary">No transactions recorded for this period.</p>
                    )}
                </div>
            </div>
            <style>{`.date-input::-webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }`}</style>
        </div>
    );
};