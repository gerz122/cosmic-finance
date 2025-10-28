import type { User, Team, Transaction, HistoricalDataPoint } from '../types';
import { TransactionType } from '../types';

export const generateHistoricalData = (user: User, teams: Team[]): HistoricalDataPoint[] => {
    if (!user) return [];

    const userTeams = teams.filter(t => t.memberIds.includes(user.id));
    
    // Combine all relevant transactions
    const allTransactions: Transaction[] = [
        ...user.financialStatement.transactions,
        ...userTeams.flatMap(t => t.financialStatement.transactions)
    ];
    
    // Ensure uniqueness and sort by date
    const uniqueTransactions = Array.from(new Map(allTransactions.map(t => [t.id, t])).values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningNetWorth = 0;
    const monthlyData: { [key: string]: { cashFlow: number; passiveIncome: number; expenses: number } } = {};
    const dataPoints: HistoricalDataPoint[] = [];

    // Calculate initial Net Worth from non-transactional assets/liabilities
    user.financialStatement.assets.forEach(a => {
        let share = 1.0;
        if (a.shares) {
            share = (a.shares.find(s => s.userId === user.id)?.percentage || 0) / 100;
        } else if (a.teamId) {
            share = 0; // Handled separately
        }
        runningNetWorth += a.value * share;
    });
    user.financialStatement.liabilities.forEach(l => {
         let share = 1.0;
        if (l.shares) {
            share = (l.shares.find(s => s.userId === user.id)?.percentage || 0) / 100;
        } else if (l.teamId) {
            share = 0; // Handled separately
        }
        runningNetWorth -= l.balance * share;
    });

    userTeams.forEach(team => {
        const userShare = 1 / team.memberIds.length;
        team.financialStatement.assets.forEach(a => runningNetWorth += a.value * userShare);
        team.financialStatement.liabilities.forEach(l => runningNetWorth -= l.balance * userShare);
    });
    
    uniqueTransactions.forEach(tx => {
        const month = tx.date.slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { cashFlow: 0, passiveIncome: 0, expenses: 0 };
        }
        
        let userAmount = 0;

        if (tx.type === TransactionType.INCOME) {
            const incomeShare = tx.paymentShares.find(ps => ps.userId === user.id);
            if (incomeShare) {
                userAmount = incomeShare.amount;
                runningNetWorth += userAmount;
                monthlyData[month].cashFlow += userAmount;
                if (tx.isPassive) {
                    monthlyData[month].passiveIncome += userAmount;
                }
            } else if (tx.teamId) {
                const team = teams.find(t => t.id === tx.teamId);
                if (team && team.memberIds.includes(user.id)) {
                    const shareAmount = tx.amount / team.memberIds.length;
                    userAmount = shareAmount;
                    runningNetWorth += userAmount;
                    monthlyData[month].cashFlow += userAmount;
                    if (tx.isPassive) {
                       monthlyData[month].passiveIncome += userAmount;
                    }
                }
            }
        } else { // EXPENSE
            const expenseShare = tx.expenseShares?.find(es => es.userId === user.id);
             if (expenseShare) {
                userAmount = expenseShare.amount;
                runningNetWorth -= userAmount;
                monthlyData[month].cashFlow -= userAmount;
                monthlyData[month].expenses += userAmount;
            } else if (tx.teamId) {
                const team = teams.find(t => t.id === tx.teamId);
                if (team && team.memberIds.includes(user.id)) {
                    const shareAmount = tx.amount / team.memberIds.length;
                    userAmount = shareAmount;
                    runningNetWorth -= userAmount;
                    monthlyData[month].cashFlow -= userAmount;
                    monthlyData[month].expenses += userAmount;
                }
            }
        }
        
        dataPoints.push({
            date: tx.date,
            netWorth: runningNetWorth,
        });
    });

    // Aggregate monthly data into the final data points array
    const finalData: { [date: string]: any } = {};
    dataPoints.forEach(dp => {
        finalData[dp.date] = { ...finalData[dp.date], netWorth: dp.netWorth };
    });

    Object.keys(monthlyData).forEach(month => {
        const lastDayOfMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
        const dateKey = `${month}-${String(lastDayOfMonth).padStart(2, '0')}`;
        finalData[dateKey] = {
            ...finalData[dateKey],
            cashFlow: monthlyData[month].cashFlow,
            passiveIncome: monthlyData[month].passiveIncome,
            expenses: monthlyData[month].expenses,
        };
    });

    return Object.keys(finalData)
        .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
        .map(date => ({ date, ...finalData[date] }));
};