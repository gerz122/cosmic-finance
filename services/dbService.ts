import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType } from '../types';
import { db, storage } from './firebase';
import { collection, getDocs, getDoc, doc, where, query, writeBatch, setDoc, deleteDoc, runTransaction, documentId, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";

// This data is ONLY used to populate a fresh database for a NEW user.
const initialUserData = {
    accounts: [
        { name: 'My Checking Account', type: 'Checking', balance: 1000 },
        { name: 'My Savings Account', type: 'Savings', balance: 5000 },
        { name: 'My Credit Card', type: 'Credit Card', balance: 500 },
    ],
    financialStatement: {
        transactions: [], assets: [], liabilities: []
    },
    budgets: [],
    goals: [],
    achievements: []
};


// --- AUTHENTICATION & USER DATA ---

export const createNewUser = async (uid: string, name: string, email: string): Promise<User> => {
    const newUserRef = doc(db, 'users', uid);
    const avatar = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${name}`;
    
    const newUser: Omit<User, 'accounts' | 'financialStatement' | 'budgets' | 'goals'> = {
        id: uid,
        name,
        avatar,
        teamIds: [],
        achievements: [],
    };
    
    await setDoc(newUserRef, newUser);

    const batch = writeBatch(db);
    initialUserData.accounts.forEach(acc => {
        const accountRef = doc(collection(db, `users/${uid}/accounts`));
        batch.set(accountRef, { ...acc, ownerIds: [uid] });
    });
    await batch.commit();
    
    return getUserData(uid);
};

export const getUserData = async (uid: string): Promise<User> => {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        throw new Error("User data not found in Firestore.");
    }

    const userData = { id: userDoc.id, ...userDoc.data() } as User;

    // Fetch subcollections
    const accountsSnap = await getDocs(collection(db, `users/${uid}/accounts`));
    userData.accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    
    // In a full implementation, you'd also fetch financialStatement items, budgets, and goals
    // For now, we initialize them as empty.
    userData.financialStatement = { transactions: [], assets: [], liabilities: [] };
    userData.budgets = [];
    userData.goals = [];

    return userData;
};


export const getUsers = async (uids: string[]): Promise<User[]> => {
    if (uids.length === 0) return [];
    const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', uids));
    const userSnapshot = await getDocs(usersQuery);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
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


// --- TRANSACTIONS ---

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>, users: User[]): Promise<User[]> => {
    console.warn("addTransaction (personal) only updates account balances. Persist personal transactions if needed.");
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };

    for (const share of newTx.paymentShares) {
        const accountRef = doc(db, `users/${share.userId}/accounts`, share.accountId);
        await runTransaction(db, async (t) => {
            const accountDoc = await t.get(accountRef);
            if (accountDoc.exists()) {
                const currentBalance = accountDoc.data().balance;
                const newBalance = currentBalance + (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
                t.update(accountRef, { balance: newBalance });
            }
        });
    }
    // This is a mock update and should be improved
    return JSON.parse(JSON.stringify(users));
};

export const addTeamTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    if (!transaction.teamId) throw new Error("Team ID is required for a team transaction");
    
    const collectionRef = collection(db, `teams/${transaction.teamId}/transactions`);
    const newDocRef = await addDoc(collectionRef, transaction);
    const newTx: Transaction = { ...transaction, id: newDocRef.id };

    // Update account balances
    for (const share of newTx.paymentShares) {
        // Assuming team accounts are stored under a 'teams' collection at the root
        // This logic might need adjustment based on final data structure
        const ownerId = (await getDoc(doc(db, 'teams', transaction.teamId))).data()?.memberIds[0]; // Simplified assumption
        const accountRef = doc(db, `users/${ownerId}/accounts`, share.accountId); // This needs fixing if teams have own accounts
        
        await runTransaction(db, async (t) => {
            const accountDoc = await t.get(accountRef);
            if (accountDoc.exists()) {
                const currentBalance = accountDoc.data().balance;
                const newBalance = currentBalance + (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
                t.update(accountRef, { balance: newBalance });
            }
        });
    }
    
    return newTx;
};


export const updateTransaction = async (transaction: Transaction): Promise<void> => {
    if (transaction.teamId) {
        const txRef = doc(db, `teams/${transaction.teamId}/transactions`, transaction.id);
        await setDoc(txRef, transaction, { merge: true });
    } else {
        // Personal transaction logic needed
        console.error("Updating personal transactions not fully implemented for Firestore.");
    }
};


export const deleteTransaction = async (transaction: Transaction): Promise<void> => {
    if (transaction.teamId) {
        // Reverse balance changes
        for (const share of transaction.paymentShares) {
            // This needs similar logic as addTeamTransaction to find the correct owner/account
             console.warn("Account balance reversal for team transaction deletion is complex and not fully implemented.");
        }
        await deleteDoc(doc(db, `teams/${transaction.teamId}/transactions`, transaction.id));
    } else {
        console.error("Cannot delete personal transaction or transaction not found.");
    }
};


// --- FILE UPLOADS ---

export const uploadReceipt = async (base64Image: string, userId: string): Promise<string> => {
    const mimeType = base64Image.match(/data:(.*);/)?.[1] || 'image/jpeg';
    const imageData = base64Image.split(',')[1];
    
    const filePath = `receipts/${userId}/${Date.now()}`;
    const storageRef = ref(storage, filePath);

    await uploadString(storageRef, imageData, 'base64', { contentType: mimeType });
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

// --- MOCK/TODO FUNCTIONS ---
// These are placeholders that need full Firestore implementation
export { checkAndUnlockAchievement, saveBudget, addGoal, deleteGoal, updateGoal, addTeamAsset, addTeamLiability, updateTeamAsset, updateTeamLiability, createTeam, logDividend, updateAccount, addAccount, deleteAsset, updateLiability, updateAsset, addLiability, applyEventOutcome, performTransfer } from './dbService.mock';