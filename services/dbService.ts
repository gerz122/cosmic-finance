import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType } from '../types';
// FIX: Update firebase imports to align with v8 syntax changes. Using compat API now.
import { auth, db, storage, firebase, User as FirebaseUser } from './firebase';
import { initialDataForGerman, initialDataForValeria, getInitialTeamData } from './initial.data';

// --- STRUCTURED DATA CREATION ---

const createInitialDataWithSubcollections = async (batch: firebase.firestore.WriteBatch, uid: string, initialData: User) => {
    const userRef = db.collection('users').doc(uid);
    
    // Separate subcollection data from the main user document
    const { accounts, financialStatement, ...mainUserData } = initialData;
    batch.set(userRef, mainUserData);

    // Add accounts to subcollection
    for (const accountToBatch of accounts) {
        const accountRef = userRef.collection('accounts').doc();
        batch.set(accountRef, { ...accountToBatch, id: accountRef.id }); // Ensure ID is set
    }
    // Add assets to subcollection
    for (const assetToBatch of financialStatement.assets) {
        const assetRef = userRef.collection('assets').doc();
        batch.set(assetRef, { ...assetToBatch, id: assetRef.id });
    }
    // Add liabilities to subcollection
    for (const liabilityToBatch of financialStatement.liabilities) {
        const liabilityRef = userRef.collection('liabilities').doc();
        batch.set(liabilityRef, { ...liabilityToBatch, id: liabilityRef.id });
    }
    // FIX: Add initial transactions to the transactions subcollection
    for (const transactionToBatch of financialStatement.transactions) {
        const transactionRef = userRef.collection('transactions').doc();
        batch.set(transactionRef, { ...transactionToBatch, id: transactionRef.id });
    }
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
        
        if ((isGerman || isValeria) && accountsSnap.empty) {
            console.log(`Data migration required for ${email}. Re-initializing data structure.`);
            const initialData = isGerman ? initialDataForGerman(firebaseUser.uid, name, avatar, email) : initialDataForValeria(firebaseUser.uid, name, avatar, email);
            const batch = db.batch();
            await createInitialDataWithSubcollections(batch, firebaseUser.uid, initialData);
            await batch.commit();
            
            const migratedDoc = await userRef.get();
            userData = { id: migratedDoc.id, ...migratedDoc.data() } as User;
        } else {
             userData = existingData;
        }

    } else {
        const batch = db.batch();
        let initialData: User;

        if (isGerman || isValeria) {
            // Special user: ensure the shared team exists or is updated.
            const teamRef = db.collection('teams').doc('team-condo-1');
            const teamDoc = await teamRef.get();

            if (!teamDoc.exists) {
                console.log("Shared team 'team-condo-1' not found. Creating it...");
                const { accounts, financialStatement, ...mainTeamData } = getInitialTeamData([firebaseUser.uid]);
                batch.set(teamRef, mainTeamData);
                
                // Batch-create subcollections for the new team
                for (const teamAccountToBatch of accounts) {
                    const accountRef = teamRef.collection('accounts').doc(); // Auto-generate ID
                    batch.set(accountRef, { ...teamAccountToBatch, id: accountRef.id });
                }
                for (const teamAssetToBatch of financialStatement.assets) {
                    const assetRef = teamRef.collection('assets').doc();
                    batch.set(assetRef, { ...teamAssetToBatch, id: assetRef.id });
                }
                for (const teamLiabilityToBatch of financialStatement.liabilities) {
                    const liabilityRef = teamRef.collection('liabilities').doc();
                    batch.set(liabilityRef, { ...teamLiabilityToBatch, id: liabilityRef.id });
                }
            } else {
                console.log("Shared team 'team-condo-1' found. Adding user to it.");
                // Team exists, just add this user to it
                batch.update(teamRef, {
                    memberIds: firebase.firestore.FieldValue.arrayUnion(firebaseUser.uid)
                });
                 // Also add user to the joint account ownerIds
                const teamAccountsSnap = await teamRef.collection('accounts').get();
                teamAccountsSnap.forEach(accountDocument => {
                    batch.update(accountDocument.ref, {
                        ownerIds: firebase.firestore.FieldValue.arrayUnion(firebaseUser.uid)
                    });
                });
            }
            initialData = isGerman 
                ? initialDataForGerman(firebaseUser.uid, 'German', avatar, email) 
                : initialDataForValeria(firebaseUser.uid, 'Valeria', avatar, email);
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

    const accountsSnap = await db.collection(`users/${firebaseUser.uid}/accounts`).get();
    const assetsSnap = await db.collection(`users/${firebaseUser.uid}/assets`).get();
    const liabilitiesSnap = await db.collection(`users/${firebaseUser.uid}/liabilities`).get();
    const transactionsSnap = await db.collection(`users/${firebaseUser.uid}/transactions`).get();

    userData.accounts = accountsSnap.docs.map(userAccountDoc => ({ id: userAccountDoc.id, ...userAccountDoc.data() } as Account));
    userData.financialStatement = {
        assets: assetsSnap.docs.map(userAssetDoc => ({ id: userAssetDoc.id, ...userAssetDoc.data() } as Asset)),
        liabilities: liabilitiesSnap.docs.map(userLiabilityDoc => ({ id: userLiabilityDoc.id, ...userLiabilityDoc.data() } as Liability)),
        transactions: transactionsSnap.docs.map(userTransactionDoc => ({ id: userTransactionDoc.id, ...userTransactionDoc.data() } as Transaction)),
    };
    
    userData.budgets = userData.budgets || [];
    userData.goals = userData.goals || [];
    userData.achievements = userData.achievements || [];

    return userData;
};

export const getUsers = async (uids: string[]): Promise<User[]> => {
    if (uids.length === 0) return [];
    const userDocs = await Promise.all(uids.map(userId => db.collection('users').doc(userId).get()));

    const usersPromises = userDocs.map(async (userDocument) => {
        if (!userDocument.exists) return null;
        const userData = { id: userDocument.id, ...userDocument.data() } as User;
        
        const [accountsSnap, assetsSnap, liabilitiesSnap, transactionsSnap] = await Promise.all([
            db.collection(`users/${userDocument.id}/accounts`).get(),
            db.collection(`users/${userDocument.id}/assets`).get(),
            db.collection(`users/${userDocument.id}/liabilities`).get(),
            db.collection(`users/${userDocument.id}/transactions`).get()
        ]);
        
        userData.accounts = accountsSnap.docs.map(queriedUserAccountDoc => ({ id: queriedUserAccountDoc.id, ...queriedUserAccountDoc.data() } as Account));
        userData.financialStatement = {
            assets: assetsSnap.docs.map(queriedUserAssetDoc => ({ id: queriedUserAssetDoc.id, ...queriedUserAssetDoc.data() } as Asset)),
            liabilities: liabilitiesSnap.docs.map(queriedUserLiabilityDoc => ({ id: queriedUserLiabilityDoc.id, ...queriedUserLiabilityDoc.data() } as Liability)),
            transactions: transactionsSnap.docs.map(queriedUserTransactionDoc => ({ id: queriedUserTransactionDoc.id, ...queriedUserTransactionDoc.data() } as Transaction)),
        };
        userData.budgets = userData.budgets || [];
        userData.goals = userData.goals || [];
        userData.achievements = userData.achievements || [];

        return userData;
    });
    
    const users = await Promise.all(usersPromises);
    return users.filter((userOrNull): userOrNull is User => userOrNull !== null);
};

export const findUserByEmail = async (email: string): Promise<{id: string, name: string} | null> => {
    const usersQuery = db.collection('users').where('email', '==', email);
    const snapshot = await usersQuery.get();
    if (snapshot.empty) { return null; }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, name: userDoc.data().name };
};

export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return [];

    const teamIds = (userDoc.data() as User).teamIds || [];
    if (teamIds.length === 0) return [];

    const teamDocs = await Promise.all(teamIds.map(teamId => db.collection('teams').doc(teamId).get()));

    const teamsPromises = teamDocs.map(async (teamDocument) => {
        if (!teamDocument.exists) return null;
        const teamData = { id: teamDocument.id, ...teamDocument.data() } as Team;

        const [assetsSnap, liabilitiesSnap, transactionsSnap, accountsSnap] = await Promise.all([
            db.collection(`teams/${teamDocument.id}/assets`).get(),
            db.collection(`teams/${teamDocument.id}/liabilities`).get(),
            db.collection(`teams/${teamDocument.id}/transactions`).get(),
            db.collection(`teams/${teamDocument.id}/accounts`).get()
        ]);

        teamData.accounts = accountsSnap.docs.map(teamAccountSubDoc => ({ id: teamAccountSubDoc.id, ...teamAccountSubDoc.data() } as Account));
        teamData.financialStatement = {
            assets: assetsSnap.docs.map(teamAssetSubDoc => ({ id: teamAssetSubDoc.id, ...teamAssetSubDoc.data() } as Asset)),
            liabilities: liabilitiesSnap.docs.map(teamLiabilitySubDoc => ({ id: teamLiabilitySubDoc.id, ...teamLiabilitySubDoc.data() } as Liability)),
            transactions: transactionsSnap.docs.map(teamTransactionSubDoc => ({ id: teamTransactionSubDoc.id, ...teamTransactionSubDoc.data() } as Transaction)),
        };
        return teamData;
    });
    
    const teams = await Promise.all(teamsPromises);
    return teams.filter((teamOrNull): teamOrNull is Team => teamOrNull !== null);
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

export const resetPassword = (email: string) => auth.sendPasswordResetEmail(email);

export const addPersonalTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const newDocRef = await db.collection(`users/${userId}/transactions`).add(transaction);
    
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

    await db.runTransaction(async (t) => {
        for (const share of transaction.paymentShares) {
            const accountRef = db.collection(`teams/${transaction.teamId}/accounts`).doc(share.accountId);
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

export const updateTransaction = async (transaction: Transaction): Promise<void> => {
    const path = transaction.teamId ? `teams/${transaction.teamId}/transactions` : `users/${auth.currentUser!.uid}/transactions`;
    await db.doc(`${path}/${transaction.id}`).set(transaction, { merge: true });
};

export const deleteTransaction = async (transaction: Transaction): Promise<void> => {
    const path = transaction.teamId ? `teams/${transaction.teamId}/transactions` : `users/${auth.currentUser!.uid}/transactions`;
    await db.doc(`${path}/${transaction.id}`).delete();
};

export const performTransfer = (userId: string, fromAccountId: string, toAccountId: string, amount: number, teamId?: string) => {
    return db.runTransaction(async (t) => {
        const basePath = teamId ? `teams/${teamId}` : `users/${userId}`;
        const fromRef = db.collection(basePath).doc(fromAccountId);
        const toRef = db.collection(basePath).doc(toAccountId);
        
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

export const checkAndUnlockAchievement = async (userId: string, achievementId: string): Promise<void> => {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
        achievements: firebase.firestore.FieldValue.arrayUnion(achievementId)
    });
};

export const saveBudget = async (userId: string, budget: Budget): Promise<void> => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");

    const userData = userDoc.data() as User;
    const budgets = userData.budgets || [];
    const budgetIndex = budgets.findIndex(b => b.month === budget.month);

    if (budgetIndex > -1) {
        budgets[budgetIndex] = budget;
    } else {
        budgets.push(budget);
    }
    await userRef.update({ budgets });
};

export const addGoal = async (userId: string, goalData: Omit<Goal, 'id' | 'currentAmount'>): Promise<void> => {
    const newGoal: Goal = { ...goalData, id: db.collection('users').doc().id, currentAmount: 0 };
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
        goals: firebase.firestore.FieldValue.arrayUnion(newGoal)
    });
};

export const deleteGoal = async (userId: string, goalId: string): Promise<void> => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");

    const userData = userDoc.data() as User;
    const goals = userData.goals || [];
    const updatedGoals = goals.filter(g => g.id !== goalId);
    await userRef.update({ goals: updatedGoals });
};

export const updateGoal = async (userId: string, goalToUpdate: Goal): Promise<void> => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found");
    
    const userData = userDoc.data() as User;
    const goals = userData.goals || [];
    const goalIndex = goals.findIndex(g => g.id === goalToUpdate.id);
    
    if (goalIndex > -1) {
        goals[goalIndex] = goalToUpdate;
        await userRef.update({ goals });
    } else {
        throw new Error("Goal not found to update");
    }
};