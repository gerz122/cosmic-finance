
import React, { useMemo } from 'react';
import type { FinancialStatement as FinancialStatementType, User, Team } from '../types';
import { TransactionType } from '../types';

interface FinancialStatementProps {
    statement: FinancialStatementType;
    user: User;
    teamMates: User[];
    team?: Team; // Optional team context
    onGenerateReport?: () => void; // Optional report generation handler
}

const StatCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-cosmic-surface p-4 rounded-lg border border-cosmic-border">
        <h3 className="text-cosmic-text-secondary text-sm">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-cosmic-surface rounded-lg border border-cosmic-border overflow-hidden">
        <h3 className="p-4 text-lg font-bold text-cosmic-text-primary border-b border-cosmic-border">{title}</h3>
        <div className="p-4 space-y-3">{children}</div>
    </div>
);

const DataRow: React.FC<{ label: string; value: string; isPositive?: boolean; isNegative?: boolean; }> = ({ label, value, isPositive, isNegative }) => (
    <div className="flex justify-between items-center text-cosmic-text-primary text-sm py-1">
        <span>{label}</span>
        <span className={`font-semibold ${isPositive ? 'text-cosmic-success' : ''} ${isNegative ? 'text-cosmic-danger' : ''}`}>{value}</span>
    </div>
);


export const FinancialStatement: React.FC<FinancialStatementProps> = ({ statement, user, team, onGenerateReport }) => {
    const {
        totalIncome,
        passiveIncome,
        activeIncome,
        totalExpenses,
        monthlyCashflow,
        totalAssets,
        totalLiabilities,
        netWorth,
    } = useMemo(() => {
        let userTotalIncome = 0;
        let userPassiveIncome = 0;
        let userActiveIncome = 0;
        let userTotalExpenses = 0;

        statement.transactions.forEach(t => {
            if (team) { // If in team context, sum total amounts
                if (t.type === TransactionType.INCOME) {
                    userTotalIncome += t.amount;
                    if(t.isPassive) userPassiveIncome += t.amount;
                    else userActiveIncome += t.amount;
                } else {
                    userTotalExpenses += t.amount;
                }
            } else { // Personal context, calculate user's share
                if (t.type === TransactionType.INCOME) {
                    const userPaymentShare = t.paymentShares.find(s => s.userId === user.id);
                    if (userPaymentShare) {
                         userTotalIncome += userPaymentShare.amount;
                        if (t.isPassive) userPassiveIncome += userPaymentShare.amount;
                        else userActiveIncome += userPaymentShare.amount;
                    }
                } else { // Expense
                    const userExpenseShare = t.expenseShares?.find(s => s.userId === user.id);
                    if (userExpenseShare) {
                        userTotalExpenses += userExpenseShare.amount;
                    }
                }
            }
        });

        const monthlyCashflow = userTotalIncome - userTotalExpenses;
        const totalAssets = statement.assets.reduce((sum, a) => sum + a.value, 0);
        const totalLiabilities = statement.liabilities.reduce((sum, l) => sum + l.balance, 0);
        const netWorth = totalAssets - totalLiabilities;
        return { 
            totalIncome: userTotalIncome, 
            passiveIncome: userPassiveIncome, 
            activeIncome: userActiveIncome, 
            totalExpenses: userTotalExpenses, 
            monthlyCashflow, 
            totalAssets, 
            totalLiabilities, 
            netWorth 
        };
    }, [statement, user.id, team]);


    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Financial Statement for {team ? team.name : user.name}</h1>
                {onGenerateReport && (
                    <button onClick={onGenerateReport} className="bg-cosmic-surface border border-cosmic-border text-cosmic-primary px-4 py-2 rounded-lg font-semibold hover:bg-cosmic-border transition-colors">
                        Generate Report
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Monthly Cash Flow" value={`$${monthlyCashflow.toFixed(2)}`} color={monthlyCashflow >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'} />
                <StatCard title="Passive Income" value={`$${passiveIncome.toFixed(2)}`} color="text-cosmic-primary" />
                <StatCard title="Total Expenses" value={`$${totalExpenses.toFixed(2)}`} color="text-cosmic-secondary" />
                <StatCard title="Net Worth" value={`$${netWorth.toFixed(2)}`} color="text-white" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income Statement */}
                <Section title="Income Statement (Monthly)">
                    <DataRow label="Active Income" value={`$${activeIncome.toFixed(2)}`} isPositive />
                    <DataRow label="Passive Income" value={`$${passiveIncome.toFixed(2)}`} isPositive />
                    <hr className="border-cosmic-border" />
                    <DataRow label="Total Income" value={`$${totalIncome.toFixed(2)}`} isPositive />
                    <hr className="border-cosmic-border my-2" />
                    {statement.transactions.filter(t => t.type === TransactionType.EXPENSE).map(tx => (
                         <DataRow key={tx.id} label={tx.description} value={`-$${tx.amount.toFixed(2)}`} />
                    ))}
                    <hr className="border-cosmic-border" />
                    <DataRow label="Total Expenses" value={`-$${totalExpenses.toFixed(2)}`} isNegative />
                    <hr className="border-cosmic-border my-2" />
                    <div className="bg-cosmic-bg p-3 rounded-md">
                        <DataRow label="Monthly Net Cash Flow" value={`$${monthlyCashflow.toFixed(2)}`} isPositive={monthlyCashflow >= 0} isNegative={monthlyCashflow < 0}/>
                    </div>
                </Section>

                {/* Balance Sheet */}
                <Section title="Balance Sheet">
                    <h4 className="font-bold text-cosmic-primary">Assets</h4>
                    {statement.assets.map(asset => (
                        <DataRow key={asset.id} label={asset.name} value={`$${asset.value.toFixed(2)}`} />
                    ))}
                    <hr className="border-cosmic-border" />
                    <DataRow label="Total Assets" value={`$${totalAssets.toFixed(2)}`} isPositive />
                    
                    <h4 className="font-bold text-cosmic-secondary mt-4">Liabilities</h4>
                    {statement.liabilities.map(lia => (
                        <DataRow key={lia.id} label={lia.name} value={`$${lia.balance.toFixed(2)}`} />
                    ))}
                    <hr className="border-cosmic-border" />
                    <DataRow label="Total Liabilities" value={`$${totalLiabilities.toFixed(2)}`} isNegative />

                    <hr className="border-cosmic-border my-2" />
                    <div className="bg-cosmic-bg p-3 rounded-md">
                         <DataRow label="Net Worth" value={`$${netWorth.toFixed(2)}`} isPositive={netWorth >= 0} isNegative={netWorth < 0}/>
                    </div>
                </Section>
            </div>
        </div>
    );
};