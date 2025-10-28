import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType, AccountType, AssetType } from '../types';
import { ALL_ACHIEVEMENTS } from '../components/Achievements';
import { db, storage } from './firebase';
import { collection, getDocs, getDoc, doc, where, query, writeBatch, setDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";

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
    const usersCollectionRef = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollectionRef);
    if (userSnapshot.empty) {
        console.log('Database is empty. Populating with initial data...');
        const batch = writeBatch(db);

        // Add users
        initialData.users.forEach(user => {
            const userRef = doc(db, 'users', user.id);
            batch.set(userRef, { name: user.name, avatar: user.avatar, teamIds: user.teamIds, achievements: user.achievements });
        });

        // Add accounts
        initialData.accounts.forEach(account => {
            const accountRef = doc(db, 'accounts', account.id);
            batch.set(accountRef, account);
        });

        // Add teams and their subcollections
        initialData.teams.forEach(team => {
            const teamRef = doc(db, 'teams', team.id);
            const { financialStatement, ...teamData } = team;
            batch.set(teamRef, teamData);

            financialStatement.transactions.forEach(tx => {
                const txRef = doc(db, `teams/${team.id}/transactions`, tx.id);
                batch.set(txRef, tx);
            });
            financialStatement.assets.forEach(asset => {
                const assetRef = doc(db, `teams/${team.id}/assets`, asset.id);
                batch.set(assetRef, asset);
            });
            financialStatement.liabilities.forEach(lia => {
                const liaRef = doc(db, `teams/${team.id}/liabilities`, lia.id);
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
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    const usersList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Omit<User, 'accounts' | 'financialStatement' | 'budgets' | 'goals'> & { id: string })[];

    const accountsSnapshot = await getDocs(collection(db, 'accounts'));
    const allAccounts = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];

    const enrichedUsers = usersList.map(user => {
        const userAccounts = allAccounts.filter(acc => acc.ownerIds.includes(user.id));
        return {
            ...user,
            accounts: userAccounts,
            financialStatement: { transactions: [], assets: [], liabilities: [] },
            budgets: [],
            goals: [],
        } as User;
    });

    return enrichedUsers;
};

export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
    const teamsQuery = query(collection(db, 'teams'), where('memberIds', 'array-contains', userId));
    const teamsSnapshot = await getDocs(teamsQuery);
    const teamsList: Team[] = [];

    for (const teamDoc of teamsSnapshot.docs) {
        const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;

        const transactionsSnap = await getDocs(collection(db, `teams/${teamDoc.id}/transactions`));
        const assetsSnap = await getDocs(collection(db, `teams/${teamDoc.id}/assets`));
        const liabilitiesSnap = await getDocs(collection(db, `teams/${teamDoc.id}/liabilities`));

        teamData.financialStatement = {
            transactions: transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)),
            assets: assetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)),
            liabilities: liabilitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability)),
        };
        teamsList.push(teamData);
    }
    return teamsList;
};

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>, users: User[]): Promise<User[]> => {
    console.warn("addTransaction (personal) only updates account balances. Persist personal transactions if needed.");
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };
    const usersCopy = JSON.parse(JSON.stringify(users));

    for (const share of newTx.paymentShares) {
        const docRef = doc(db, 'accounts', share.accountId);
        await runTransaction(db, async (transaction) => {
            const accountDoc = await transaction.get(docRef);
            if (accountDoc.exists()) {
                const currentBalance = accountDoc.data().balance;
                const newBalance = currentBalance + (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
                transaction.update(docRef, { balance: newBalance });
            }
        });
    }
    return usersCopy;
};

export const addTeamTransaction = async (transaction: Omit<Transaction, 'id'>, teams: Team[], users: User[]): Promise<{ updatedTeam: Team, updatedUsers: User[] }> => {
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };
    if (!newTx.teamId) throw new Error("Team ID is required for a team transaction");
    
    await setDoc(doc(db, `teams/${newTx.teamId}/transactions`, newTx.id), newTx);

    for (const share of newTx.paymentShares) {
        const docRef = doc(db, 'accounts', share.accountId);
        await runTransaction(db, async (transaction) => {
            const accountDoc = await transaction.get(docRef);
            if (accountDoc.exists()) {
                const currentBalance = accountDoc.data().balance;
                const newBalance = currentBalance + (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
                transaction.update(docRef, { balance: newBalance });
            }
        });
    }
    
    const updatedUsers = await getUsers();
    return { updatedTeam: teams.find(t=>t.id === newTx.teamId)!, updatedUsers };
};

export const updateTransaction = async (transaction: Transaction, users: User[], teams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
    if (transaction.teamId) {
        const txRef = doc(db, `teams/${transaction.teamId}/transactions`, transaction.id);
        await setDoc(txRef, transaction, { merge: true });
    } else {
        console.error("Updating personal transactions not implemented for Firestore.");
    }
    return { updatedUsers: users, updatedTeams: teams };
};

export const deleteTransaction = async (transactionId: string, users: User[], teams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
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
        for (const share of txToDelete.paymentShares) {
            const docRef = doc(db, 'accounts', share.accountId);
            await runTransaction(db, async (transaction) => {
                const accountDoc = await transaction.get(docRef);
                if (accountDoc.exists()) {
                    const currentBalance = accountDoc.data().balance;
                    const newBalance = currentBalance - (txToDelete!.type === TransactionType.INCOME ? share.amount : -share.amount);
                    transaction.update(docRef, { balance: newBalance });
                }
            });
        }
        await deleteDoc(doc(db, `teams/${teamOfTx.id}/transactions`, transactionId));
    } else {
        console.error("Cannot delete personal transaction or transaction not found.");
    }
    
    const updatedUsers = await getUsers();
    const updatedTeams = teams.length > 0 ? await getTeamsForUser(teams[0].memberIds[0]) : [];
    return { updatedUsers, updatedTeams };
};

export const uploadReceipt = async (base64Image: string, userId: string): Promise<string> => {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/jpeg';
    const imageData = base64Image.split(',')[1];
    
    const filePath = `receipts/${userId}/${Date.now()}`;
    const storageRef = ref(storage, filePath);

    await uploadString(storageRef, imageData, 'base64', { contentType: mimeType });
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};


export { checkAndUnlockAchievement, saveBudget, addGoal, deleteGoal, updateGoal, addTeamAsset, addTeamLiability, updateTeamAsset, updateTeamLiability, createTeam, logDividend, updateAccount, addAccount, deleteAsset, updateLiability, updateAsset, addLiability, addAsset, applyEventOutcome, performTransfer } from './dbService.mock';