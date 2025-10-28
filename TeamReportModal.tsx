import React, { useState, useMemo } from 'react';
import type { Team, Transaction } from './types';
import { TransactionType } from './types';
import { XIcon } from './components/icons';

interface TeamReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team | null;
}

const TeamReportModal: React.FC<TeamReportModalProps> = ({ isOpen, onClose, team }) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(firstDayOfMonth);
    const [endDate, setEndDate] = useState(today);

    const { income, expenses, profit, filteredTransactions } = useMemo(() => {
        if (!team) return { income: 0, expenses: 0, profit: 0, filteredTransactions: [] };

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const transactions = team.financialStatement.transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= start && txDate <= end;
        });

        const totalIncome = transactions.filter(tx => tx.type === TransactionType.INCOME).reduce((sum, tx) => sum + tx.amount, 0);
        const totalExpenses = transactions.filter(tx => tx.type === TransactionType.EXPENSE).reduce((sum, tx) => sum + tx.amount, 0);

        return {
            income: totalIncome,
            expenses: totalExpenses,
            profit: totalIncome - totalExpenses,
            filteredTransactions: transactions
        };
    }, [team, startDate, endDate]);
    
    const handleExportCSV = () => {
        if (filteredTransactions.length === 0) return;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Date,Description,Category,Type,Amount\n";
        
        filteredTransactions.forEach(tx => {
            const row = [tx.date, `"${tx.description}"`, tx.category, tx.type, tx.amount].join(",");
            csvContent += row + "\r\n";
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${team?.name}_report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen || !team) return null;

    return (
        <div className="fixed inset-0 bg-cosmic-bg bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-cosmic-surface rounded-lg border border-cosmic-border w-full max-w-2xl shadow-2xl p-6 m-4 animate-slide-in-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-cosmic-text-primary">Team Report: {team.name}</h2>
                        <p className="text-cosmic-text-secondary">Profit & Loss Statement</p>
                    </div>
                    <button onClick={onClose} className="text-cosmic-text-secondary hover:text-cosmic-text-primary"><XIcon className="w-6 h-6" /></button>
                </div>

                <div className="flex flex-wrap gap-4 items-center mb-4 p-4 bg-cosmic-bg rounded-lg border border-cosmic-border">
                    <div className="flex items-center gap-2">
                        <label htmlFor="startDate" className="text-sm">From:</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-cosmic-surface border border-cosmic-border rounded p-1.5 text-sm" />
                    </div>
                     <div className="flex items-center gap-2">
                        <label htmlFor="endDate" className="text-sm">To:</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-cosmic-surface border border-cosmic-border rounded p-1.5 text-sm" />
                    </div>
                     <button onClick={handleExportCSV} className="ml-auto bg-cosmic-primary text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-blue-400">Export as CSV</button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-cosmic-bg p-4 rounded-lg text-center"><p className="text-sm text-cosmic-text-secondary">Total Income</p><p className="text-2xl font-bold text-cosmic-success">${income.toFixed(2)}</p></div>
                    <div className="bg-cosmic-bg p-4 rounded-lg text-center"><p className="text-sm text-cosmic-text-secondary">Total Expenses</p><p className="text-2xl font-bold text-cosmic-danger">${expenses.toFixed(2)}</p></div>
                    <div className="bg-cosmic-bg p-4 rounded-lg text-center"><p className="text-sm text-cosmic-text-secondary">Net Profit / Loss</p><p className={`text-2xl font-bold ${profit >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>${profit.toFixed(2)}</p></div>
                </div>

                <div className="overflow-y-auto flex-grow">
                    <table className="w-full text-sm">
                         <thead className="text-left text-cosmic-text-secondary bg-cosmic-bg sticky top-0">
                            <tr><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2">Category</th><th className="p-2 text-right">Amount</th></tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                                <tr key={tx.id} className="border-b border-cosmic-border last:border-0">
                                    <td className="p-2">{tx.date}</td>
                                    <td className="p-2 text-cosmic-text-primary">{tx.description}</td>
                                    <td className="p-2">{tx.category}</td>
                                    <td className={`p-2 text-right font-semibold ${tx.type === TransactionType.INCOME ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>{tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {filteredTransactions.length === 0 && <p className="text-center text-cosmic-text-secondary py-8">No transactions in this period.</p>}
                </div>

            </div>
        </div>
    );
};

export default TeamReportModal;