import { firestore } from './services/firebase';
import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, PaymentShare, ExpenseShare } from './types';
import { TransactionType, AssetType, AccountType } from './types';


const initialData = {
    users: [
        {
            id: 'user1',
            name: 'Star Player',
            avatar: 'https://i.pravatar.cc/150?u=user1',
            teamIds: ['team1', 'team2'],
        },
        {
            id: 'user2',
            name: 'Cosmic Partner',
            avatar: 'https://i.pravatar.cc/150?u=user2',
            teamIds: ['team1', 'team2'],
        },
        {
            id: 'user3',
            name: 'Nova Investor',
            avatar: 'https://i.pravatar.cc/150?u=user3',
            teamIds: ['team2'],
        }
    ],
    accounts: [
        // User 1
        { id: 'acc1-u1', name: 'Personal Checking', type: AccountType.CHECKING, balance: 10000, ownerIds: ['user1'] },
        { id: 'acc2-u1', name: 'Galaxy Brokerage', type: AccountType.INVESTMENT, balance: 0, ownerIds: ['user1'] },
        // User 2
        { id: 'acc1-u2', name: 'Partner Checking', type: AccountType.CHECKING, balance: 15000, ownerIds: ['user2'] },
        // User 3
        { id: 'acc1-u3', name: 'Investor Savings', type: AccountType.SAVINGS, balance: 50000, ownerIds: ['user3'] },
        { id: 'acc2-u3', name: 'Trading Account', type: AccountType.INVESTMENT, balance: 0, ownerIds: ['user3'] },
    ],
    teams: [
        {
            id: 'team1',
            name: 'Family Finances',
            memberIds: ['user1', 'user2'],
            goals: [{ description: 'Save for Vacation', current: 500, target: 5000 }],
            accounts: [
                { id: 'acc-team1-1', name: 'Household Expenses', type: AccountType.CHECKING, balance: 3000, ownerIds: [], teamId: 'team1' },
            ],
            financialStatement: {
                transactions: [
                     { id: 't-team1-1', description: 'Groceries', amount: 400, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-05', teamId: 'team1', paymentShares: [{ userId: 'user1', accountId: 'acc-team1-1', amount: 400 }], expenseShares: [{ userId: 'user1', amount: 200 }, { userId: 'user2', amount: 200 }] },
                     { id: 't-team1-2', description: 'Electricity Bill', amount: 150, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-06', teamId: 'team1', paymentShares: [{ userId: 'user2', accountId: 'acc-team1-1', amount: 150 }], expenseShares: [{ userId: 'user1', amount: 75 }, { userId: 'user2', amount: 75 }] },
                     { id: 't-team1-3', description: 'Internet Bill', amount: 80, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-10', teamId: 'team1', paymentShares: [{ userId: 'user1', accountId: 'acc-team1-1', amount: 80 }], expenseShares: [{ userId: 'user1', amount: 40 }, { userId: 'user2', amount: 40 }] }
                ],
                assets: [
                    { id: 'a-team1-1', name: 'Family Home', type: AssetType.REAL_ESTATE, value: 400000, monthlyCashflow: 0, teamId: 'team1' },
                ],
                liabilities: [
                    { id: 'l-team1-1', name: 'Mortgage', balance: 250000, interestRate: 3.5, monthlyPayment: 1800, teamId: 'team1' },
                ]
            }
        },
        {
            id: 'team2',
            name: 'Startup Project',
            memberIds: ['user1', 'user2', 'user3'],
            goals: [{ description: 'Launch MVP', current: 1000, target: 10000 }],
            accounts: [
                { id: 'acc-team2-1', name: 'Startup Checking', type: AccountType.CHECKING, balance: 5000, ownerIds: [], teamId: 'team2' }
            ],
            financialStatement: { 
                transactions: [
                    { id: 't-team2-1', description: 'Server Costs', amount: 100, type: TransactionType.EXPENSE, category: 'Business Expense', date: '2023-10-12', teamId: 'team2', paymentShares: [{ userId: 'user1', accountId: 'acc-team2-1', amount: 100 }], expenseShares: [{ userId: 'user1', amount: 50 }, { userId: 'user2', amount: 50 }] },
                    { id: 't-team2-2', description: 'Software License', amount: 300, type: TransactionType.EXPENSE, category: 'Business Expense', date: '2023-10-15', teamId: 'team2', paymentShares: [{ userId: 'user3', accountId: 'acc-team2-1', amount: 300 }], expenseShares: [{ userId: 'user1', amount: 100 }, { userId: 'user2', amount: 100 }, { userId: 'user3', amount: 100 }] },
                    { id: 't-team2-3', description: 'Client Pre-payment', amount: 2000, type: TransactionType.INCOME, category: 'Business Income', date: '2023-10-20', teamId: 'team2', isPassive: false, paymentShares: [{ userId: 'user1', accountId: 'acc-team2-1', amount: 2000 }] },
                    { id: 't-team2-4', description: 'Domain Registration', amount: 50, type: TransactionType.EXPENSE, category: 'Business Expense', date: '2023-10-22', teamId: 'team2', paymentShares: [{ userId: 'user3', accountId: 'acc1-u3', amount: 50 }], expenseShares: [{ userId: 'user1', amount: 16.67 }, { userId: 'user2', amount: 16.67 }, { userId: 'user3', amount: 16.66 }] },
                ], 
                assets: [
                     { id: 'a-team2-1', name: 'Software IP', type: AssetType.BUSINESS, value: 25000, monthlyCashflow: 0, teamId: 'team2' },
                ], 
                liabilities: [
                    { id: 'l-team2-1', name: 'Angel Investor Loan', balance: 10000, interestRate: 8.0, monthlyPayment: 200, teamId: 'team2' },
                ] 
            }
        }
    ],
    baseStatements: {
        user1: {
            assets: [
                { id: 'a2', name: 'Galactic Holdings Inc.', type: AssetType.STOCK, value: 15000, monthlyCashflow: 50, ticker: 'GHI', numberOfShares: 100, purchasePrice: 150 },
                { id: 'a3', name: 'Tesla', type: AssetType.STOCK, value: 10000, monthlyCashflow: 0, ticker: 'TSLA', numberOfShares: 40, purchasePrice: 250 },
            ],
            liabilities: [
                { id: 'l2', name: 'Car Loan', balance: 12000, interestRate: 5.0, monthlyPayment: 350 },
            ],
            transactions: [
                { id: 't1-u1', description: 'Salary', amount: 5000, type: TransactionType.INCOME, category: 'Job', date: '2023-10-01', isPassive: false, paymentShares: [{ userId: 'user1', accountId: 'acc1-u1', amount: 5000 }] },
                { id: 't2-u1', description: 'Dinner with Partner', amount: 120, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-02', paymentShares: [{ userId: 'user1', accountId: 'acc1-u1', amount: 120 }], expenseShares: [{ userId: 'user1', amount: 60 }, { userId: 'user2', amount: 60 }] },
                { id: 't3-u1', description: 'Movie Night', amount: 50, type: TransactionType.EXPENSE, category: 'Entertainment', date: '2023-10-08', paymentShares: [{ userId: 'user1', accountId: 'acc1-u1', amount: 50 }], expenseShares: [{ userId: 'user1', amount: 25 }, { userId: 'user3', amount: 25 }] },
                { id: 't4-u1', description: 'GHI Dividend', amount: 50, type: TransactionType.INCOME, category: 'Investment', date: '2023-10-15', isPassive: true, paymentShares: [{ userId: 'user1', accountId: 'acc1-u1', amount: 50 }] },
            ]
        },
        user2: {
             assets: [
                { id: 'a2-u2', name: 'Nebula Corp', type: AssetType.STOCK, value: 32000, monthlyCashflow: 0, ticker: 'NBLA', numberOfShares: 200, purchasePrice: 160 },
            ],
            liabilities: [
                 { id: 'l1-u2', name: 'Student Loan', balance: 25000, interestRate: 6.0, monthlyPayment: 400 },
            ],
            transactions: [
                 { id: 't1-u2', description: 'Freelance Work', amount: 3500, type: TransactionType.INCOME, category: 'Job', date: '2023-10-01', isPassive: false, paymentShares: [{ userId: 'user2', accountId: 'acc1-u2', amount: 3500 }] },
                 { id: 't2-u2', description: 'Lunch with Investor', amount: 90, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-18', paymentShares: [{ userId: 'user2', accountId: 'acc1-u2', amount: 90 }], expenseShares: [{ userId: 'user2', amount: 45 }, { userId: 'user3', amount: 45 }] },
            ]
        },
        user3: {
             assets: [
                { id: 'a1-u3', name: 'Apple Inc.', type: AssetType.STOCK, value: 50000, monthlyCashflow: 100, ticker: 'AAPL', numberOfShares: 300, purchasePrice: 140 },
             ],
            liabilities: [],
            transactions: [
                 { id: 't1-u3', description: 'Consulting Gig', amount: 6000, type: TransactionType.INCOME, category: 'Job', date: '2023-10-03', isPassive: false, paymentShares: [{ userId: 'user3', accountId: 'acc1-u3', amount: 6000 }] },
                 { id: 't2-u3', description: 'AAPL Dividend', amount: 100, type: TransactionType.INCOME, category: 'Investment', date: '2023-10-20', isPassive: true, paymentShares: [{ userId: 'user3', accountId: 'acc1-u3', amount: 100 }] },
            ]
        }
    }
};


const seedInitialData = async () => {
    console.log("Seeding initial, extensive data to Firestore...");
    const batch = firestore.batch();

    // Create combined user objects
    const finalUsers: User[] = initialData.users.map(u => {
        const userAccounts = initialData.accounts.filter(acc => acc.ownerIds.includes(u.id));
        const baseStatement = initialData.baseStatements[u.id as keyof typeof initialData.baseStatements] || { assets: [], liabilities: [], transactions: [] };
        return {
            ...u,
            accounts: userAccounts,
            financialStatement: {
                assets: baseStatement.assets,
                liabilities: baseStatement.liabilities,
                transactions: baseStatement.transactions,
            }
        };
    });

    finalUsers.forEach(user => {
        const userRef = firestore.collection("users").doc(user.id);
        batch.set(userRef, user);
    });

    initialData.teams.forEach(team => {
        const teamRef = firestore.collection("teams").doc(team.id);
        batch.set(teamRef, team);
    });

    await batch.commit();
    console.log("Seeding complete.");
    return finalUsers;
};

const sanitizeUser = (user: any): User => ({
    ...user,
    accounts: user.accounts || [],
    teamIds: user.teamIds || [],
    financialStatement: {
        transactions: user.financialStatement?.transactions || [],
        assets: user.financialStatement?.assets || [],
        liabilities: user.financialStatement?.liabilities || [],
    },
});

export const db = {
    getUsers: async (): Promise<User[]> => {
        const usersCol = firestore.collection('users');
        const userSnapshot = await usersCol.get();
        if (userSnapshot.empty) return await seedInitialData();
        return userSnapshot.docs.map(doc => sanitizeUser(doc.data()));
    },

    getTeamsForUser: async(userId: string): Promise<Team[]> => {
        const teamsCol = firestore.collection('teams');
        const teamSnapshot = await teamsCol.where('memberIds', 'array-contains', userId).get();
        if(teamSnapshot.empty) return [];
        return teamSnapshot.docs.map(doc => doc.data() as Team);
    },
    
    createTeam: async(name: string, memberIds: string[]): Promise<Team> => {
        const teamRef = firestore.collection('teams').doc();
        const newTeam: Team = {
            id: teamRef.id,
            name,
            memberIds,
            accounts: [],
            financialStatement: { transactions: [], assets: [], liabilities: [] },
            goals: [{ description: `Achieve Net Worth of $100,000`, current: 0, target: 100000 }]
        };
        await teamRef.set(newTeam);
        return newTeam;
    },

    addAccount: async (userId: string, accountData: Omit<Account, 'id' | 'ownerIds'>): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const newAccount: Account = { ...accountData, id: `acc-${new Date().getTime()}`, ownerIds: [userId] };
        user.accounts.push(newAccount);
        await userRef.set(user);
        return user;
    },

    addTransaction: async (activeUserId: string, transaction: Omit<Transaction, 'id'>, allUsers: User[]): Promise<User[]> => {
        const batch = firestore.batch();
        const usersToUpdate = new Map<string, User>();
        const newTransaction: Transaction = { ...transaction, id: `t-${new Date().getTime()}` };

        // Helper to get a user, prioritizing already modified ones
        const getUser = (id: string) => usersToUpdate.get(id) || allUsers.find(u => u.id === id);

        // 1. Process payments (debit/credit accounts)
        for (const payment of newTransaction.paymentShares) {
            const payer = getUser(payment.userId);
            if (!payer) throw new Error(`User ${payment.userId} not found.`);
            const account = payer.accounts.find(a => a.id === payment.accountId);
            if (!account) throw new Error(`Account ${payment.accountId} not found for user ${payer.name}.`);

            if (newTransaction.type === TransactionType.INCOME) account.balance += payment.amount;
            else account.balance -= payment.amount;
            
            usersToUpdate.set(payer.id, sanitizeUser(payer));
        }

        // 2. Add transaction to relevant financial statements
        const involvedUserIds = new Set<string>(
            newTransaction.type === TransactionType.EXPENSE && newTransaction.expenseShares
                ? newTransaction.expenseShares.map(s => s.userId)
                : newTransaction.paymentShares.map(s => s.userId)
        );

        for (const userId of involvedUserIds) {
            const user = getUser(userId);
            if (!user) throw new Error(`User ${userId} not found.`);
            user.financialStatement.transactions.push(newTransaction);
            usersToUpdate.set(user.id, sanitizeUser(user));
        }
        
        // 3. Commit all changes
        for (const user of usersToUpdate.values()) {
            const userRef = firestore.collection('users').doc(user.id);
            batch.set(userRef, user);
        }

        await batch.commit();
        return Array.from(usersToUpdate.values());
    },


    addTeamTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<Team> => {
        if(!transaction.teamId) throw new Error("Team ID is required for team transaction.");
        const teamRef = firestore.collection('teams').doc(transaction.teamId);
        const teamSnap = await teamRef.get();
        if(!teamSnap.exists) throw new Error("Team not found");
        const team = teamSnap.data() as Team;

        for (const payment of transaction.paymentShares) {
             const account = team.accounts.find(a => a.id === payment.accountId);
            if(!account) {
                 // The payment might come from a PERSONAL account for a team expense, so we don't need to find it here.
                 // Balance changes for personal accounts are handled in the addTransaction function.
                 // This function only handles changes to TEAM accounts.
            } else {
                if (transaction.type === TransactionType.INCOME) account.balance += payment.amount;
                else account.balance -= payment.amount;
            }
        }
        
        const newTransaction: Transaction = { ...transaction, id: `t-${new Date().getTime()}` };
        team.financialStatement.transactions.push(newTransaction);
        await teamRef.set(team);
        return team;
    },

    performTransfer: async (userId: string, fromAccountId: string, toAccountId: string, amount: number, isSettleUp: boolean): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const fromAccount = user.accounts.find(a => a.id === fromAccountId);
        const toAccount = user.accounts.find(a => a.id === toAccountId);
        if (!fromAccount || !toAccount) throw new Error("Account not found");
        if (fromAccount.balance < amount) throw new Error("Insufficient funds");
        fromAccount.balance -= amount;
        toAccount.balance += amount;
        
        if (!isSettleUp) {
            const date = new Date().toISOString().split('T')[0];
            const transferOut: Transaction = { id: `t-out-${new Date().getTime()}`, description: `Transfer to ${toAccount.name}`, amount, type: TransactionType.EXPENSE, category: 'Transfer', date, paymentShares: [{userId, accountId: fromAccountId, amount}], expenseShares: [{userId, amount}] };
            const transferIn: Transaction = { id: `t-in-${new Date().getTime()}`, description: `Transfer from ${fromAccount.name}`, amount, type: TransactionType.INCOME, category: 'Transfer', date, paymentShares: [{userId, accountId: toAccountId, amount}] };
            user.financialStatement.transactions.push(transferOut, transferIn);
        }
        
        await userRef.set(user);
        return user;
    },
    
    addAsset: async (userId: string, assetData: Partial<Asset>): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const newAsset: Asset = { id: `a-${new Date().getTime()}`, name: assetData.name || 'New Asset', type: assetData.type || AssetType.OTHER, value: assetData.value || 0, monthlyCashflow: assetData.monthlyCashflow || 0, ...assetData };
        user.financialStatement.assets.push(newAsset);
        await userRef.set(user);
        return user;
    },
    addTeamAsset: async(teamId: string, assetData: Partial<Asset>): Promise<Team> => {
        const teamRef = firestore.collection('teams').doc(teamId);
        const teamSnap = await teamRef.get();
        if (!teamSnap.exists) throw new Error("Team not found");
        const team = teamSnap.data() as Team;
        const newAsset: Asset = { id: `a-${new Date().getTime()}`, name: assetData.name || 'New Asset', type: assetData.type || AssetType.OTHER, value: assetData.value || 0, monthlyCashflow: assetData.monthlyCashflow || 0, teamId, ...assetData };
        team.financialStatement.assets.push(newAsset);
        await teamRef.set(team);
        return team;
    },
    
    addLiability: async (userId: string, liabilityData: Partial<Liability>): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const newLiability: Liability = { id: `l-${new Date().getTime()}`, name: liabilityData.name || 'New Liability', balance: liabilityData.balance || 0, interestRate: liabilityData.interestRate || 0, monthlyPayment: liabilityData.monthlyPayment || 0 };
        user.financialStatement.liabilities.push(newLiability);
        await userRef.set(user);
        return user;
    },
    addTeamLiability: async(teamId: string, liabilityData: Partial<Liability>): Promise<Team> => {
        const teamRef = firestore.collection('teams').doc(teamId);
        const teamSnap = await teamRef.get();
        if (!teamSnap.exists) throw new Error("Team not found");
        const team = teamSnap.data() as Team;
        const newLiability: Liability = { id: `l-${new Date().getTime()}`, name: liabilityData.name || 'New Liability', balance: liabilityData.balance || 0, interestRate: liabilityData.interestRate || 0, monthlyPayment: liabilityData.monthlyPayment || 0, teamId };
        team.financialStatement.liabilities.push(newLiability);
        await teamRef.set(team);
        return team;
    },

    updateAsset: async (userId: string, assetId: string, assetData: Partial<Asset>): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const assetIndex = user.financialStatement.assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) throw new Error("Asset not found");
        user.financialStatement.assets[assetIndex] = { ...user.financialStatement.assets[assetIndex], ...assetData };
        await userRef.set(user);
        return user;
    },

    deleteAsset: async (userId: string, assetId: string): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const assetIndex = user.financialStatement.assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) throw new Error("Asset not found");
        const [assetToSell] = user.financialStatement.assets.splice(assetIndex, 1);
        const cashAccount = user.accounts.find(a => a.type === AccountType.CASH || a.type === AccountType.CHECKING);
        if (cashAccount) {
            cashAccount.balance += assetToSell.value;
            const saleTransaction: Transaction = { id: `t-sell-${new Date().getTime()}`, description: `Sell ${assetToSell.name}`, amount: assetToSell.value, type: TransactionType.INCOME, category: 'Investment', date: new Date().toISOString().split('T')[0], paymentShares: [{userId, accountId: cashAccount.id, amount: assetToSell.value}] };
            user.financialStatement.transactions.push(saleTransaction);
        }
        await userRef.set(user);
        return user;
    },

    logDividend: async (user: User, assetId: string, amount: number, accountId: string): Promise<User> => {
        const userRef = firestore.collection('users').doc(user.id);
        const userToUpdate = sanitizeUser(user);
        const stock = userToUpdate.financialStatement.assets.find(a => a.id === assetId);
        if (!stock) throw new Error("Stock asset not found");
        const account = userToUpdate.accounts.find(a => a.id === accountId);
        if(!account) throw new Error("Receiving account not found");
        account.balance += amount;
        const dividendTransaction: Transaction = { id: `t-div-${new Date().getTime()}`, description: `Dividend from ${stock.name} (${stock.ticker})`, amount, type: TransactionType.INCOME, category: 'Investment', date: new Date().toISOString().split('T')[0], isPassive: true, paymentShares: [{userId: user.id, accountId, amount}] };
        userToUpdate.financialStatement.transactions.push(dividendTransaction);
        await userRef.set(userToUpdate);
        return userToUpdate;
    },

    applyEventOutcome: async (user: User, outcome: EventOutcome): Promise<User> => {
        const userRef = firestore.collection('users').doc(user.id);
        const userToUpdate = sanitizeUser(user);
        const cashAccount = userToUpdate.accounts.find(a => a.type === AccountType.CASH || a.type === AccountType.CHECKING);
        if (outcome.cashChange) {
            if (!cashAccount) throw new Error("No cash account available for this event.");
            if (cashAccount.balance + outcome.cashChange < 0) throw new Error("Not enough cash for this event.");
            cashAccount.balance += outcome.cashChange;
        }
        if (outcome.newAsset) {
            const newAsset: Asset = { ...outcome.newAsset, id: `a${new Date().getTime()}` };
            userToUpdate.financialStatement.assets.push(newAsset);
        }
        if(cashAccount && outcome.cashChange && outcome.cashChange !== 0){
            const amount = Math.abs(outcome.cashChange);
            const type = outcome.cashChange < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
            const eventTransaction: Transaction = { id: `t-event-${new Date().getTime()}`, description: outcome.message.split('!')[0], amount, type, category: 'Cosmic Event', date: new Date().toISOString().split('T')[0], paymentShares: [{userId: user.id, accountId: cashAccount.id, amount}], expenseShares: type === TransactionType.EXPENSE ? [{userId: user.id, amount}] : undefined };
             userToUpdate.financialStatement.transactions.push(eventTransaction);
        }
        await userRef.set(userToUpdate);
        return userToUpdate;
    }
};