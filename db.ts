import { db, collection, doc, getDocs, writeBatch, query, where } from './services/firebase';
import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team } from './types';
import { TransactionType, AssetType, AccountType } from './types';

// Real data for German & Valeria
const initialData = {
    users: [
        { id: 'german', name: 'German', avatar: 'https://i.pravatar.cc/150?u=german', teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'] },
        { id: 'valeria', name: 'Valeria', avatar: 'https://i.pravatar.cc/150?u=valeria', teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'] },
    ],
    accounts: [
        { id: 'acc-joint-checking', name: 'Cuenta Conjunta', type: AccountType.CHECKING, balance: 6686.80, ownerIds: ['german', 'valeria'] },
        { id: 'acc-joint-cc', name: 'Tarjeta Conjunta', type: AccountType.CREDIT_CARD, balance: 250.00, ownerIds: ['german', 'valeria'] },
        { id: 'g-savings-1', name: 'G-Ahorros 1', type: AccountType.SAVINGS, balance: 15000, ownerIds: ['german'] },
        { id: 'g-savings-2', name: 'G-Ahorros 2', type: AccountType.SAVINGS, balance: 5000, ownerIds: ['german'] },
        { id: 'g-rrsp', name: 'G-RRSP', type: AccountType.RRSP, balance: 10000, ownerIds: ['german'] },
        { id: 'g-tfsa', name: 'G-TFSA', type: AccountType.TFSA, balance: 12000, ownerIds: ['german'] },
        { id: 'g-margin', name: 'G-Cuenta Margen', type: AccountType.INVESTMENT, balance: 8000, ownerIds: ['german'] },
        { id: 'g-fx', name: 'G-Cuenta FX', type: AccountType.INVESTMENT, balance: 3000, ownerIds: ['german'] },
        { id: 'v-savings-1', name: 'V-Ahorros 1', type: AccountType.SAVINGS, balance: 18000, ownerIds: ['valeria'] },
        { id: 'v-savings-2', name: 'V-Ahorros 2', type: AccountType.SAVINGS, balance: 4000, ownerIds: ['valeria'] },
        { id: 'v-rrsp', name: 'V-RRSP', type: AccountType.RRSP, balance: 9000, ownerIds: ['valeria'] },
        { id: 'v-tfsa', name: 'V-TFSA', type: AccountType.TFSA, balance: 11000, ownerIds: ['valeria'] },
    ],
    teams: [
        {
            id: 'team-millo', name: 'Les Millo', memberIds: ['german', 'valeria'], goals: [], accounts: [],
            financialStatement: {
                transactions: [ { id: 't-millo-1', description: 'Gastos Extras Varios', amount: 466.80, type: TransactionType.EXPENSE, category: 'Entertainment', date: '2023-10-25', teamId: 'team-millo', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 466.80 }], expenseShares: [{ userId: 'german', amount: 233.40 }, { userId: 'valeria', amount: 233.40 }] } ],
                assets: [], liabilities: []
            }
        },
        {
            id: 'team-casita', name: 'Casita', memberIds: ['german', 'valeria'], goals: [], accounts: [],
            financialStatement: {
                transactions: [
                    { id: 't-casita-1', description: 'Alquiler Mensual', amount: 2850, type: TransactionType.EXPENSE, category: 'Housing', date: '2023-10-01', teamId: 'team-casita', paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 2850 }], expenseShares: [{ userId: 'german', amount: 1425 }, { userId: 'valeria', amount: 1425 }] },
                    { id: 't-casita-2', description: 'Servicios Varios', amount: 350, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-15', teamId: 'team-casita', paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 350 }], expenseShares: [{ userId: 'german', amount: 175 }, { userId: 'valeria', amount: 175 }] },
                    { id: 't-casita-3', description: 'Ingreso Alquiler 1', amount: 1100, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1100 }] },
                    { id: 't-casita-4', description: 'Ingreso Alquiler 2', amount: 1400, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1400 }] },
                    { id: 't-casita-balance', description: 'Ajuste de Cuentas', amount: 43.12, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-26', teamId: 'team-casita', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 43.12 }], expenseShares: [{ userId: 'german', amount: 21.56 }, { userId: 'valeria', amount: 21.56 }] }
                ],
                assets: [], liabilities: []
            }
        },
        {
            id: 'team-regina', name: 'Casa de Regina', memberIds: ['german', 'valeria'], goals: [], accounts: [],
            financialStatement: { 
                transactions: [
                    { id: 't-regina-income1', description: 'Ingreso Alquiler Basement', amount: 800, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 800 }] },
                    { id: 't-regina-income2', description: 'Ingreso Alquiler Main Floor', amount: 1150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1150 }] },
                    { id: 't-regina-income3', description: 'Ingreso Alquiler Second Floor', amount: 1050, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1050 }] },
                    { id: 't-regina-income4', description: 'Ingreso Alquiler Garage', amount: 150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 150 }] },
                    { id: 't-regina-exp-mortgage', description: 'Pago Hipoteca', amount: 1000, type: TransactionType.EXPENSE, category: 'Mortgage', date: '2023-10-01', teamId: 'team-regina', paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1000 }], expenseShares: [{ userId: 'german', amount: 500 }, { userId: 'valeria', amount: 500 }] },
                    { id: 't-regina-exp-utils', description: 'Gastos (Utilities, Seguro, etc)', amount: 1000, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-15', teamId: 'team-regina', paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1000 }], expenseShares: [{ userId: 'german', amount: 500 }, { userId: 'valeria', amount: 500 }] },
                    { id: 't-regina-balance', description: 'Ajuste de Cuentas (Renovaciones)', amount: 9456, type: TransactionType.EXPENSE, category: 'Maintenance', date: '2023-10-20', teamId: 'team-regina', paymentShares: [{ userId: 'valeria', accountId: 'v-savings-1', amount: 9456 }], expenseShares: [{ userId: 'german', amount: 4728 }, { userId: 'valeria', amount: 4728 }] }
                ], 
                assets: [ { id: 'a-regina-1', name: 'Casa de Regina', type: AssetType.REAL_ESTATE, value: 240000, monthlyCashflow: 0, teamId: 'team-regina' } ], 
                liabilities: [ { id: 'l-regina-1', name: 'Hipoteca Regina', balance: 220000, interestRate: 3.49, monthlyPayment: 1000, teamId: 'team-regina' } ] 
            }
        },
        {
            id: 'team-viandas', name: 'Negocio de la viandas', memberIds: ['german', 'valeria'], goals: [], accounts: [],
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
                { id: 'g-car', name: 'Auto de German', type: AssetType.OTHER, value: 15000, monthlyCashflow: 0 },
                { id: 'g-a1', name: 'Grupo Financiero Galicia', type: AssetType.STOCK, value: 1000, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 4, purchasePrice: 250 },
                { id: 'g-a2', name: 'Pampa Energia', type: AssetType.STOCK, value: 800, monthlyCashflow: 0, ticker: 'PAM', numberOfShares: 10, purchasePrice: 80 },
                { id: 'g-a3', name: 'YPF', type: AssetType.STOCK, value: 400, monthlyCashflow: 0, ticker: 'YPF', numberOfShares: 10, purchasePrice: 40 },
                { id: 'g-a4', name: 'Supervielle', type: AssetType.STOCK, value: 200, monthlyCashflow: 0, ticker: 'SUPV', numberOfShares: 10, purchasePrice: 20 },
                { id: 'g-a5', name: 'BBVA Argentina', type: AssetType.STOCK, value: 300, monthlyCashflow: 0, ticker: 'BBAR', numberOfShares: 10, purchasePrice: 30 },
                { id: 'g-a6', name: 'Banco Macro', type: AssetType.STOCK, value: 600, monthlyCashflow: 0, ticker: 'BMA', numberOfShares: 10, purchasePrice: 60 },
                { id: 'g-a7', name: 'Loma Negra', type: AssetType.STOCK, value: 150, monthlyCashflow: 0, ticker: 'LOMA', numberOfShares: 10, purchasePrice: 15 },
                { id: 'g-a8', name: 'Vista Energy', type: AssetType.STOCK, value: 500, monthlyCashflow: 0, ticker: 'VIST', numberOfShares: 10, purchasePrice: 50 },
                { id: 'j-a1', name: 'Grupo Financiero Galicia (Conjunto)', type: AssetType.STOCK, value: 1050, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 4.2, purchasePrice: 250, shares: [{ userId: 'german', percentage: 50 }, { userId: 'valeria', percentage: 50 }] },
            ],
            liabilities: [
                { id: 'g-car-loan', name: 'Préstamo del Auto', balance: 35000, interestRate: 8.99, monthlyPayment: 650 },
            ],
            transactions: [
                { id: 'g-salary', description: 'Salario German', amount: 5000, type: TransactionType.INCOME, category: 'Job', date: '2023-10-15', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 5000 }] },
                { id: 'g-car-payment', description: 'Pago Auto y Seguro', amount: 800, type: TransactionType.EXPENSE, category: 'Transportation', date: '2023-10-20', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 800 }], expenseShares: [{ userId: 'german', amount: 800 }] },
            ]
        },
        valeria: {
             assets: [
                { id: 'v-a1', name: 'Grupo Financiero Galicia', type: AssetType.STOCK, value: 2500, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 10, purchasePrice: 250 },
                { id: 'v-a2', name: 'Pampa Energia', type: AssetType.STOCK, value: 800, monthlyCashflow: 0, ticker: 'PAM', numberOfShares: 10, purchasePrice: 80 },
                { id: 'v-a3', name: 'YPF', type: AssetType.STOCK, value: 1000, monthlyCashflow: 0, ticker: 'YPF', numberOfShares: 25, purchasePrice: 40 },
                { id: 'v-a4', name: 'Supervielle', type: AssetType.STOCK, value: 200, monthlyCashflow: 0, ticker: 'SUPV', numberOfShares: 10, purchasePrice: 20 },
                { id: 'v-a5', name: 'BBVA Argentina', type: AssetType.STOCK, value: 600, monthlyCashflow: 0, ticker: 'BBAR', numberOfShares: 20, purchasePrice: 30 },
                { id: 'v-a6', name: 'Banco Macro', type: AssetType.STOCK, value: 600, monthlyCashflow: 0, ticker: 'BMA', numberOfShares: 10, purchasePrice: 60 },
                { id: 'v-a7', name: 'Loma Negra', type: AssetType.STOCK, value: 300, monthlyCashflow: 0, ticker: 'LOMA', numberOfShares: 20, purchasePrice: 15 },
                { id: 'v-a8', name: 'Vista Energy', type: AssetType.STOCK, value: 1000, monthlyCashflow: 0, ticker: 'VIST', numberOfShares: 20, purchasePrice: 50 },
            ],
            liabilities: [],
            transactions: [
                 { id: 'v-salary', description: 'Salario Valeria', amount: 4500, type: TransactionType.INCOME, category: 'Job', date: '2023-10-15', paymentShares: [{ userId: 'valeria', accountId: 'v-savings-1', amount: 4500 }] },
            ]
        },
    }
};

const seedInitialData = async () => {
    console.log("Seeding initial, real data to Firestore...");
    const batchOp = writeBatch(db);

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
        const userRef = doc(db, "users", user.id);
        batchOp.set(userRef, user);
    });
    
    initialData.teams.forEach(team => {
        const teamRef = doc(db, "teams", team.id);
        batchOp.set(teamRef, team);
    });
    
    await batchOp.commit();
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

const findTransactionInStatements = (statements: { transactions: Transaction[] }[], txId: string): [Transaction | undefined, { transactions: Transaction[] } | undefined] => {
    for (const statement of statements) {
        const tx = statement.transactions.find(t => t.id === txId);
        if (tx) return [tx, statement];
    }
    return [undefined, undefined];
};


export const dbService = {
    getUsers: async (): Promise<User[]> => {
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        if (userSnapshot.empty) return await seedInitialData();
        return userSnapshot.docs.map(doc => sanitizeUser(doc.data()));
    },

    getTeamsForUser: async(userId: string): Promise<Team[]> => {
        const teamsCol = collection(db, 'teams');
        const q = query(teamsCol, where('memberIds', 'array-contains', userId));
        const teamSnapshot = await getDocs(q);
        if(teamSnapshot.empty) return [];
        return teamSnapshot.docs.map(doc => doc.data() as Team);
    },
    
    createTeam: async(name: string, memberIds: string[]): Promise<Team> => {
        const teamRef = doc(collection(db, 'teams'));
        const newTeam: Team = {
            id: teamRef.id,
            name,
            memberIds,
            accounts: [],
            financialStatement: { transactions: [], assets: [], liabilities: [] },
            goals: [{ description: `Achieve Net Worth of $100,000`, current: 0, target: 100000 }]
        };
        const batchOp = writeBatch(db);
        batchOp.set(teamRef, newTeam);
        await batchOp.commit();
        return newTeam;
    },

    addAccount: async (userId: string, accountData: Omit<Account, 'id' | 'ownerIds'>): Promise<User> => {
        // This function will need to be refactored to read and write using v9 syntax
        // For now, it's a placeholder to avoid breaking the app structure
        console.error("addAccount not implemented with v9");
        throw new Error("addAccount not implemented with v9");
    },

    addTransaction: async (activeUserId: string, transaction: Omit<Transaction, 'id'>, allUsers: User[]): Promise<User[]> => {
        console.error("addTransaction not implemented with v9");
        throw new Error("addTransaction not implemented with v9");
    },

    updateTransaction: async (updatedTx: Transaction, allUsers: User[], allTeams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
        console.error("updateTransaction not implemented with v9");
        throw new Error("updateTransaction not implemented with v9");
    },

    deleteTransaction: async (txId: string, allUsers: User[], allTeams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
        console.error("deleteTransaction not implemented with v9");
        throw new Error("deleteTransaction not implemented with v9");
    },

    addTeamTransaction: async (transaction: Omit<Transaction, 'id'>): Promise<Team> => {
        console.error("addTeamTransaction not implemented with v9");
        throw new Error("addTeamTransaction not implemented with v9");
    },

    performTransfer: async (userId: string, fromAccountId: string, toAccountId: string, amount: number, isSettleUp: boolean): Promise<User> => {
        console.error("performTransfer not implemented with v9");
        throw new Error("performTransfer not implemented with v9");
    },
    
    addAsset: async (userId: string, assetData: Partial<Asset>): Promise<User> => {
       console.error("addAsset not implemented with v9");
        throw new Error("addAsset not implemented with v9");
    },
    addTeamAsset: async(teamId: string, assetData: Partial<Asset>): Promise<Team> => {
        console.error("addTeamAsset not implemented with v9");
        throw new Error("addTeamAsset not implemented with v9");
    },
    
    addLiability: async (userId: string, liabilityData: Partial<Liability>): Promise<User> => {
        console.error("addLiability not implemented with v9");
        throw new Error("addLiability not implemented with v9");
    },
    addTeamLiability: async(teamId: string, liabilityData: Partial<Liability>): Promise<Team> => {
       console.error("addTeamLiability not implemented with v9");
        throw new Error("addTeamLiability not implemented with v9");
    },

    updateAsset: async (userId: string, assetId: string, assetData: Partial<Asset>): Promise<User> => {
        console.error("updateAsset not implemented with v9");
        throw new Error("updateAsset not implemented with v9");
    },

    updateLiability: async (userId: string, liabilityId: string, liabilityData: Partial<Liability>): Promise<User> => {
       console.error("updateLiability not implemented with v9");
        throw new Error("updateLiability not implemented with v9");
    },
    
    updateTeamAsset: async (teamId: string, assetId: string, assetData: Partial<Asset>): Promise<Team> => {
       console.error("updateTeamAsset not implemented with v9");
        throw new Error("updateTeamAsset not implemented with v9");
    },

    updateTeamLiability: async (teamId: string, liabilityId: string, liabilityData: Partial<Liability>): Promise<Team> => {
       console.error("updateTeamLiability not implemented with v9");
        throw new Error("updateTeamLiability not implemented with v9");
    },

    deleteAsset: async (userId: string, assetId: string): Promise<User> => {
        console.error("deleteAsset not implemented with v9");
        throw new Error("deleteAsset not implemented with v9");
    },

    logDividend: async (user: User, assetId: string, amount: number, accountId: string): Promise<User> => {
        console.error("logDividend not implemented with v9");
        throw new Error("logDividend not implemented with v9");
    },

    applyEventOutcome: async (user: User, outcome: EventOutcome): Promise<User> => {
        console.error("applyEventOutcome not implemented with v9");
        throw new Error("applyEventOutcome not implemented with v9");
    }
};
