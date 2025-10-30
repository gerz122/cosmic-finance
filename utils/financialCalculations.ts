import type { User, Team, Transaction, HistoricalDataPoint } from '../types';
import { TransactionType } from '../types';

export const generateHistoricalData = (user: User, teams: Team[]): HistoricalDataPoint[] => {
    if (!user) return [];

    const userTeams = teams.filter(teamInstance => teamInstance.memberIds.includes(user.id));
    
    // Combine all relevant transactions
    const allTransactions: Transaction[] = [
        ...user.financialStatement.transactions,
        ...userTeams.flatMap(teamData => teamData.financialStatement.transactions)
    ];
    
    // Ensure uniqueness and sort by date
    const uniqueTransactions = Array.from(new Map(allTransactions.map(transactionToMap => [transactionToMap.id, transactionToMap])).values())
        .sort((txA, txB) => new Date(txA.date).getTime() - new Date(txB.date).getTime());

    let runningNetWorth = 0;
    const monthlyData: { [key: string]: { cashFlow: number; passiveIncome: number; expenses: number } } = {};
    const dataPoints: HistoricalDataPoint[] = [];

    // Calculate initial Net Worth from non-transactional assets/liabilities
    user.financialStatement.assets.forEach(assetRecord => {
        let share = 1.0;
        if (assetRecord.shares) {
            share = (assetRecord.shares.find(shareDetail => shareDetail.userId === user.id)?.percentage || 0) / 100;
        } else if (assetRecord.teamId) {
            share = 0; // Handled separately
        }
        runningNetWorth += assetRecord.value * share;
    });
    user.financialStatement.liabilities.forEach(liabilityRecord => {
         let share = 1.0;
        if (liabilityRecord.shares) {
            share = (liabilityRecord.shares.find(shareDetail => shareDetail.userId === user.id)?.percentage || 0) / 100;
        } else if (liabilityRecord.teamId) {
            share = 0; // Handled separately
        }
        runningNetWorth -= liabilityRecord.balance * share;
    });

    userTeams.forEach(teamForCalc => {
        const userShare = 1 / teamForCalc.memberIds.length;
        teamForCalc.financialStatement.assets.forEach(teamAsset => runningNetWorth += teamAsset.value * userShare);
        teamForCalc.financialStatement.liabilities.forEach(teamLiability => runningNetWorth -= teamLiability.balance * userShare);
    });
    
    uniqueTransactions.forEach(transactionForHistory => {
        const month = transactionForHistory.date.slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
            monthlyData[month] = { cashFlow: 0, passiveIncome: 0, expenses: 0 };
        }
        
        let userAmount = 0;

        if (transactionForHistory.type === TransactionType.INCOME) {
            const incomeShare = transactionForHistory.paymentShares.find(paymentShareDetail => paymentShareDetail.userId === user.id);
            if (incomeShare) {
                userAmount = incomeShare.amount;
                runningNetWorth += userAmount;
                monthlyData[month].cashFlow += userAmount;
                if (transactionForHistory.isPassive) {
                    monthlyData[month].passiveIncome += userAmount;
                }
            } else if (transactionForHistory.teamId) {
                const team = teams.find(teamRecord => teamRecord.id === transactionForHistory.teamId);
                if (team && team.memberIds.includes(user.id)) {
                    const shareAmount = transactionForHistory.amount / team.memberIds.length;
                    userAmount = shareAmount;
                    runningNetWorth += userAmount;
                    monthlyData[month].cashFlow += userAmount;
                    if (transactionForHistory.isPassive) {
                       monthlyData[month].passiveIncome += userAmount;
                    }
                }
            }
        } else { // EXPENSE
            const expenseShare = transactionForHistory.expenseShares?.find(expenseShareDetail => expenseShareDetail.userId === user.id);
             if (expenseShare) {
                userAmount = expenseShare.amount;
                runningNetWorth -= userAmount;
                monthlyData[month].cashFlow -= userAmount;
                monthlyData[month].expenses += userAmount;
            } else if (transactionForHistory.teamId) {
                const team = teams.find(teamRecord => teamRecord.id === transactionForHistory.teamId);
                if (team && team.memberIds.includes(user.id)) {
                    const shareAmount = transactionForHistory.amount / team.memberIds.length;
                    userAmount = shareAmount;
                    runningNetWorth -= userAmount;
                    monthlyData[month].cashFlow -= userAmount;
                    monthlyData[month].expenses += userAmount;
                }
            }
        }
        
        dataPoints.push({
            date: transactionForHistory.date,
            netWorth: runningNetWorth,
        });
    });

    // Aggregate monthly data into the final data points array
    const finalData: { [date: string]: any } = {};
    dataPoints.forEach(dataPoint => {
        finalData[dataPoint.date] = { ...finalData[dataPoint.date], netWorth: dataPoint.netWorth };
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
        .sort((dateA, dateB) => new Date(dateA).getTime() - new Date(dateB).getTime())
        .map(date => ({ date, ...finalData[date] }));
};