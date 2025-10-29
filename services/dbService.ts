import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType } from '../types';
// FIX: Update firebase imports to align with v8 syntax changes. Using compat API now.
import { auth, db, storage, firebase, User as FirebaseUser } from './firebase';
import { initialDataForGerman, initialDataForValeria } from './initial.data';

// --- STRUCTURED DATA CREATION ---

const createInitialDataWithSubcollections = async (batch: firebase.firestore.WriteBatch, uid: string, initialData: User) => {
    const userRef = db.collection('users').doc(uid);
    
    // Separate subcollection data from the main user document
    const { accounts, financialStatement, ...mainUserData } = initialData;
    batch.set(userRef, mainUserData);

    // Add accounts to subcollection
    for (const account of accounts) {
        const accountRef = db.collection(`users/${uid}/accounts`).doc();
        batch.set(accountRef, { ...account, id: accountRef.id }); // Ensure ID is set
    }
    // Add assets to subcollection
    for (const asset of financialStatement.assets) {
        const assetRef = db.collection(`users/${uid}/assets`).doc();
        batch.set(assetRef, { ...asset, id: assetRef.id });
    }
    // Add liabilities to subcollection
    for (const liability of financialStatement.liabilities) {
        const liabilityRef = db.collection(`users/${uid}/liabilities`).doc();
        batch.set(liabilityRef, { ...liability, id: liabilityRef.id });
    }
    // Transactions can be added here if there are any initial ones
};

// --- AUTH & USER DATA ---

export const getOrCreateUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userRef = db.collection('users').doc(firebaseUser.uid);
    const userDoc = await userRef.get();

    const email = firebaseUser.email!;
    const name = firebaseUser.displayName || 'New Player';
    const avatar = firebaseUser.photoURL || `https://api.dicebear.com/8.x/pixel-art/svg?seed=${name}`;

    const isGerman = email === 'gerzbogado@gmail.com';
    const isValeria = email === 'valeriasisterna01@gmail.com';

    let userData: User;

    if (userDoc.exists) {
        const existingData = { id: userDoc.id, ...userDoc.data() } as User;
        const accountsSnap = await db.collection(`users/${firebaseUser.uid}/accounts`).get();
        
        // This is the migration trigger: a special user has a document but no accounts subcollection.
        if ((isGerman || isValeria) && accountsSnap.empty) {
            console.log(`Data migration required for ${email}. Re-initializing data structure.`);
            const initialData = isGerman ? initialDataForGerman(firebaseUser.uid, name, avatar, email) : initialDataForValeria(firebaseUser.uid, name, avatar, email);
            const batch = db.batch();
            await createInitialDataWithSubcollections(batch, firebaseUser.uid, initialData);
            await batch.commit();
            
            // Re-fetch the user data after migration
            const migratedDoc = await userRef.get();
            userData = { id: migratedDoc.id, ...migratedDoc.data() } as User;
        } else {
             userData = existingData;
        }

    } else {
        // User does not exist, create new document and subcollections
        const batch = db.batch();
        let initialData: User;
        if (isGerman) {
            initialData = initialDataForGerman(firebaseUser.uid, name, avatar, email);
        } else if (isValeria) {
            initialData = initialDataForValeria(firebaseUser.uid, name, avatar, email);
        } else {
            // Standard new user
            initialData = {
                id: firebaseUser.uid, name, email, avatar, teamIds: [], achievements: [], onboardingCompleted: false,
                accounts: [], financialStatement: { transactions: [], assets: [], liabilities: [] }, budgets: [], goals: [],
            };
        }
        await createInitialDataWithSubcollections(batch, firebaseUser.uid, initialData);
        await batch.commit();

        const newUserDoc = await userRef.get();
        userData = { id: newUserDoc.id, ...newUserDoc.data() } as User;
    }

    // Now, load all data from subcollections for the final user object
    const accountsSnap = await db.collection(`users/${firebaseUser.uid}/accounts`).get();
    const assetsSnap = await db.collection(`users/${firebaseUser.uid}/assets`).get();
    const liabilitiesSnap = await db.collection(`users/${firebaseUser.uid}/liabilities`).get();
    const transactionsSnap = await db.collection(`users/${firebaseUser.uid}/transactions`).get();

    userData.accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    userData.financialStatement = {
        assets: assetsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)),
        liabilities: liabilitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Liability)),
        transactions: transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)),
    };
    
    // Ensure other top-level fields are initialized
    userData.budgets = userData.budgets || [];
    userData.goals = userData.goals || [];
    userData.achievements = userData.achievements || [];

    return userData;
};

export const getUsers = async (uids: string[]): Promise<User[]> => {
    if (uids.length === 0) return [];
    const usersQuery = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', uids);
    const userSnapshot = await usersQuery.get();
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
};

export const findUserByEmail = async (email: string): Promise<{id: string, name: string} | null> => {
    const usersQuery = db.collection('users').where('email', '==', email);
    const snapshot = await usersQuery.get();
    if (snapshot.empty) { return null; }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, name: userDoc.data().name };
};

export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
    // Implementation is now more complex as we need to fetch subcollections for each team
    return []; // Simplified for now, AppContext will handle this
};

// --- DATA MODIFICATION ---

export const updateUserField = async (userId: string, field: string, value: any): Promise<void> => {
    await db.collection('users').doc(userId).update({ [field]: value });
};

export const uploadReceipt = async (base64Image: string, userId: string): Promise<string> => {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/jpeg';
    const filePath = `receipts/${userId}/${Date.now()}`;
    const storageRef = storage.ref(filePath);
    await storageRef.putString(base64Image, 'data_url', { contentType: mimeType });
    return storageRef.getDownloadURL();
};

// --- FULLY IMPLEMENTED FIRESTORE FUNCTIONS ---

// FIX: Changed to use v8 syntax (auth instance method)
export const resetPassword = (email: string) => auth.sendPasswordResetEmail(email);

export const addPersonalTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const newDocRef = await db.collection(`users/${userId}/transactions`).add(transaction);
    
    // Update account balances within a Firestore transaction for atomicity
    await db.runTransaction(async (t) => {
        for (const share of transaction.paymentShares) {
            const accountRef = db.collection(`users/${share.userId}/accounts`).doc(share.accountId);
            const accountDoc = await t.get(accountRef);
            if (accountDoc.exists) {
                const data = accountDoc.data();
                if (data) {
                    const currentBalance = data.balance;
                    const newBalance = currentBalance + (transaction.type === TransactionType.INCOME ? share.amount : -share.amount);
                    t.update(accountRef, { balance: newBalance });
                }
            }
        }
    });
    return { ...transaction, id: newDocRef.id };
};

export const addTeamTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    if (!transaction.teamId) throw new Error("Team ID required");
    const newDocRef = await db.collection(`teams/${transaction.teamId}/transactions`).add(transaction);
    return { ...transaction, id: newDocRef.id };
};

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
    const path = transaction.teamId ? `teams/${transaction.teamId}/transactions` : `users/${auth.currentUser!.uid}/transactions`;
    await db.doc(`${path}/${transaction.id}`).set(transaction, { merge: true });
};

export const deleteTransaction = async (transaction: Transaction): Promise<void> => {
    const path = transaction.teamId ? `teams/${transaction.teamId}/transactions` : `users/${auth.currentUser!.uid}/transactions`;
    await db.doc(`${path}/${transaction.id}`).delete();
};

export const performTransfer = (userId: string, fromAccountId: string, toAccountId: string, amount: number) => {
    return db.runTransaction(async (t) => {
        const fromRef = db.collection(`users/${userId}/accounts`).doc(fromAccountId);
        const toRef = db.collection(`users/${userId}/accounts`).doc(toAccountId);
        const fromDoc = await t.get(fromRef);
        const toDoc = await t.get(toRef);
        if (!fromDoc.exists || !toDoc.exists) throw new Error("Account not found");
        
        const fromData = fromDoc.data();
        const toData = toDoc.data();

        if (fromData && toData) {
            const fromBalance = fromData.balance;
            if (fromBalance < amount) throw new Error("Insufficient funds");
            t.update(fromRef, { balance: fromBalance - amount });
            t.update(toRef, { balance: toData.balance + amount });
        }
    });
};

export const addAccount = async (userId: string, accountData: Omit<Account, 'id'|'ownerIds'>): Promise<Account> => {
    const newAccountData = { ...accountData, ownerIds: [userId] };
    const newDocRef = await db.collection(`users/${userId}/accounts`).add(newAccountData);
    return { ...newAccountData, id: newDocRef.id };
};

export const updateAccount = (userId: string, account: Account) => db.collection(`users/${userId}/accounts`).doc(account.id).update(account);
export const addAsset = (userId: string, data: Partial<Asset>) => db.collection(`users/${userId}/assets`).add(data);
export const addLiability = (userId: string, data: Partial<Liability>) => db.collection(`users/${userId}/liabilities`).add(data);
export const updateAsset = (userId: string, id: string, data: Partial<Asset>) => db.collection(`users/${userId}/assets`).doc(id).update(data);
export const updateLiability = (userId: string, id: string, data: Partial<Liability>) => db.collection(`users/${userId}/liabilities`).doc(id).update(data);
export const deleteAsset = (userId: string, id: string) => db.collection(`users/${userId}/assets`).doc(id).delete();

export const addTeamAsset = (teamId: string, data: Partial<Asset>) => db.collection(`teams/${teamId}/assets`).add(data);
export const addTeamLiability = (teamId: string, data: Partial<Liability>) => db.collection(`teams/${teamId}/liabilities`).add(data);
export const updateTeamAsset = (teamId: string, id: string, data: Partial<Asset>) => db.collection(`teams/${teamId}/assets`).doc(id).update(data);
export const updateTeamLiability = (teamId: string, id: string, data: Partial<Liability>) => db.collection(`teams/${teamId}/liabilities`).doc(id).update(data);

export const createTeam = async (name: string, memberIds: string[]): Promise<Team> => {
    const newTeamData = { name, memberIds, goals: [], accounts: [] }; // Financial statement is in subcollections
    const newDocRef = await db.collection('teams').add(newTeamData);
    return { ...newTeamData, id: newDocRef.id, financialStatement: { transactions: [], assets: [], liabilities: [] } };
};

export const addMemberToTeam = async (teamId: string, userId: string) => {
    await db.collection('teams').doc(teamId).update({ memberIds: firebase.firestore.FieldValue.arrayUnion(userId) });
    await db.collection('users').doc(userId).update({ teamIds: firebase.firestore.FieldValue.arrayUnion(teamId) });
};

export const logDividend = async (userId: string, stock: Asset, amount: number, accountId: string) => {
    const transactionData: Omit<Transaction, 'id'> = {
        description: `Dividend from ${stock.ticker || stock.name}`,
        amount,
        type: TransactionType.INCOME,
        category: 'Investment',
        date: new Date().toISOString().split('T')[0],
        isPassive: true,
        paymentShares: [{ userId, accountId, amount }],
    };
    await addPersonalTransaction(userId, transactionData);
};

export const applyEventOutcome = async (userId: string, outcome: EventOutcome) => {
     if (outcome.cashChange) {
        // Find a cash account and create a transaction
     }
     if (outcome.newAsset) {
        await addAsset(userId, outcome.newAsset);
     }
};


// --- MOCK/TODO FUNCTIONS ---
export { checkAndUnlockAchievement, saveBudget, addGoal, deleteGoal, updateGoal } from './dbService.mock';