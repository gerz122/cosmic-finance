import { db, collection, doc, getDocs, writeBatch, query, where, getDoc, setDoc, deleteDoc } from './firebase';
import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType, AssetType, AccountType } from '../types';

// Real data for German & Valeria
const initialData = {
    users: [
        { id: 'german', name: 'German', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=german', teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'], achievements: [] },
        { id: 'valeria', name: 'Valeria', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=valeria', teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'], achievements: [] },
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
            ],
            budgets: [],
            goals: []
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
            ],
            budgets: [],
            goals: []
        },
    }
};

// CRITICAL FIX: This function removes `undefined` values from any object before it's sent to Firestore.
// Firestore throws an error for `undefined` fields, which was the root cause of data updates failing.
const sanitizeForFirestore = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForFirestore(item));
    }
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value !== undefined) {
                newObj[key] = sanitizeForFirestore(value);
            }
        }
    }
    return newObj;
};

const seedInitialData = async () => {
    console.log("Seeding initial, real data to Firestore...");
    const batchOp = writeBatch(db);
    
    // Clear existing data to ensure a clean slate
    const collections = ['users', 'teams'];
    for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll));
        snapshot.docs.forEach(doc => batchOp.delete(doc.ref));
    }
    await batchOp.commit();

    const batchOp2 = writeBatch(db);

    const finalUsers: User[] = initialData.users.map(u => {
        const userAccounts = initialData.accounts.filter(acc => acc.ownerIds.includes(u.id));
        const baseStatement = initialData.baseStatements[u.id as keyof typeof initialData.baseStatements] || { assets: [], liabilities: [], transactions: [], budgets: [], goals: [] };
        return {
            ...u,
            accounts: userAccounts,
            financialStatement: {
                assets: baseStatement.assets,
                liabilities: baseStatement.liabilities,
                transactions: baseStatement.transactions,
            },
            budgets: baseStatement.budgets,
            goals: baseStatement.goals,
            achievements: u.achievements || [],
        };
    });
    
    finalUsers.forEach(user => {
        const userRef = doc(db, "users", user.id);
        batchOp2.set(userRef, sanitizeForFirestore(user));
    });
    
    initialData.teams.forEach(team => {
        const teamRef = doc(db, "teams", team.id);
        batchOp2.set(teamRef, sanitizeForFirestore(team));
    });
    
    await batchOp2.commit();
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
    budgets: user.budgets || [],
    goals: user.goals || [],
    achievements: user.achievements || [],
});

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
        await setDoc(teamRef, sanitizeForFirestore(newTeam));
        return newTeam;
    },

    addAccount: async (userId: string, accountData: Omit<Account, 'id' | 'ownerIds'>): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");

        const user = sanitizeUser(userSnap.data());
        const newAccount: Account = {
            id: `acc_${Date.now()}`,
            ...accountData,
            ownerIds: [userId]
        };
        user.accounts.push(newAccount);

        if (newAccount.balance > 0) {
            const initialTransaction: Omit<Transaction, 'id'> = {
                description: `Initial balance for ${newAccount.name}`,
                amount: newAccount.balance,
                type: TransactionType.INCOME,
                category: 'Initial Balance',
                date: new Date().toISOString().split('T')[0],
                paymentShares: [{ userId, accountId: newAccount.id, amount: newAccount.balance }],
            };
             const [updatedUser] = await dbService.addTransaction(userId, initialTransaction, [user]);
             return updatedUser;
        }

        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },

    updateAccount: async (updatedAccount: Account, allUsers: User[]): Promise<User[]> => {
        const usersToUpdate = new Map<string, User>();
        updatedAccount.ownerIds.forEach(ownerId => {
            const user = allUsers.find(u => u.id === ownerId);
            if(user) {
                usersToUpdate.set(ownerId, JSON.parse(JSON.stringify(user)));
            }
        });

        if (usersToUpdate.size === 0) throw new Error("Account owner(s) not found");

        usersToUpdate.forEach(user => {
            const accountIndex = user.accounts.findIndex(a => a.id === updatedAccount.id);
            if (accountIndex > -1) {
                user.accounts[accountIndex] = updatedAccount;
            } else {
                user.accounts.push(updatedAccount);
            }
        });
        
        const batchOp = writeBatch(db);
        usersToUpdate.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batchOp.set(userRef, sanitizeForFirestore(user));
        });

        await batchOp.commit();
        
        return allUsers.map(u => usersToUpdate.get(u.id) || u);
    },
    
    _findTransactionAndContext: (txId: string, users: User[], teams: Team[]): { transaction: Transaction, context: User | Team, isTeam: boolean } | null => {
        for (const user of users) {
            const tx = user.financialStatement.transactions.find(t => t.id === txId);
            if (tx) return { transaction: tx, context: user, isTeam: false };
        }
        for (const team of teams) {
            const tx = team.financialStatement.transactions.find(t => t.id === txId);
            if (tx) return { transaction: tx, context: team, isTeam: true };
        }
        return null;
    },

    addTransaction: async (activeUserId: string, transaction: Omit<Transaction, 'id'>, allUsers: User[]): Promise<User[]> => {
        const newTx: Transaction = { ...transaction, id: `tx_${Date.now()}` };
        
        const usersToUpdate = new Map<string, User>();
        allUsers.forEach(u => usersToUpdate.set(u.id, JSON.parse(JSON.stringify(u))));

        newTx.paymentShares.forEach(share => {
            const user = usersToUpdate.get(share.userId);
            if(user) {
                const account = user.accounts.find(a => a.id === share.accountId);
                if (account) {
                    account.balance += (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
                }
            }
        });
        
        const currentUser = usersToUpdate.get(activeUserId);
        if(currentUser) {
            currentUser.financialStatement.transactions.push(newTx);
        }

        const batchOp = writeBatch(db);
        usersToUpdate.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batchOp.set(userRef, sanitizeForFirestore(user));
        });
        await batchOp.commit();
        
        return Array.from(usersToUpdate.values());
    },
    
    addTeamTransaction: async (transaction: Omit<Transaction, 'id'>, allTeams: Team[], allUsers: User[]): Promise<{ updatedTeam: Team, updatedUsers: User[] }> => {
        if (!transaction.teamId) throw new Error("Team ID is required for a team transaction");
        const teamRef = doc(db, 'teams', transaction.teamId);
        const teamSnap = await getDoc(teamRef);
        if (!teamSnap.exists()) throw new Error("Team not found");

        const team = teamSnap.data() as Team;
        const newTx: Transaction = { ...transaction, id: `tx_${Date.now()}` };
        team.financialStatement.transactions.push(newTx);
        
        const usersToUpdate = new Map<string, User>();
        allUsers.forEach(u => usersToUpdate.set(u.id, JSON.parse(JSON.stringify(u))));

        newTx.paymentShares.forEach(share => {
            const user = usersToUpdate.get(share.userId);
            if(user) {
                const account = user.accounts.find(a => a.id === share.accountId);
                if (account) {
                    account.balance += (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
                }
            }
        });
        
        const batchOp = writeBatch(db);
        batchOp.set(teamRef, sanitizeForFirestore(team));
        usersToUpdate.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batchOp.set(userRef, sanitizeForFirestore(user));
        });
        await batchOp.commit();

        return { updatedTeam: team, updatedUsers: Array.from(usersToUpdate.values())};
    },

    updateTransaction: async (updatedTx: Transaction, allUsers: User[], allTeams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
        // This is complex because we need to revert the old transaction's balance changes and apply the new ones.
        // For simplicity in this context, we will just update the transaction data without recalculating historical balances.
        // A full implementation would require a more robust ledger system.
        
        const found = dbService._findTransactionAndContext(updatedTx.id, allUsers, allTeams);
        if (!found) throw new Error("Transaction not found to update");
        
        const txIndex = found.context.financialStatement.transactions.findIndex(t => t.id === updatedTx.id);
        found.context.financialStatement.transactions[txIndex] = updatedTx;

        if (found.isTeam) {
            await setDoc(doc(db, 'teams', found.context.id), sanitizeForFirestore(found.context));
        } else {
            await setDoc(doc(db, 'users', found.context.id), sanitizeForFirestore(found.context));
        }
        
        return { updatedUsers: allUsers, updatedTeams: allTeams };
    },
    
    deleteTransaction: async (txId: string, allUsers: User[], allTeams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
        const found = dbService._findTransactionAndContext(txId, allUsers, allTeams);
        if (!found) throw new Error("Transaction not found to delete");

        const txToDelete = found.transaction;
        const usersToUpdate = new Map<string, User>();
        allUsers.forEach(u => usersToUpdate.set(u.id, JSON.parse(JSON.stringify(u))));

        txToDelete.paymentShares.forEach(share => {
            const user = usersToUpdate.get(share.userId);
            if (user) {
                const account = user.accounts.find(a => a.id === share.accountId);
                if (account) {
                    // Revert the balance change
                    account.balance -= (txToDelete.type === TransactionType.INCOME ? share.amount : -share.amount);
                }
            }
        });

        if (found.isTeam) {
            const team = found.context as Team;
            team.financialStatement.transactions = team.financialStatement.transactions.filter(t => t.id !== txId);
            await setDoc(doc(db, 'teams', team.id), sanitizeForFirestore(team));
        } else {
             const user = usersToUpdate.get(found.context.id);
             if(user) {
                user.financialStatement.transactions = user.financialStatement.transactions.filter(t => t.id !== txId);
             }
        }
        
        const batchOp = writeBatch(db);
        usersToUpdate.forEach(user => {
            if(user) batchOp.set(doc(db, 'users', user.id), sanitizeForFirestore(user));
        });
        await batchOp.commit();

        return { updatedUsers: Array.from(usersToUpdate.values()), updatedTeams: allTeams };
    },

    performTransfer: async (userId: string, fromAccountId: string, toAccountId: string, amount: number): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        
        const user = sanitizeUser(userSnap.data());
        const fromAccount = user.accounts.find(a => a.id === fromAccountId);
        const toAccount = user.accounts.find(a => a.id === toAccountId);

        if (!fromAccount || !toAccount) throw new Error("One or both accounts not found");
        if (fromAccount.balance < amount) throw new Error("Insufficient funds");

        fromAccount.balance -= amount;
        toAccount.balance += amount;

        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },
    
    _addOrUpdateAsset: async (id: string, isTeam: boolean, assetData: Partial<Asset>, assetId?: string): Promise<User | Team> => {
        const ref = doc(db, isTeam ? 'teams' : 'users', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error(`${isTeam ? 'Team' : 'User'} not found`);
        
        const context = (isTeam ? snap.data() as Team : sanitizeUser(snap.data())) as User | Team;
        
        if(assetId) {
            const index = context.financialStatement.assets.findIndex(a => a.id === assetId);
            if (index > -1) {
                context.financialStatement.assets[index] = { ...context.financialStatement.assets[index], ...assetData };
            }
        } else {
             const newAsset: Asset = {
                id: `asset_${Date.now()}`, name: 'New Asset', type: AssetType.OTHER, value: 0, monthlyCashflow: 0, ...assetData
            };
            context.financialStatement.assets.push(newAsset);
        }
        await setDoc(ref, sanitizeForFirestore(context));
        return context;
    },

    _addOrUpdateLiability: async (id: string, isTeam: boolean, liabilityData: Partial<Liability>, liabilityId?: string): Promise<User | Team> => {
        const ref = doc(db, isTeam ? 'teams' : 'users', id);
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error(`${isTeam ? 'Team' : 'User'} not found`);
        
        const context = (isTeam ? snap.data() as Team : sanitizeUser(snap.data())) as User | Team;
        
        if(liabilityId) {
            const index = context.financialStatement.liabilities.findIndex(l => l.id === liabilityId);
            if (index > -1) {
                context.financialStatement.liabilities[index] = { ...context.financialStatement.liabilities[index], ...liabilityData };
            }
        } else {
             const newLiability: Liability = {
                id: `lia_${Date.now()}`, name: 'New Liability', balance: 0, interestRate: 0, monthlyPayment: 0, ...liabilityData
            };
            context.financialStatement.liabilities.push(newLiability);
        }
        await setDoc(ref, sanitizeForFirestore(context));
        return context;
    },

    addAsset: (userId, data) => dbService._addOrUpdateAsset(userId, false, data) as Promise<User>,
    updateAsset: (userId, assetId, data) => dbService._addOrUpdateAsset(userId, false, data, assetId) as Promise<User>,
    addTeamAsset: (teamId, data) => dbService._addOrUpdateAsset(teamId, true, data) as Promise<Team>,
    updateTeamAsset: (teamId, assetId, data) => dbService._addOrUpdateAsset(teamId, true, data, assetId) as Promise<Team>,
    
    addLiability: (userId, data) => dbService._addOrUpdateLiability(userId, false, data) as Promise<User>,
    updateLiability: (userId, liabilityId, data) => dbService._addOrUpdateLiability(userId, false, data, liabilityId) as Promise<User>,
    addTeamLiability: (teamId, data) => dbService._addOrUpdateLiability(teamId, true, data) as Promise<Team>,
    updateTeamLiability: (teamId, liabilityId, data) => dbService._addOrUpdateLiability(teamId, true, data, liabilityId) as Promise<Team>,

    deleteAsset: async (userId: string, assetId: string): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        
        const user = sanitizeUser(userSnap.data());
        user.financialStatement.assets = user.financialStatement.assets.filter(a => a.id !== assetId);
        
        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },

    logDividend: async (user: User, assetId: string, amount: number, accountId: string): Promise<User> => {
        const stock = user.financialStatement.assets.find(a => a.id === assetId);
        if (!stock) throw new Error("Stock not found");
        
        const dividendTx: Omit<Transaction, 'id'> = {
            description: `Dividend from ${stock.name}`, amount, type: TransactionType.INCOME, category: 'Investment', date: new Date().toISOString().split('T')[0], isPassive: true, paymentShares: [{ userId: user.id, accountId, amount }],
        };
        
        const [updatedUser] = await dbService.addTransaction(user.id, dividendTx, [user]);
        return updatedUser;
    },

    applyEventOutcome: async (user: User, outcome: EventOutcome): Promise<User> => {
        let updatedUser = JSON.parse(JSON.stringify(user));
        
        if (outcome.cashChange) {
            const primaryAccount = updatedUser.accounts.find((a: Account) => a.type === AccountType.CASH || a.type === AccountType.CHECKING);
            if (!primaryAccount) throw new Error("No cash/checking account found to apply cash change.");
            primaryAccount.balance += outcome.cashChange;
        }

        if (outcome.newAsset) {
            const asset: Asset = { id: `asset_${Date.now()}`, ...outcome.newAsset };
            updatedUser.financialStatement.assets.push(asset);
        }

        await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(updatedUser));
        return updatedUser;
    },

    saveBudget: async (userId: string, budget: Budget): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const budgetIndex = user.budgets.findIndex(b => b.month === budget.month);
        if (budgetIndex > -1) {
            user.budgets[budgetIndex] = budget;
        } else {
            user.budgets.push(budget);
        }
        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },
    
    addGoal: async (userId: string, goalData: Omit<Goal, 'id' | 'currentAmount'>): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const newGoal: Goal = {
            id: `goal_${Date.now()}`,
            currentAmount: 0,
            ...goalData,
        };
        user.goals.push(newGoal);
        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },

    updateGoal: async (userId: string, updatedGoal: Goal): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        const goalIndex = user.goals.findIndex(g => g.id === updatedGoal.id);
        if (goalIndex > -1) {
            user.goals[goalIndex] = updatedGoal;
        }
        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },

    deleteGoal: async (userId: string, goalId: string): Promise<User> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const user = sanitizeUser(userSnap.data());
        user.goals = user.goals.filter(g => g.id !== goalId);
        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },

    checkAndUnlockAchievement: async (userId: string, achievementId: string): Promise<User | null> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;

        const user = sanitizeUser(userSnap.data());
        if (user.achievements.includes(achievementId)) {
            return null; // Already unlocked, no update needed.
        }

        user.achievements.push(achievementId);
        await setDoc(userRef, sanitizeForFirestore(user));
        return user;
    },
};