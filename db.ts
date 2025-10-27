import { firestore } from './services/firebase';
import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team } from './types';
import { TransactionType, AssetType, AccountType } from './types';

// Real data for German & Valeria
const initialData = {
    users: [
        {
            id: 'german',
            name: 'German',
            avatar: 'https://i.pravatar.cc/150?u=german',
            teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'],
        },
        {
            id: 'valeria',
            name: 'Valeria',
            avatar: 'https://i.pravatar.cc/150?u=valeria',
            teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'],
        },
    ],
    accounts: [
        // Joint Accounts
        { id: 'acc-joint-checking', name: 'Cuenta Conjunta', type: AccountType.CHECKING, balance: 6686.80, ownerIds: ['german', 'valeria'] },
        { id: 'acc-joint-cc', name: 'Tarjeta Conjunta', type: AccountType.CREDIT_CARD, balance: 250.00, ownerIds: ['german', 'valeria'] },

        // German's Accounts
        { id: 'g-savings-1', name: 'G-Ahorros 1', type: AccountType.SAVINGS, balance: 15000, ownerIds: ['german'] },
        { id: 'g-savings-2', name: 'G-Ahorros 2', type: AccountType.SAVINGS, balance: 5000, ownerIds: ['german'] },
        { id: 'g-rrsp', name: 'G-RRSP', type: AccountType.RRSP, balance: 10000, ownerIds: ['german'] },
        { id: 'g-tfsa', name: 'G-TFSA', type: AccountType.TFSA, balance: 12000, ownerIds: ['german'] },
        { id: 'g-margin', name: 'G-Cuenta Margen', type: AccountType.INVESTMENT, balance: 8000, ownerIds: ['german'] },
        { id: 'g-fx', name: 'G-Cuenta FX', type: AccountType.INVESTMENT, balance: 3000, ownerIds: ['german'] },
        
        // Valeria's Accounts
        { id: 'v-savings-1', name: 'V-Ahorros 1', type: AccountType.SAVINGS, balance: 18000, ownerIds: ['valeria'] },
        { id: 'v-savings-2', name: 'V-Ahorros 2', type: AccountType.SAVINGS, balance: 4000, ownerIds: ['valeria'] },
        { id: 'v-rrsp', name: 'V-RRSP', type: AccountType.RRSP, balance: 9000, ownerIds: ['valeria'] },
        { id: 'v-tfsa', name: 'V-TFSA', type: AccountType.TFSA, balance: 11000, ownerIds: ['valeria'] },
    ],
    teams: [
        {
            id: 'team-millo',
            name: 'Les Millo',
            memberIds: ['german', 'valeria'],
            goals: [],
            accounts: [],
            financialStatement: {
                transactions: [
                     // This transaction results in Valeria owing German 233.40 in this team context.
                     { id: 't-millo-1', description: 'Gastos Extras Varios', amount: 466.80, type: TransactionType.EXPENSE, category: 'Entertainment', date: '2023-10-25', teamId: 'team-millo', 
                       paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 466.80 }], 
                       expenseShares: [{ userId: 'german', amount: 233.40 }, { userId: 'valeria', amount: 233.40 }] }
                ],
                assets: [], liabilities: []
            }
        },
        {
            id: 'team-casita',
            name: 'Casita',
            memberIds: ['german', 'valeria'],
            goals: [],
            accounts: [],
            financialStatement: {
                transactions: [
                    { id: 't-casita-1', description: 'Alquiler Mensual', amount: 2850, type: TransactionType.EXPENSE, category: 'Housing', date: '2023-10-01', teamId: 'team-casita', paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 2850 }], expenseShares: [{ userId: 'german', amount: 1425 }, { userId: 'valeria', amount: 1425 }] },
                    { id: 't-casita-2', description: 'Servicios Varios', amount: 350, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-15', teamId: 'team-casita', paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 350 }], expenseShares: [{ userId: 'german', amount: 175 }, { userId: 'valeria', amount: 175 }] },
                    { id: 't-casita-3', description: 'Ingreso Alquiler 1', amount: 1100, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1100 }] },
                    { id: 't-casita-4', description: 'Ingreso Alquiler 2', amount: 1400, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1400 }] },
                    // This transaction ensures Valeria owes German 21.56 in this context.
                    { id: 't-casita-balance', description: 'Ajuste de Cuentas', amount: 43.12, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-26', teamId: 'team-casita', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 43.12 }], expenseShares: [{ userId: 'german', amount: 21.56 }, { userId: 'valeria', amount: 21.56 }] }
                ],
                assets: [], liabilities: []
            }
        },
        {
            id: 'team-regina',
            name: 'Casa de Regina',
            memberIds: ['german', 'valeria'],
            goals: [],
            accounts: [], // Uses joint account
            financialStatement: { 
                transactions: [
                    { id: 't-regina-income1', description: 'Ingreso Alquiler Basement', amount: 800, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 800 }] },
                    { id: 't-regina-income2', description: 'Ingreso Alquiler Main Floor', amount: 1150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1150 }] },
                    { id: 't-regina-income3', description: 'Ingreso Alquiler Second Floor', amount: 1050, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1050 }] },
                    { id: 't-regina-income4', description: 'Ingreso Alquiler Garage', amount: 150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 150 }] },
                    { id: 't-regina-exp-mortgage', description: 'Pago Hipoteca', amount: 1000, type: TransactionType.EXPENSE, category: 'Mortgage', date: '2023-10-01', teamId: 'team-regina', paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1000 }], expenseShares: [{ userId: 'german', amount: 500 }, { userId: 'valeria', amount: 500 }] },
                    { id: 't-regina-exp-utils', description: 'Gastos (Utilities, Seguro, etc)', amount: 1000, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-15', teamId: 'team-regina', paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1000 }], expenseShares: [{ userId: 'german', amount: 500 }, { userId: 'valeria', amount: 500 }] },
                    // This transaction ensures German owes Valeria 4728 in this context.
                    { id: 't-regina-balance', description: 'Ajuste de Cuentas (Renovaciones)', amount: 9456, type: TransactionType.EXPENSE, category: 'Maintenance', date: '2023-10-20', teamId: 'team-regina', paymentShares: [{ userId: 'valeria', accountId: 'v-savings-1', amount: 9456 }], expenseShares: [{ userId: 'german', amount: 4728 }, { userId: 'valeria', amount: 4728 }] }
                ], 
                assets: [ { id: 'a-regina-1', name: 'Casa de Regina', type: AssetType.REAL_ESTATE, value: 240000, monthlyCashflow: 0, teamId: 'team-regina' } ], 
                liabilities: [ { id: 'l-regina-1', name: 'Hipoteca Regina', balance: 220000, interestRate: 3.49, monthlyPayment: 1000, teamId: 'team-regina' } ] 
            }
        },
        {
            id: 'team-viandas',
            name: 'Negocio de la viandas',
            memberIds: ['german', 'valeria'],
            goals: [],
            accounts: [],
            financialStatement: {
                transactions: [
                    { id: 't-viandas-1', description: 'Venta de Productos', amount: 130, type: TransactionType.INCOME, category: 'Business Income', date: '2023-10-22', teamId: 'team-viandas', paymentShares: [{ userId: 'valeria', accountId: 'v-savings-1', amount: 130 }] },
                    { id: 't-viandas-2', description: 'Compra de Comida', amount: 120, type: TransactionType.EXPENSE, category: 'Business Expense', date: '2023-10-21', teamId: 'team-viandas', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 120 }], expenseShares: [{ userId: 'german', amount: 60 }, { userId: 'valeria', amount: 60 }] }
                ],
                assets: [], liabilities: []
            }
        }
    ],
    baseStatements: {
        german: {
            assets: [
                { id: 'g-a1', name: 'Grupo Financiero Galicia', type: AssetType.STOCK, value: 2500, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 10, purchasePrice: 250 },
                { id: 'g-a2', name: 'Pampa Energia', type: AssetType.STOCK, value: 800, monthlyCashflow: 0, ticker: 'PAM', numberOfShares: 10, purchasePrice: 80 },
                { id: 'g-a3', name: 'YPF', type: AssetType.STOCK, value: 400, monthlyCashflow: 0, ticker: 'YPF', numberOfShares: 10, purchasePrice: 40 },
                { id: 'g-a4', name: 'Supervielle', type: AssetType.STOCK, value: 200, monthlyCashflow: 0, ticker: 'SUPV', numberOfShares: 10, purchasePrice: 20 },
                { id: 'g-a5', name: 'BBVA Argentina', type: AssetType.STOCK, value: 300, monthlyCashflow: 0, ticker: 'BBAR', numberOfShares: 10, purchasePrice: 30 },
                { id: 'g-a6', name: 'Banco Macro', type: AssetType.STOCK, value: 600, monthlyCashflow: 0, ticker: 'BMA', numberOfShares: 10, purchasePrice: 60 },
                { id: 'g-a7', name: 'Loma Negra', type: AssetType.STOCK, value: 150, monthlyCashflow: 0, ticker: 'LOMA', numberOfShares: 10, purchasePrice: 15 },
                { id: 'g-a8', name: 'Vista Energy', type: AssetType.STOCK, value: 500, monthlyCashflow: 0, ticker: 'VIST', numberOfShares: 10, purchasePrice: 50 },
                // Joint stocks held in German's account
                { id: 'j-a1', name: 'Grupo Financiero Galicia (Conjunto)', type: AssetType.STOCK, value: 2500, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 10, purchasePrice: 250, shares: [{ userId: 'german', percentage: 50 }, { userId: 'valeria', percentage: 50 }] },
            ],
            liabilities: [],
            transactions: []
        },
        valeria: {
             assets: [
                { id: 'v-a1', name: 'Grupo Financiero Galicia', type: AssetType.STOCK, value: 2500, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 10, purchasePrice: 250 },
                { id: 'v-a2', name: 'Pampa Energia', type: AssetType.STOCK, value: 800, monthlyCashflow: 0, ticker: 'PAM', numberOfShares: 10, purchasePrice: 80 },
                { id: 'v-a3', name: 'YPF', type: AssetType.STOCK, value: 400, monthlyCashflow: 0, ticker: 'YPF', numberOfShares: 10, purchasePrice: 40 },
                { id: 'v-a4', name: 'Supervielle', type: AssetType.STOCK, value: 200, monthlyCashflow: 0, ticker: 'SUPV', numberOfShares: 10, purchasePrice: 20 },
                { id: 'v-a5', name: 'BBVA Argentina', type: AssetType.STOCK, value: 300, monthlyCashflow: 0, ticker: 'BBAR', numberOfShares: 10, purchasePrice: 30 },
                { id: 'v-a6', name: 'Banco Macro', type: AssetType.STOCK, value: 600, monthlyCashflow: 0, ticker: 'BMA', numberOfShares: 10, purchasePrice: 60 },
                { id: 'v-a7', name: 'Loma Negra', type: AssetType.STOCK, value: 150, monthlyCashflow: 0, ticker: 'LOMA', numberOfShares: 10, purchasePrice: 15 },
                { id: 'v-a8', name: 'Vista Energy', type: AssetType.STOCK, value: 500, monthlyCashflow: 0, ticker: 'VIST', numberOfShares: 10, purchasePrice: 50 },
            ],
            liabilities: [],
            transactions: []
        },
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
                 // The payment might come from a PERSONAL account for a team expense.
                 // This function only handles changes to TEAM accounts.
                 // A separate function is needed to update personal accounts from team transactions.
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

    updateLiability: async (userId: string, liabilityId: string, liabilityData: Partial<Liability>): Promise<User> => {
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const liabilityIndex = user.financialStatement.liabilities.findIndex(l => l.id === liabilityId);
        if (liabilityIndex === -1) throw new Error("Liability not found");
        user.financialStatement.liabilities[liabilityIndex] = { ...user.financialStatement.liabilities[liabilityIndex], ...liabilityData };
        await userRef.set(user);
        return user;
    },
    
    updateTeamAsset: async (teamId: string, assetId: string, assetData: Partial<Asset>): Promise<Team> => {
        const teamRef = firestore.collection('teams').doc(teamId);
        const teamSnap = await teamRef.get();
        if (!teamSnap.exists) throw new Error("Team not found");
        const team = teamSnap.data() as Team;
        const assetIndex = team.financialStatement.assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) throw new Error("Team asset not found");
        team.financialStatement.assets[assetIndex] = { ...team.financialStatement.assets[assetIndex], ...assetData };
        await teamRef.set(team);
        return team;
    },

    updateTeamLiability: async (teamId: string, liabilityId: string, liabilityData: Partial<Liability>): Promise<Team> => {
        const teamRef = firestore.collection('teams').doc(teamId);
        const teamSnap = await teamRef.get();
        if (!teamSnap.exists) throw new Error("Team not found");
        const team = teamSnap.data() as Team;
        const liabilityIndex = team.financialStatement.liabilities.findIndex(l => l.id === liabilityId);
        if (liabilityIndex === -1) throw new Error("Team liability not found");
        team.financialStatement.liabilities[liabilityIndex] = { ...team.financialStatement.liabilities[liabilityIndex], ...liabilityData };
        await teamRef.set(team);
        return team;
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