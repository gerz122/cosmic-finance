import React, { useMemo } from 'react';
import type { User, Team, Transaction } from '../types';
import { TransactionType } from '../types';

interface BalancesProps {
    currentUser: User;
    allUsers: User[];
    teams: Team[];
    onSettleUp: () => void;
}

interface Balance {
    userId: string;
    userName: string;
    avatar: string;
    amount: number; // positive: group owes them; negative: they owe the group
}

export const Balances: React.FC<BalancesProps> = ({ currentUser, allUsers, teams, onSettleUp }) => {
    
    const balances = useMemo((): Balance[] => {
        const balanceMap: { [userId: string]: number } = {};
        allUsers.forEach(userToMap => balanceMap[userToMap.id] = 0);

        const allSharedTransactions = [
            ...teams.flatMap(teamData => teamData.financialStatement?.transactions || []),
            ...allUsers.flatMap(userData => userData.financialStatement?.transactions || [])
        ].filter(transactionRecord => transactionRecord.type === TransactionType.EXPENSE && transactionRecord.expenseShares && transactionRecord.expenseShares.length > 0);

        const uniqueTransactions = Array.from(new Map(allSharedTransactions.map(transactionToMap => [transactionToMap.id, transactionToMap])).values());
        
        uniqueTransactions.forEach(transactionRecord => {
            if (transactionRecord.type === TransactionType.EXPENSE && transactionRecord.expenseShares) {
                transactionRecord.paymentShares.forEach(payment => {
                    balanceMap[payment.userId] = (balanceMap[payment.userId] || 0) + payment.amount;
                });

                transactionRecord.expenseShares.forEach(expense => {
                    balanceMap[expense.userId] = (balanceMap[expense.userId] || 0) - expense.amount;
                });
            }
        });

        return allUsers
            .map(userRecord => ({
                userId: userRecord.id,
                userName: userRecord.name,
                avatar: userRecord.avatar,
                amount: balanceMap[userRecord.id] || 0,
            }))
            .filter(balance => Math.abs(balance.amount) > 0.01);
            
    }, [allUsers, teams]);

    const myNetBalance = balances.find(balance => balance.userId === currentUser.id)?.amount || 0;
    
    const netOwedToMe = Math.max(0, myNetBalance);
    const netOwedByMe = Math.max(0, -myNetBalance);


    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-cosmic-text-primary">Balances</h1>
                <p className="text-cosmic-text-secondary">Track who owes who across all personal and team games.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border text-center">
                    <h2 className="text-cosmic-text-secondary font-medium">Overall, you are owed</h2>
                    <p className="text-4xl font-bold text-cosmic-success mt-2">${netOwedToMe.toFixed(2)}</p>
                </div>
                 <div className="bg-cosmic-surface p-6 rounded-xl border border-cosmic-border text-center">
                    <h2 className="text-cosmic-text-secondary font-medium">Overall, you owe</h2>
                    <p className="text-4xl font-bold text-cosmic-danger mt-2">${netOwedByMe.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-cosmic-surface p-4 rounded-xl border border-cosmic-border">
                <h2 className="text-xl font-bold text-cosmic-text-primary mb-4 px-2">Player Net Balances</h2>
                <div className="space-y-2">
                    {balances.length === 0 && <p className="text-center py-8 text-cosmic-text-secondary">All balances are settled up!</p>}
                    {balances.sort((balanceA, balanceB) => balanceB.amount - balanceA.amount).map(balance => (
                        <div key={balance.userId} className="flex justify-between items-center p-3 bg-cosmic-bg rounded-lg">
                            <div className="flex items-center gap-3">
                                <img src={balance.avatar} alt={balance.userName} className="w-10 h-10 rounded-full" />
                                <div>
                                    <p className="font-semibold text-cosmic-text-primary">{balance.userName} {balance.userId === currentUser.id ? '(You)' : ''}</p>
                                    <p className={`text-sm font-medium ${balance.amount >= 0 ? 'text-cosmic-success' : 'text-cosmic-danger'}`}>
                                        {balance.amount >= 0 ? `Is owed $${balance.amount.toFixed(2)}` : `Owes $${Math.abs(balance.amount).toFixed(2)}`}
                                    </p>
                                </div>
                            </div>
                            {balance.amount < 0 && balance.userId === currentUser.id && (
                                <button onClick={onSettleUp} className="bg-cosmic-primary text-white font-bold py-1 px-3 text-sm rounded-lg hover:bg-blue-400 transition-colors">
                                    Settle Up
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
