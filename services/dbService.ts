import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType, AccountType, AssetType } from '../types';
import { auth, db, storage, firebase, User as FirebaseUser } from './firebase';
import { initialDataForGerman, initialDataForValeria, getInitialTeamData } from './initial.data';
import { ALL_ACHIEVEMENTS } from '../components/Achievements';

// --- Helper Functions ---

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
    batch.set(userRef, mainUserData);

    for (const account of accounts) {
        batch.set(userRef.collection('accounts').doc(account.id), account);
    }
    for (const asset of financialStatement.assets) {
        batch.set(userRef.collection('assets').doc(asset.id), asset);
    }
    for (const liability of financialStatement.liabilities) {
        batch.set(userRef.collection('liabilities').doc(liability.id), liability);
    }
    for (const transaction of financialStatement.transactions) {
        const transactionRef = userRef.collection('transactions').doc();
        batch.set(transactionRef, { ...transaction, id: transactionRef.id });

        for (const payment of transaction.paymentShares) {
            const accountRef = userRef.collection('accounts').doc(payment.accountId);
            const amount = transaction.type === TransactionType.INCOME ? transaction.amount : -transaction.amount;
            const doc = await accountRef.get();
            if (doc.exists) { // Only update if account exists in batch/db
                 batch.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amount) });
            }
        }
    }
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
        };
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
            : {
                id: uid, name, email: email!, avatar, teamIds: [], onboardingCompleted: false, accounts: [{id: 'initial-checking', name: 'Checking', type: AccountType.CHECKING, balance: 1000, ownerIds: [uid]}],
                financialStatement: { transactions: [], assets: [], liabilities: [] },
                budgets: [], goals: [], achievements: []
            };

        const batch = db.batch();
        await createInitialDataWithSubcollections(batch, uid, initialData);

        if (isGerman || isValeria) {
            const germanUser = isGerman ? { id: uid } : await findUserByEmail('german@example.com');
            const valeriaUser = isValeria ? { id: uid } : await findUserByEmail('valeria@example.com');

            if (germanUser && valeriaUser) {
                const teamData = getInitialTeamData([germanUser.id, valeriaUser.id]);
                const teamRef = db.collection('teams').doc('team-condo-1');
                batch.set(teamRef, { id: 'team-condo-1', ...teamData });
                teamData.accounts.forEach(acc => batch.set(teamRef.collection('accounts').doc(acc.id), acc));
                teamData.financialStatement.assets.forEach(asset => batch.set(teamRef.collection('assets').doc(asset.id), asset));
                teamData.financialStatement.liabilities.forEach(lia => batch.set(teamRef.collection('liabilities').doc(lia.id), lia));
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
    transactionData: Omit<Transaction, 'id'>
): Promise<void> => {
    const transactionRef = collectionRef.doc();
    const batch = db.batch();

    batch.set(transactionRef, { ...transactionData, id: transactionRef.id });

    for (const payment of transactionData.paymentShares) {
        const accountRef = accountCollectionRef.doc(payment.accountId);
        const amount = transactionData.type === TransactionType.INCOME ? payment.amount : -payment.amount;
        batch.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amount) });
    }
    
    await batch.commit();
};

export const addPersonalTransaction = (uid: string, transactionData: Omit<Transaction, 'id'>): Promise<void> => {
    const userRef = getUserDoc(uid);
    return addTransactionWithBalanceUpdate(userRef.collection('transactions'), userRef.collection('accounts'), transactionData);
};

export const addTeamTransaction = (transactionData: Omit<Transaction, 'id'>): Promise<void> => {
    if (!transactionData.teamId) throw new Error("Team ID is required.");
    const teamRef = getTeamDoc(transactionData.teamId);
    return addTransactionWithBalanceUpdate(teamRef.collection('transactions'), teamRef.collection('accounts'), transactionData);
};

export const updateTransaction = (transaction: Transaction): Promise<void> => {
    return db.runTransaction(async (t) => {
        const isTeamTx = !!transaction.teamId;
        const ownerId = isTeamTx ? transaction.teamId : transaction.paymentShares[0].userId;
        const collectionPath = isTeamTx ? `teams/${ownerId}` : `users/${ownerId}`;
        
        const transactionRef = db.collection(`${collectionPath}/transactions`).doc(transaction.id);
        const oldTransactionDoc = await t.get(transactionRef);

        if (!oldTransactionDoc.exists) throw new Error("Transaction does not exist!");
        const oldTransaction = oldTransactionDoc.data() as Transaction;

        const getAccountRef = (accountId: string, userId: string) => {
             const path = isTeamTx ? `teams/${ownerId}/accounts` : `users/${userId}/accounts`;
             return db.collection(path).doc(accountId);
        }

        for (const payment of oldTransaction.paymentShares) {
            const accountRef = getAccountRef(payment.accountId, payment.userId);
            const amountToReverse = oldTransaction.type === TransactionType.INCOME ? -payment.amount : payment.amount;
            t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToReverse) });
        }

        for (const payment of transaction.paymentShares) {
            const accountRef = getAccountRef(payment.accountId, payment.userId);
            const amountToAdd = transaction.type === TransactionType.INCOME ? payment.amount : -payment.amount;
            t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToAdd) });
        }

        t.update(transactionRef, transaction);
    });
};

export const deleteTransaction = (transaction: Transaction): Promise<void> => {
    return db.runTransaction(async (t) => {
        const isTeamTx = !!transaction.teamId;
        const ownerId = isTeamTx ? transaction.teamId : transaction.paymentShares[0].userId;
        const collectionPath = isTeamTx ? `teams/${ownerId}` : `users/${ownerId}`;
        const transactionRef = db.collection(`${collectionPath}/transactions`).doc(transaction.id);
        
        const getAccountRef = (accountId: string, userId: string) => {
             const path = isTeamTx ? `teams/${ownerId}/accounts` : `users/${userId}/accounts`;
             return db.collection(path).doc(accountId);
        }

        for (const payment of transaction.paymentShares) {
            const accountRef = getAccountRef(payment.accountId, payment.userId);
            const amountToReverse = transaction.type === TransactionType.INCOME ? -payment.amount : payment.amount;
            t.update(accountRef, { balance: firebase.firestore.FieldValue.increment(amountToReverse) });
        }

        t.delete(transactionRef);
    });
};

// --- Other Data Management ---

export const uploadReceipt = async (base64Image: string, uid: string): Promise<string> => {
    const receiptId = Date.now().toString();
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

export const addAccount = (uid: string, accountData: Omit<Account, 'id' | 'ownerIds'>): Promise<any> => {
    const accountRef = getUserDoc(uid).collection('accounts').doc();
    const newAccount: Account = {
        ...accountData,
        id: accountRef.id,
        ownerIds: [uid],
    };

    // If there's an initial balance, create a transaction for it
    if (accountData.balance > 0) {
        const transaction: Omit<Transaction, 'id'> = {
            description: 'Initial Balance',
            amount: accountData.balance,
            type: TransactionType.INCOME,
            category: 'Initial Balance',
            date: new Date().toISOString().split('T')[0],
            paymentShares: [{ userId: uid, accountId: accountRef.id, amount: accountData.balance }],
        };
        const transactionRef = getUserDoc(uid).collection('transactions').doc();
        const batch = db.batch();
        batch.set(accountRef, newAccount);
        batch.set(transactionRef, {...transaction, id: transactionRef.id});
        return batch.commit();
    } else {
        return accountRef.set(newAccount);
    }
};

export const updateAccount = (uid: string, account: Account): Promise<void> => {
    return getUserDoc(uid).collection('accounts').doc(account.id).update(account);
};

export const saveBudget = (uid: string, budget: Budget): Promise<void> => {
    return getUserDoc(uid).collection('budgets').doc(budget.month).set(budget, { merge: true });
};

export const addGoal = (uid: string, goalData: Omit<Goal, 'id' | 'currentAmount'>): Promise<void> => {
    const goalRef = getUserDoc(uid).collection('goals').doc();
    const newGoal: Goal = { ...goalData, id: goalRef.id, currentAmount: 0 };
    return goalRef.set(newGoal);
};

export const updateGoal = (uid: string, goal: Goal): Promise<void> => {
    return getUserDoc(uid).collection('goals').doc(goal.id).update(goal);
};

export const deleteGoal = (uid: string, goalId: string): Promise<void> => {
    return getUserDoc(uid).collection('goals').doc(goalId).delete();
};

export const logDividend = async (uid: string, stock: Asset, amount: number, accountId: string): Promise<void> => {
    const transaction: Omit<Transaction, 'id'> = {
        description: `Dividend from ${stock.name}`,
        amount: amount,
        type: TransactionType.INCOME,
        category: 'Investment',
        date: new Date().toISOString().split('T')[0],
        isPassive: true,
        paymentShares: [{ userId: uid, accountId, amount }],
        expenseShares: [{ userId: uid, amount }],
    };
    await addPersonalTransaction(uid, transaction);
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
const addItem = (collectionPath: string, data: Partial<Asset | Liability>) => {
    const ref = db.collection(collectionPath).doc();
    return ref.set({ ...data, id: ref.id });
}
const updateItem = (collectionPath: string, id: string, data: Partial<Asset | Liability>) => db.collection(collectionPath).doc(id).update(data);
const deleteItem = (collectionPath: string, id: string) => db.collection(collectionPath).doc(id).delete();

export const addAsset = (uid: string, data: Partial<Asset>) => addItem(`users/${uid}/assets`, data);
export const updateAsset = (uid: string, id: string, data: Partial<Asset>) => updateItem(`users/${uid}/assets`, id, data);
export const deleteAsset = (uid: string, id: string) => deleteItem(`users/${uid}/assets`, id);
export const addLiability = (uid: string, data: Partial<Liability>) => addItem(`users/${uid}/liabilities`, data);
export const updateLiability = (uid: string, id: string, data: Partial<Liability>) => updateItem(`users/${uid}/liabilities`, id, data);
export const addTeamAsset = (tid: string, data: Partial<Asset>) => addItem(`teams/${tid}/assets`, data);
export const updateTeamAsset = (tid: string, id: string, data: Partial<Asset>) => updateItem(`teams/${tid}/assets`, id, data);
export const addTeamLiability = (tid: string, data: Partial<Liability>) => addItem(`teams/${tid}/liabilities`, data);
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

export const createTeam = async (name: string, memberIds: string[]): Promise<Team> => {
    const teamRef = db.collection('teams').doc();
    const newTeamData: Omit<Team, 'id'> = {
        name,
        memberIds,
        financialStatement: { transactions: [], assets: [], liabilities: [] },
        accounts: [],
        goals: [{ description: 'Initial Team Goal', target: 10000, current: 0 }],
    };
    await teamRef.set(newTeamData);
    await Promise.all(memberIds.map(uid => getUserDoc(uid).update({ teamIds: firebase.firestore.FieldValue.arrayUnion(teamRef.id) })));
    return { ...newTeamData, id: teamRef.id };
};

export const addMemberToTeam = async (teamId: string, memberId: string): Promise<void> => {
    await getTeamDoc(teamId).update({ memberIds: firebase.firestore.FieldValue.arrayUnion(memberId) });
    await getUserDoc(memberId).update({ teamIds: firebase.firestore.FieldValue.arrayUnion(teamId) });
};
