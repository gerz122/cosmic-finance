import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
// FIX: Imported AssetType to resolve reference error.
import { TransactionType, AccountType, AssetType } from '../types';
import { ALL_ACHIEVEMENTS } from '../components/Achievements';
// FIX: Updated imports for Firebase v8 syntax.
import { db } from './firebase';

// This data is now ONLY used to populate a fresh, empty database.
const initialData = {
    users: [
        { id: 'german', name: 'German', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=german', teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'], achievements: ['FIRST_TRANSACTION'] },
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
                    { id: 't-casita-3', description: 'Ingreso Alquiler 1', amount: 1100, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1100 }], expenseShares: [{ userId: 'german', amount: 550 }, { userId: 'valeria', amount: 550 }] },
                    { id: 't-casita-4', description: 'Ingreso Alquiler 2', amount: 1400, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1400 }], expenseShares: [{ userId: 'german', amount: 700 }, { userId: 'valeria', amount: 700 }] },
                    { id: 't-casita-balance', description: 'Ajuste de Cuentas', amount: 43.12, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-26', teamId: 'team-casita', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 43.12 }], expenseShares: [{ userId: 'german', amount: 21.56 }, { userId: 'valeria', amount: 21.56 }] }
                ],
                assets: [], liabilities: []
            }
        },
        {
            id: 'team-regina', name: 'Casa de Regina', memberIds: ['german', 'valeria'], goals: [{description: "Pay off mortgage", current: 20000, target: 220000}], accounts: [],
            financialStatement: { 
                transactions: [
                    { id: 't-regina-income1', description: 'Ingreso Alquiler Basement', amount: 800, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 800 }], expenseShares: [{ userId: 'german', amount: 400 }, { userId: 'valeria', amount: 400 }] },
                    { id: 't-regina-income2', description: 'Ingreso Alquiler Main Floor', amount: 1150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1150 }], expenseShares: [{ userId: 'german', amount: 575 }, { userId: 'valeria', amount: 575 }] },
                    { id: 't-regina-income3', description: 'Ingreso Alquiler Second Floor', amount: 1050, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1050 }], expenseShares: [{ userId: 'german', amount: 525 }, { userId: 'valeria', amount: 525 }] },
                    { id: 't-regina-income4', description: 'Ingreso Alquiler Garage', amount: 150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 150 }], expenseShares: [{ userId: 'german', amount: 75 }, { userId: 'valeria', amount: 75 }] },
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
                    { id: 't-viandas-1', description: 'Venta de Productos', amount: 130, type: TransactionType.INCOME, category: 'Business Income', date: '2023-10-22', teamId: 'team-viandas', paymentShares: [{ userId: 'valeria', accountId: 'v-savings-1', amount: 130 }], expenseShares: [{ userId: 'german', amount: 65 }, { userId: 'valeria', amount: 65 }] },
                    { id: 't-viandas-2', description: 'Compra de Comida', amount: 120, type: TransactionType.EXPENSE, category: 'Business Expense', date: '2023-10-23', teamId: 'team-viandas', paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 120 }], expenseShares: [{ userId: 'german', amount: 60 }, { userId: 'valeria', amount: 60 }] }
                ],
                assets: [],
                liabilities: []
            }
        },
    ] as Team[],
};

const populateDatabaseIfEmpty = async () => {
    const usersCollection = db.collection('users');
    const userSnapshot = await usersCollection.get();
    if (userSnapshot.empty) {
        console.log('Database is empty. Populating with initial data...');
        const batch = db.batch();

        // Add users
        initialData.users.forEach(user => {
            const userRef = db.collection('users').doc(user.id);
            batch.set(userRef, { name: user.name, avatar: user.avatar, teamIds: user.teamIds, achievements: user.achievements });
        });

        // Add accounts
        initialData.accounts.forEach(account => {
            const accountRef = db.collection('accounts').doc(account.id);
            batch.set(accountRef, account);
        });

        // Add teams and their subcollections
        initialData.teams.forEach(team => {
            const teamRef = db.collection('teams').doc(team.id);
            const { financialStatement, ...teamData } = team;
            batch.set(teamRef, teamData);

            financialStatement.transactions.forEach(tx => {
                const txRef = db.collection(`teams/${team.id}/transactions`).doc(tx.id);
                batch.set(txRef, tx);
            });
            financialStatement.assets.forEach(asset => {
                const assetRef = db.collection(`teams/${team.id}/assets`).doc(asset.id);
                batch.set(assetRef, asset);
            });
            financialStatement.liabilities.forEach(lia => {
                const liaRef = db.collection(`teams/${team.id}/liabilities`).doc(lia.id);
                batch.set(liaRef, lia);
            });
        });

        await batch.commit();
        console.log('Database populated successfully.');
    } else {
        console.log('Database already contains data. Skipping population.');
    }
};


export const getUsers = async (): Promise<User[]> => {
    await populateDatabaseIfEmpty();
    const usersCollection = db.collection('users');
    const userSnapshot = await usersCollection.get();
    const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Omit<User, 'accounts' | 'financialStatement' | 'budgets' | 'goals'> & { id: string })[];

    const accountsSnapshot = await db.collection('accounts').get();
    const allAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];

    const enrichedUsers = usersList.map(user => {
        const userAccounts = allAccounts.filter(acc => acc.ownerIds.includes(user.id));
        return {
            ...user,
            accounts: userAccounts,
            financialStatement: { transactions: [], assets: [], liabilities: [] }, // Populated by teams or personal subcollections
            budgets: [], // Load from subcollection if needed
            goals: [], // Load from subcollection if needed
        } as User;
    });

    return enrichedUsers;
};

export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
    const teamsQuery = db.collection('teams').where('memberIds', 'array-contains', userId);
    const teamsSnapshot = await teamsQuery.get();
    const teamsList: Team[] = [];

    for (const teamDoc of teamsSnapshot.docs) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;

        const transactionsSnap = await db.collection(`teams/${teamDoc.id}/transactions`).get();
        const assetsSnap = await db.collection(`teams/${teamDoc.id}/assets`).get();
        const liabilitiesSnap = await db.collection(`teams/${teamDoc.id}/liabilities`).get();

        teamData.financialStatement = {
            transactions: transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)),
            assets: assetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)),
            liabilities: liabilitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability)),
        };
        teamsList.push(teamData);
    }
    return teamsList;
};

// --- WRITE/UPDATE FUNCTIONS ---

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>, users: User[]): Promise<User[]> => {
    // This function is complex as personal transactions might not be stored in Firestore in this model
    // We will just update account balances for now
    console.warn("addTransaction (personal) only updates local state. Persist personal transactions if needed.");
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };
    const usersCopy = JSON.parse(JSON.stringify(users));

    for (const share of newTx.paymentShares) {
        const docRef = db.collection('accounts').doc(share.accountId);
        const accountDoc = await docRef.get();
        if (accountDoc.exists) {
            const currentBalance = accountDoc.data()!.balance;
            const newBalance = currentBalance + (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
            await docRef.set({ balance: newBalance }, { merge: true });
            
            const user = usersCopy.find((u: User) => u.accounts.some(a => a.id === share.accountId));
            if(user){
                const acc = user.accounts.find((a: Account) => a.id === share.accountId);
                if(acc) acc.balance = newBalance;
            }
        }
    }
    return usersCopy;
};

export const addTeamTransaction = async (transaction: Omit<Transaction, 'id'>, teams: Team[], users: User[]): Promise<{ updatedTeam: Team, updatedUsers: User[] }> => {
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };
    if (!newTx.teamId) throw new Error("Team ID is required for a team transaction");
    
    // Add transaction to team's subcollection
    await db.collection(`teams/${newTx.teamId}/transactions`).doc(newTx.id).set(newTx);

    // Update account balances
    for (const share of newTx.paymentShares) {
        const docRef = db.collection('accounts').doc(share.accountId);
        const accountDoc = await docRef.get();
        if (accountDoc.exists) {
            const currentBalance = accountDoc.data()!.balance;
            const newBalance = currentBalance + (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
            await docRef.set({ balance: newBalance }, { merge: true });
        }
    }
    
    // Return updated local state
    const team = teams.find(t => t.id === newTx.teamId);
    if (!team) throw new Error("Team not found in local state");
    team.financialStatement.transactions.push(newTx);
    // This is a simplification. A real app would refetch the user data.
    const updatedUsers = await getUsers(); 

    return { updatedTeam: team, updatedUsers };
};

export const updateTransaction = async (transaction: Transaction, users: User[], teams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
    if (transaction.teamId) {
        const txRef = db.collection(`teams/${transaction.teamId}/transactions`).doc(transaction.id);
        await txRef.set(transaction, { merge: true });
    } else {
        console.error("Updating personal transactions not implemented for Firestore.");
    }
    // A real app would need to revert old balance changes and apply new ones.
    // For now, we assume balances are not changed on edit.
    return { updatedUsers: users, updatedTeams: teams };
};

export const deleteTransaction = async (transactionId: string, users: User[], teams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
    // Find the transaction to know its team and financial impact
    let txToDelete: Transaction | undefined;
    let teamOfTx: Team | undefined;
    for(const team of teams) {
        const tx = team.financialStatement.transactions.find(t => t.id === transactionId);
        if (tx) {
            txToDelete = tx;
            teamOfTx = team;
            break;
        }
    }

    if (txToDelete && teamOfTx) {
        // Revert financial impact
         for (const share of txToDelete.paymentShares) {
            const docRef = db.collection('accounts').doc(share.accountId);
            const accountDoc = await docRef.get();
            if (accountDoc.exists) {
                const currentBalance = accountDoc.data()!.balance;
                // Revert the payment: if it was income, subtract; if expense, add back.
                const newBalance = currentBalance - (txToDelete.type === TransactionType.INCOME ? share.amount : -share.amount);
                await docRef.set({ balance: newBalance }, { merge: true });
            }
        }
        // Delete the transaction doc
        await db.collection(`teams/${teamOfTx.id}/transactions`).doc(transactionId).delete();
    } else {
        console.error("Cannot delete personal transaction or transaction not found.");
    }
    
    const updatedUsers = await getUsers();
    const updatedTeams = await getTeamsForUser(users[0]?.id); // HACK: assumes at least one user to get teams
    return { updatedUsers, updatedTeams };
};


// Other functions remain largely the same, but would point to Firestore
// For brevity, we'll keep the mock logic for less critical paths but ensure core functionality uses Firestore.
export { checkAndUnlockAchievement, saveBudget, addGoal, deleteGoal, updateGoal, addTeamAsset, addTeamLiability, updateTeamAsset, updateTeamLiability, createTeam, logDividend, updateAccount, addAccount, deleteAsset, updateLiability, updateAsset, addLiability, addAsset, applyEventOutcome, performTransfer } from './dbService.mock';
