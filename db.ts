import type { User, Transaction, Asset, Liability } from './types';
import { TransactionType, AssetType } from './types';

// Initial Mock Data for a multi-user setup
const users: User[] = [
    {
        id: 'user1',
        name: 'Star Player',
        avatar: 'https://i.pravatar.cc/150?u=user1',
        financialStatement: {
            transactions: [
                { id: 't1', description: 'Salary', amount: 5000, type: TransactionType.INCOME, category: 'Job', date: '2023-10-01', isPassive: false },
                { id: 't2', description: 'Rental Income', amount: 600, type: TransactionType.INCOME, category: 'Real Estate', date: '2023-10-05', isPassive: true },
                { id: 't3', description: 'Rent', amount: 1500, type: TransactionType.EXPENSE, category: 'Housing', date: '2023-10-01' },
                { id: 't4', description: 'Groceries', amount: 400, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-03' },
            ],
            assets: [
                { id: 'a1', name: 'Rental Property', type: AssetType.REAL_ESTATE, value: 120000, monthlyCashflow: 600 },
                { id: 'a2', name: 'Stock Portfolio', type: AssetType.STOCK, value: 25000, monthlyCashflow: 100 },
                { id: 'a3', name: 'Cash', type: AssetType.CASH, value: 10000, monthlyCashflow: 0 },
            ],
            liabilities: [
                { id: 'l1', name: 'Mortgage', balance: 95000, interestRate: 3.5, monthlyPayment: 450 },
                { id: 'l2', name: 'Car Loan', balance: 12000, interestRate: 5.0, monthlyPayment: 350 },
            ],
        },
    },
    {
        id: 'user2',
        name: 'Cosmic Partner',
        avatar: 'https://i.pravatar.cc/150?u=user2',
        financialStatement: {
            transactions: [
                 { id: 't1-u2', description: 'Freelance Work', amount: 3500, type: TransactionType.INCOME, category: 'Job', date: '2023-10-01', isPassive: false },
                 { id: 't2-u2', description: 'Student Loan', amount: 400, type: TransactionType.EXPENSE, category: 'Loan', date: '2023-10-05' },
                 { id: 't3-u2', description: 'Groceries', amount: 350, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-03' },
            ],
            assets: [
                { id: 'a1-u2', name: 'Emergency Fund', type: AssetType.CASH, value: 15000, monthlyCashflow: 0 },
                { id: 'a2-u2', name: '401k', type: AssetType.STOCK, value: 32000, monthlyCashflow: 0 },
            ],
            liabilities: [
                 { id: 'l1-u2', name: 'Student Loan', balance: 25000, interestRate: 6.0, monthlyPayment: 400 },
            ],
        },
    }
];

// Simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- API Functions ---

export const db = {
    getUsers: async (): Promise<User[]> => {
        await delay(100);
        return JSON.parse(JSON.stringify(users)); // Deep copy to prevent mutation
    },

    getUser: async (userId: string): Promise<User | undefined> => {
        await delay(50);
        const user = users.find(u => u.id === userId);
        return user ? JSON.parse(JSON.stringify(user)) : undefined;
    },
    
    addTransaction: async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<User> => {
        await delay(100);
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) throw new Error("User not found");

        const newTransaction: Transaction = {
            ...transaction,
            id: `t${new Date().getTime()}`,
        };

        users[userIndex].financialStatement.transactions.push(newTransaction);
        
        // If it's an expense, reduce cash. If income, increase cash.
        const cashAsset = users[userIndex].financialStatement.assets.find(a => a.type === AssetType.CASH);
        if (cashAsset) {
            if (newTransaction.type === TransactionType.INCOME) {
                cashAsset.value += newTransaction.amount;
            } else {
                cashAsset.value -= newTransaction.amount;
            }
        } else {
            // If no cash asset, create one.
             users[userIndex].financialStatement.assets.push({
                 id: `a${new Date().getTime()}`,
                 name: 'Cash',
                 type: AssetType.CASH,
                 value: newTransaction.type === TransactionType.INCOME ? newTransaction.amount : -newTransaction.amount,
                 monthlyCashflow: 0
             });
        }
        
        return JSON.parse(JSON.stringify(users[userIndex]));
    },

    performTransfer: async (fromUserId: string, toUserId: string, amount: number): Promise<{fromUser: User, toUser: User}> => {
        await delay(150);
        const fromUserIndex = users.findIndex(u => u.id === fromUserId);
        const toUserIndex = users.findIndex(u => u.id === toUserId);

        if (fromUserIndex === -1 || toUserIndex === -1) throw new Error("User not found");

        const fromUser = users[fromUserIndex];
        const toUser = users[toUserIndex];

        const fromCash = fromUser.financialStatement.assets.find(a => a.type === AssetType.CASH);
        const toCash = toUser.financialStatement.assets.find(a => a.type === AssetType.CASH);

        if (!fromCash || fromCash.value < amount) throw new Error("Insufficient funds for transfer");

        fromCash.value -= amount;
        
        if (toCash) {
            toCash.value += amount;
        } else {
            // Create cash asset for recipient if they don't have one
            toUser.financialStatement.assets.push({
                id: `a${new Date().getTime()}`,
                name: 'Cash',
                type: AssetType.CASH,
                value: amount,
                monthlyCashflow: 0
            });
        }
        
        // Add a transaction record for both users
        const transferTransactionOut: Transaction = {
            id: `t-out-${new Date().getTime()}`,
            description: `Transfer to ${toUser.name}`,
            amount: amount,
            type: TransactionType.EXPENSE,
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0]
        };
         fromUser.financialStatement.transactions.push(transferTransactionOut);
         
         const transferTransactionIn: Transaction = {
            id: `t-in-${new Date().getTime()}`,
            description: `Transfer from ${fromUser.name}`,
            amount: amount,
            type: TransactionType.INCOME,
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0]
        };
         toUser.financialStatement.transactions.push(transferTransactionIn);


        return {
            fromUser: JSON.parse(JSON.stringify(fromUser)),
            toUser: JSON.parse(JSON.stringify(toUser))
        };
    }
};
