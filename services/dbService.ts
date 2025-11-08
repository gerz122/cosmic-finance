import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType, AccountType } from '../types';
import { auth, db, storage, firebase, User as FirebaseUser } from './firebase';
import { initialDataForGerman, initialDataForValeria, getInitialTeamData } from './initial.data';
import { ALL_ACHIEVEMENTS } from '../components/Achievements';

// --- Helper Functions ---

const cleanDataForFirestore = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(item => cleanDataForFirestore(item));
    }
    const cleaned: { [key: string]: any } = {};
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined) {
                cleaned[key] = cleanDataForFirestore(value);
            }
        }
    }
    return cleaned;
};


const getUserDoc = (uid: string) => db.collection('users').doc(uid);
const getTeamDoc = (teamId: string) => db.collection('teams').doc(teamId);

const getSubcollection = async <T>(docRef: firebase.firestore.DocumentReference, collectionName: string): Promise<T[]> => {
    const snapshot = await docRef.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as T));
};

// --- AUTH & USER DATA ---
export const findUserByEmail = async (email: string): Promise<User | null> => {
    const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
}

const createInitialDataWithSubcollections = async (batch: firebase.firestore.WriteBatch, uid: string, initialData: User) => {
    const userRef = getUserDoc(uid);
    const { accounts, financialStatement, ...mainUserData } = initialData;
    batch.set(userRef, cleanDataForFirestore(mainUserData));

    for (const account of accounts) {
        batch.set(userRef.collection('accounts').doc(account.id), cleanDataForFirestore(account));
    }
    for (const asset of financialStatement.assets) {
        batch.set(userRef.collection('assets').doc(asset.id), cleanDataForFirestore(asset));
    }
    for (const liability of financialStatement.liabilities) {
        batch.set(userRef.collection('liabilities').doc(liability.id), cleanDataForFirestore(liability));
    }
    for (const transaction of financialStatement.transactions) {
        batch.set(userRef.collection('transactions').doc(transaction.id), cleanDataForFirestore(transaction));
    }
};

const createNewGenericUser = (uid: string, name: string, email: string, avatar: string): User => {
    const checkingId = 'initial-checking';
    const savingsId = 'initial-savings';
    return {
        id: uid, name, email, avatar, teamIds: [], onboardingCompleted: false,
        accounts: [
            { id: checkingId, name: 'Checking', type: AccountType.CHECKING, balance: 1500, ownerIds: [uid] },
            { id: savingsId, name: 'Savings', type: AccountType.SAVINGS, balance: 5000, ownerIds: [uid] },
        ],
        financialStatement: {
            transactions: [
                { id: crypto.randomUUID(), description: 'Initial Balance', amount: 1500, type: TransactionType.INCOME, category: 'Initial Balance', date: new Date().toISOString().split('T')[0], paymentShares: [{ userId: uid, accountId: checkingId, amount: 1500 }] },
                { id: crypto.randomUUID(), description: 'Initial Balance', amount: 5000, type: TransactionType.INCOME, category: 'Initial Balance', date: new Date().toISOString().split('T')[0], paymentShares: [{ userId: uid, accountId: savingsId, amount: 5000 }] },
            ] as Transaction[],
            assets: [],
            liabilities: []
        },
        budgets: [], goals: [], achievements: []
    };
};


export const getOrCreateUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = getUserDoc(firebaseUser.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
        const userData = userDoc.data() as Omit<User, 'financialStatement' | 'accounts' | 'budgets' | 'goals'>;
        const [accounts, assets, liabilities, transactions, budgets, goals] = await Promise.all([
            getSubcollection<Account>(userRef, 'accounts'),
            getSubcollection<Asset>(userRef, 'assets'),
            getSubcollection<Liability>(userRef, 'liabilities'),
            getSubcollection<Transaction>(userRef, 'transactions'),
            getSubcollection<Budget>(userRef, 'budgets'),
            getSubcollection<Goal>(userRef, 'goals'),
        ]);
        return { 
            ...userData, 
            id: userDoc.id,
            accounts,
            financialStatement: { assets, liabilities, transactions },
            budgets,
            goals,
        } as User;
    } else {
        const { uid, email, displayName, photoURL } = firebaseUser;
        const name = displayName || email?.split('@')[0] || 'New Player';
        const avatar = photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${uid}`;

        const isGerman = email === 'german@example.com';
        const isValeria = email === 'valeria@example.com';
        
        const initialData = isGerman
            ? initialDataForGerman(uid, name, avatar, email!)
            : isValeria
            ? initialDataForValeria(uid, name, avatar, email!)
            : createNewGenericUser(uid, name, email!, avatar);

        const batch = db.batch();
        await createInitialDataWithSubcollections(batch, uid, initialData);

        if (isGerman || isValeria) {
            // This logic is for demo purposes to pre-populate a shared team
            const germanUser = isGerman ? { id: uid } : await findUserByEmail('german@example.com');
            const valeriaUser = isValeria ? { id: uid } : await findUserByEmail('valeria@example.com');

            if (germanUser && valeriaUser) {
                const teamData = getInitialTeamData([germanUser.id, valeriaUser.id]);
                const teamRef = db.collection('teams').doc('team-condo-1');
                const { accounts, financialStatement, ...mainTeamData } = teamData;
                batch.set(teamRef, cleanDataForFirestore(mainTeamData));
                accounts.forEach(acc => batch.set(teamRef.collection('accounts').doc(acc.id), cleanDataForFirestore(acc)));
                financialStatement.assets.forEach(asset => batch.set(teamRef.collection('assets').doc(asset.id), cleanDataForFirestore(asset)));
                financialStatement.liabilities.forEach(lia => batch.set(teamRef.collection('liabilities').doc(lia.id), cleanDataForFirestore(lia)));
                batch.update(getUserDoc(germanUser.id), { teamIds: ['team-condo-1'] });
                batch.update(getUserDoc(valeriaUser.id), { teamIds: ['team-condo-1'] });
            }
        }
        await batch.commit();
        return getOrCreateUser(firebaseUser);
    }
};

export const getUsers = async (uids: string[]): Promise<User[]> => {
    if (uids.length === 0) return [];
    const snapshot = await db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', uids).get();
    return Promise.all(snapshot.docs.map(doc => getOrCreateUser({ uid: doc.id } as FirebaseUser)));
};

export const updateUserField = (uid: string, field: keyof User, value: any): Promise<void> => {
    return getUserDoc(uid).update({ [field]: value });
};

export const resetPassword = (email: string): Promise<void> => {
    return auth.sendPasswordResetEmail(email);
};

// --- TRANSACTION MANAGEMENT (ATOMIC) ---
const addTransactionWithBalanceUpdate = async (
    collectionRef: firebase.firestore.CollectionReference,
    accountCollectionRef: firebase.firestore.CollectionReference,
    transactionData: Transaction
): Promise<void> => {
    const transactionRef = collectionRef.doc(transactionData.id);
    const batch = db.batch();

    batch.set(transactionRef, cleanDataForFirestore(transactionData));

    for (const payment of transactionData.paymentShares) {
        const accountRef = accountCollectionRef.doc(payment.accountId);
        const amount = transactionData.type === TransactionType.INCOME ? payment.amount : -payment.amount;
        batch.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amount) });
    }
    
    await batch.commit();
};

export const addPersonalTransaction = (uid: string, transactionData: Transaction): Promise<void> => {
    const userRef = getUserDoc(uid);
    return addTransactionWithBalanceUpdate(userRef.collection('transactions'), userRef.collection('accounts'), transactionData);
};

export const addTeamTransaction = (transactionData: Transaction): Promise<void> => {
    if (!transactionData.teamId) throw new Error("Team ID is required.");
    const teamRef = getTeamDoc(transactionData.teamId);
    return addTransactionWithBalanceUpdate(teamRef.collection('transactions'), teamRef.collection('accounts'), transactionData);
};

export const updateTransaction = (transaction: Transaction): Promise<void> => {
    return db.runTransaction(async (t) => {
        const isTeamTx = !!transaction.teamId;
        const ownerRef = isTeamTx ? getTeamDoc(transaction.teamId!) : getUserDoc(transaction.paymentShares[0].userId);
        
        const transactionRef = ownerRef.collection('transactions').doc(transaction.id);
        const oldTransactionDoc = await t.get(transactionRef);

        if (!oldTransactionDoc.exists) throw new Error("Transaction does not exist!");
        const oldTransaction = oldTransactionDoc.data() as Transaction;

        const getAccountRef = (accountId: string) => ownerRef.collection('accounts').doc(accountId);

        // Defensively check for paymentShares on old data
        if (oldTransaction.paymentShares && Array.isArray(oldTransaction.paymentShares)) {
            for (const payment of oldTransaction.paymentShares) {
                const accountRef = getAccountRef(payment.accountId);
                const amountToReverse = oldTransaction.type === TransactionType.INCOME ? -payment.amount : payment.amount;
                // Check if account exists before trying to update
                const accountDoc = await t.get(accountRef);
                if (accountDoc.exists) {
                    t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToReverse) });
                }
            }
        }

        for (const payment of transaction.paymentShares) {
            const accountRef = getAccountRef(payment.accountId);
            const amountToAdd = transaction.type === TransactionType.INCOME ? payment.amount : -payment.amount;
            // The new account must exist, so we update it directly.
            t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToAdd) });
        }

        t.update(transactionRef, cleanDataForFirestore(transaction));
    });
};

export const deleteTransaction = (transaction: Transaction): Promise<void> => {
    return db.runTransaction(async (t) => {
        const isTeamTx = !!transaction.teamId;
        const ownerId = isTeamTx ? transaction.teamId! : transaction.paymentShares?.[0]?.userId;
        if (!ownerId) throw new Error("Could not determine transaction owner for deletion.");
        
        const ownerRef = isTeamTx ? getTeamDoc(ownerId) : getUserDoc(ownerId);
        const transactionRef = ownerRef.collection('transactions').doc(transaction.id);
        
        const getAccountRef = (accountId: string) => ownerRef.collection('accounts').doc(accountId);

        // Defensively check for paymentShares to handle old data
        if (transaction.paymentShares && Array.isArray(transaction.paymentShares)) {
            for (const payment of transaction.paymentShares) {
                const accountRef = getAccountRef(payment.accountId);
                const amountToReverse = transaction.type === TransactionType.INCOME ? -payment.amount : payment.amount;
                // Check if the account exists before trying to update it.
                const accountDoc = await t.get(accountRef);
                if (accountDoc.exists) {
                    t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToReverse) });
                }
            }
        }

        t.delete(transactionRef);
    });
};

export const resetUserProfile = async (uid: string): Promise<void> => {
    const userRef = getUserDoc(uid);
    const subcollections = ['transactions', 'accounts', 'assets', 'liabilities', 'budgets', 'goals'];

    // Delete all documents in all subcollections
    for (const collection of subcollections) {
        const snapshot = await userRef.collection(collection).get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    
    // Re-initialize the user with default data
    const user = await auth.currentUser;
    if (!user) throw new Error("User not found for profile reset.");
    const name = user.displayName || user.email?.split('@')[0] || 'New Player';
    const avatar = user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${uid}`;
    const initialData = createNewGenericUser(uid, name, user.email!, avatar);
    
    const initBatch = db.batch();
    await createInitialDataWithSubcollections(initBatch, uid, initialData);
    await initBatch.commit();
};

export const undoImportBatch = async (uid: string, batchId: string): Promise<void> => {
    const userRef = getUserDoc(uid);
    
    // Find all items with this batchId
    const txSnapshot = await userRef.collection('transactions').where('importBatchId', '==', batchId).get();
    const accSnapshot = await userRef.collection('accounts').where('importBatchId', '==', batchId).get();
    
    // Use a transaction to ensure atomicity
    return db.runTransaction(async (t) => {
        // Process transactions
        for (const doc of txSnapshot.docs) {
            const tx = doc.data() as Transaction;
            // Revert balance changes
            if (tx.paymentShares && Array.isArray(tx.paymentShares)) {
                for (const payment of tx.paymentShares) {
                    const accountRef = userRef.collection('accounts').doc(payment.accountId);
                    const amountToReverse = tx.type === TransactionType.INCOME ? -payment.amount : payment.amount;
                    const accountDoc = await t.get(accountRef);
                    if (accountDoc.exists) {
                        t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToReverse) });
                    }
                }
            }
            t.delete(doc.ref); // Delete the transaction
        }

        // Process newly created accounts
        for (const doc of accSnapshot.docs) {
            t.delete(doc.ref); // Delete the account
        }
    });
};


// --- Other Data Management ---

export const uploadReceipt = async (base64Image: string, uid: string): Promise<string> => {
    const receiptId = crypto.randomUUID();
    const ref = storage.ref(`receipts/${uid}/${receiptId}`);
    const snapshot = await ref.putString(base64Image, 'data_url');
    return snapshot.ref.getDownloadURL();
};

export const performTransfer = (uid: string, fromAccountId: string, toAccountId: string, amount: number): Promise<void> => {
    const fromRef = getUserDoc(uid).collection('accounts').doc(fromAccountId);
    const toRef = getUserDoc(uid).collection('accounts').doc(toAccountId);
    const batch = db.batch();
    batch.update(fromRef, { balance: firebase.firestore.FieldValue.increment(-amount) });
    batch.update(toRef, { balance: firebase.firestore.FieldValue.increment(amount) });
    return batch.commit();
};

export const applyEventOutcome = async (uid: string, outcome: EventOutcome): Promise<void> => {
    if (outcome.cashChange) {
        const accounts = await getSubcollection<Account>(getUserDoc(uid), 'accounts');
        const primaryAccount = accounts.find(a => a.type === AccountType.CHECKING) || accounts[0];
        if (primaryAccount) {
            await getUserDoc(uid).collection('accounts').doc(primaryAccount.id).update({
                balance: firebase.firestore.FieldValue.increment(outcome.cashChange)
            });
        }
    }
};

export const addAccount = async (uid: string, newAccount: Omit<Account, 'id' | 'ownerIds'>, importBatchId?: string): Promise<Account> => {
    const userRef = getUserDoc(uid);
    const accountRef = userRef.collection('accounts').doc();
    const fullAccount: Account = { ...newAccount, id: accountRef.id, ownerIds: [uid], ...(importBatchId && { importBatchId }) };

    const batch = db.batch();
    batch.set(accountRef, cleanDataForFirestore(fullAccount));

    if (fullAccount.balance > 0) {
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            description: 'Initial Balance',
            amount: fullAccount.balance,
            type: TransactionType.INCOME,
            category: 'Initial Balance',
            date: new Date().toISOString().split('T')[0],
            paymentShares: [{ userId: uid, accountId: fullAccount.id, amount: fullAccount.balance }],
            ...(importBatchId && { importBatchId })
        };
        const transactionRef = getUserDoc(uid).collection('transactions').doc(transaction.id);
        batch.set(transactionRef, cleanDataForFirestore(transaction));
    }
    
    await batch.commit();
    return fullAccount;
};

export const addTeamAccount = async (teamId: string, memberIds: string[], newAccount: Omit<Account, 'id' | 'ownerIds' | 'teamId'>, importBatchId?: string): Promise<Account> => {
    const teamRef = getTeamDoc(teamId);
    const accountRef = teamRef.collection('accounts').doc();
    const fullAccount: Account = { ...newAccount, id: accountRef.id, ownerIds: memberIds, teamId, ...(importBatchId && { importBatchId }) };

    const batch = db.batch();
    batch.set(accountRef, cleanDataForFirestore(fullAccount));

    if (fullAccount.balance > 0) {
        const txId = crypto.randomUUID();
        const transactionData: Transaction = {
            id: txId,
            description: `Initial Balance for ${fullAccount.name}`,
            amount: fullAccount.balance,
            type: TransactionType.INCOME,
            category: 'Initial Balance',
            date: new Date().toISOString().split('T')[0],
            teamId,
            paymentShares: memberIds.map(id => ({ userId: id, accountId: fullAccount.id, amount: fullAccount.balance })),
            ...(importBatchId && { importBatchId })
        };
        batch.set(teamRef.collection('transactions').doc(txId), cleanDataForFirestore(transactionData));
    }
    await batch.commit();
    return fullAccount;
};

export const updateAccount = (uid: string, account: Account): Promise<void> => {
    const collectionPath = account.teamId ? `teams/${account.teamId}/accounts` : `users/${uid}/accounts`;
    return db.collection(collectionPath).doc(account.id).update(cleanDataForFirestore(account));
};

export const saveBudget = (uid: string, budget: Budget): Promise<void> => {
    return getUserDoc(uid).collection('budgets').doc(budget.month).set(cleanDataForFirestore(budget), { merge: true });
};

export const addGoal = (uid: string, newGoal: Goal, initialContribution: number, fromAccountId: string): Promise<void> => {
    const userRef = getUserDoc(uid);
    const goalRef = userRef.collection('goals').doc(newGoal.id);
    
    const batch = db.batch();
    
    if (initialContribution > 0 && fromAccountId) {
        newGoal.currentAmount += initialContribution;
        const accountRef = userRef.collection('accounts').doc(fromAccountId);
        const transactionRef = userRef.collection('transactions').doc();
        const transactionData: Omit<Transaction, 'id'> = {
            description: `Initial contribution to: ${newGoal.name}`,
            amount: initialContribution,
            type: TransactionType.EXPENSE, category: 'Goals',
            date: new Date().toISOString().split('T')[0],
            paymentShares: [{ userId: uid, accountId: fromAccountId, amount: initialContribution }],
            expenseShares: [{ userId: uid, amount: initialContribution }],
        };
        batch.update(accountRef, { balance: firebase.firestore.FieldValue.increment(-initialContribution) });
        batch.set(transactionRef, cleanDataForFirestore({ ...transactionData, id: transactionRef.id }));
    }

    batch.set(goalRef, cleanDataForFirestore(newGoal));
    return batch.commit();
};

export const updateGoal = (uid: string, goal: Goal): Promise<void> => {
    return getUserDoc(uid).collection('goals').doc(goal.id).update(cleanDataForFirestore(goal));
};

export const deleteGoal = (uid: string, goalId: string): Promise<void> => {
    return getUserDoc(uid).collection('goals').doc(goalId).delete();
};

export const contributeToGoal = (uid: string, goal: Goal, amount: number, fromAccountId: string): Promise<void> => {
    const userRef = getUserDoc(uid);
    const goalRef = userRef.collection('goals').doc(goal.id);
    const accountRef = userRef.collection('accounts').doc(fromAccountId);
    const transactionRef = userRef.collection('transactions').doc();
    
    const transactionData: Omit<Transaction, 'id'> = {
        description: `Contribution to goal: ${goal.name}`,
        amount: amount,
        type: TransactionType.EXPENSE,
        category: 'Goals',
        date: new Date().toISOString().split('T')[0],
        paymentShares: [{ userId: uid, accountId: fromAccountId, amount }],
        expenseShares: [{ userId: uid, amount }],
    };

    const batch = db.batch();
    batch.update(goalRef, { currentAmount: firebase.firestore.FieldValue.increment(amount) });
    batch.update(accountRef, { balance: firebase.firestore.FieldValue.increment(-amount) });
    batch.set(transactionRef, cleanDataForFirestore({ ...transactionData, id: transactionRef.id }));

    return batch.commit();
};

export const logDividend = async (uid: string, stock: Asset, amount: number, accountId: string): Promise<void> => {
    const isTeamStock = !!stock.teamId;
    
    const transaction: Transaction = {
        id: crypto.randomUUID(),
        description: `Dividend from ${stock.name}`,
        amount: amount,
        type: TransactionType.INCOME,
        category: 'Investment',
        date: new Date().toISOString().split('T')[0],
        isPassive: true,
        teamId: stock.teamId,
        paymentShares: [{ userId: uid, accountId, amount }],
    };

    if(isTeamStock){
       await addTeamTransaction(transaction);
    } else {
       await addPersonalTransaction(uid, transaction);
    }
};

export const checkAndUnlockAchievement = async (uid: string, achievementId: string): Promise<void> => {
    const userRef = getUserDoc(uid);
    const userDoc = await userRef.get();
    const achievements = userDoc.data()?.achievements || [];
    if (!achievements.includes(achievementId) && ALL_ACHIEVEMENTS.find(a => a.id === achievementId)) {
        await userRef.update({ achievements: firebase.firestore.FieldValue.arrayUnion(achievementId) });
    }
};

// --- Generic Asset/Liability Management ---
const addItem = (collectionPath: string, data: Asset | Liability) => {
    const ref = db.collection(collectionPath).doc(data.id);
    return ref.set(cleanDataForFirestore(data));
}
const updateItem = (collectionPath: string, id: string, data: Partial<Asset | Liability>) => db.collection(collectionPath).doc(id).update(cleanDataForFirestore(data));
const deleteItem = (collectionPath: string, id: string) => db.collection(collectionPath).doc(id).delete();

export const addAsset = (uid: string, data: Asset) => addItem(`users/${uid}/assets`, data);
export const updateAsset = (uid: string, id: string, data: Partial<Asset>) => updateItem(`users/${uid}/assets`, id, data);
export const deleteAsset = (uid: string, id: string) => deleteItem(`users/${uid}/assets`, id);
export const addLiability = (uid: string, data: Liability) => addItem(`users/${uid}/liabilities`, data);
export const updateLiability = (uid: string, id: string, data: Partial<Liability>) => updateItem(`users/${uid}/liabilities`, id, data);
export const addTeamAsset = (tid: string, data: Asset) => addItem(`teams/${tid}/assets`, data);
export const updateTeamAsset = (tid: string, id: string, data: Partial<Asset>) => updateItem(`teams/${tid}/assets`, id, data);
export const addTeamLiability = (tid: string, data: Liability) => addItem(`teams/${tid}/liabilities`, data);
export const updateTeamLiability = (tid: string, id: string, data: Partial<Liability>) => updateItem(`teams/${tid}/liabilities`, id, data);

// --- TEAMS ---
export const getTeamsForUser = async (uid: string): Promise<Team[]> => {
    const snapshot = await db.collection('teams').where('memberIds', 'array-contains', uid).get();
    return Promise.all(snapshot.docs.map(async (doc) => {
        const teamData = doc.data() as Team;
        const teamRef = doc.ref;
        const [accounts, assets, liabilities, transactions] = await Promise.all([
            getSubcollection<Account>(teamRef, 'accounts'),
            getSubcollection<Asset>(teamRef, 'assets'),
            getSubcollection<Liability>(teamRef, 'liabilities'),
            getSubcollection<Transaction>(teamRef, 'transactions'),
        ]);
        return {
            ...teamData,
            id: doc.id,
            accounts,
            financialStatement: { assets, liabilities, transactions },
        };
    }));
};

export const createTeam = async (name: string, memberIds: string[], initialGoalDesc: string, initialAccountName: string): Promise<Team> => {
    const teamRef = db.collection('teams').doc();
    const batch = db.batch();

    const newTeamData: Omit<Team, 'id' | 'accounts' | 'financialStatement' | 'goals'> & {goals: any[]} = { name, memberIds, goals: [] };
    
    
    if (initialAccountName) {
        const accId = crypto.randomUUID();
        const newAcc = { name: initialAccountName, type: AccountType.CHECKING, balance: 0, id: accId, ownerIds: memberIds, teamId: teamRef.id };
        batch.set(teamRef.collection('accounts').doc(accId), cleanDataForFirestore(newAcc));
    }
    
    if (initialGoalDesc) {
        newTeamData.goals = [{ description: initialGoalDesc, target: 10000, current: 0 }];
    }
    
    batch.set(teamRef, cleanDataForFirestore(newTeamData));
    
    await Promise.all(memberIds.map(uid => batch.update(getUserDoc(uid), { teamIds: firebase.firestore.FieldValue.arrayUnion(teamRef.id) })));
    
    await batch.commit();
    // This is a simplified return, the full team object with subcollections will be fetched on next refresh
    return { ...newTeamData, id: teamRef.id, accounts: [], financialStatement: { assets: [], liabilities: [], transactions: [] } };
};

export const addMemberToTeam = async (teamId: string, memberId: string): Promise<void> => {
    await getTeamDoc(teamId).update({ memberIds: firebase.firestore.FieldValue.arrayUnion(memberId) });
    await getUserDoc(memberId).update({ teamIds: firebase.firestore.FieldValue.arrayUnion(teamId) });
};