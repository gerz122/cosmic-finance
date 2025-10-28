import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType } from '../types';
import { auth, db, storage, firebaseAuth } from './firebase';
import { collection, getDocs, getDoc, doc, where, query, writeBatch, setDoc, deleteDoc, runTransaction, documentId, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { initialDataForGerman, initialDataForValeria } from './initial.data';


// --- AUTHENTICATION & USER DATA ---

export const createNewUser = async (uid: string, name: string, email: string): Promise<User> => {
    const newUserRef = doc(db, 'users', uid);
    const avatar = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${name}`;
    
    // Special migration for German and Valeria
    if (email === 'gerzbogado@gmail.com') {
        await setDoc(newUserRef, initialDataForGerman(uid, name, avatar, email));
        console.log("Migrated data for German.");
        return (await getUserData(uid))!;
    }
    if (email === 'valeriasisterna01@gmail.com') {
        await setDoc(newUserRef, initialDataForValeria(uid, name, avatar, email));
        console.log("Migrated data for Valeria.");
        return (await getUserData(uid))!;
    }
    
    // Standard new user setup
    const newUser: Omit<User, 'financialStatement' | 'accounts' | 'budgets' | 'goals'> = {
        id: uid,
        name,
        email,
        avatar,
        teamIds: [],
        achievements: [],
        onboardingCompleted: false,
    };
    await setDoc(newUserRef, newUser);
    // You can add default accounts or other initial data here if needed
    return (await getUserData(uid))!;
};

export const resetPassword = async (email: string) => {
    // FIX: Use sendPasswordResetEmail from the exported firebaseAuth namespace.
    await firebaseAuth.sendPasswordResetEmail(auth, email);
};


export const getUserData = async (uid: string): Promise<User | null> => {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        console.warn(`User data not found in Firestore for UID: ${uid}. This might be a new user.`);
        return null;
    }

    const userData = { id: userDoc.id, ...userDoc.data() } as User;

    // Fetch subcollections if they exist, otherwise initialize
    const accountsSnap = await getDocs(collection(db, `users/${uid}/accounts`));
    userData.accounts = accountsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    
    // In a full implementation, you'd also fetch financialStatement items, budgets, and goals
    userData.financialStatement = { transactions: [], assets: [], liabilities: [] }; // Keep this lightweight for now
    userData.budgets = userData.budgets || [];
    userData.goals = userData.goals || [];

    return userData;
};


export const getUsers = async (uids: string[]): Promise<User[]> => {
    if (uids.length === 0) return [];
    const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', uids));
    const userSnapshot = await getDocs(usersQuery);
    return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
};

export const findUserByEmail = async (email: string): Promise<{id: string, name: string} | null> => {
    const usersQuery = query(collection(db, 'users'), where('email', '==', email));
    const snapshot = await getDocs(usersQuery);
    if (snapshot.empty) {
        return null;
    }
    const userDoc = snapshot.docs[0];
    return { id: userDoc.id, name: userDoc.data().name };
};

export const addMemberToTeam = async (teamId: string, userId: string) => {
    const teamRef = doc(db, 'teams', teamId);
    const userRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
        const teamDoc = await transaction.get(teamRef);
        const userDoc = await transaction.get(userRef);
        if (!teamDoc.exists() || !userDoc.exists()) {
            throw "Team or User not found!";
        }

        const teamData = teamDoc.data() as Team;
        const userData = userDoc.data() as User;
        
        const newMemberIds = [...new Set([...teamData.memberIds, userId])];
        const newTeamIds = [...new Set([...userData.teamIds, teamId])];

        transaction.update(teamRef, { memberIds: newMemberIds });
        transaction.update(userRef, { teamIds: newTeamIds });
    });
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

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<void> => {
     console.warn("addTransaction (personal) only updates account balances. Persist personal transactions if needed.");
     // This logic would need to be built out to save personal transactions to a subcollection in the user document.
     // For now, we just update balances.
    for (const share of transaction.paymentShares) {
        const accountRef = doc(db, `users/${share.userId}/accounts`, share.accountId);
        await runTransaction(db, async (t) => {
            const accountDoc = await t.get(accountRef);
            if (accountDoc.exists()) {
                const currentBalance = accountDoc.data().balance;
                const newBalance = currentBalance + (transaction.type === TransactionType.INCOME ? share.amount : -share.amount);
                t.update(accountRef, { balance: newBalance });
            }
        });
    }
};

export const addTeamTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    if (!transaction.teamId) throw new Error("Team ID is required for a team transaction");
    
    const collectionRef = collection(db, `teams/${transaction.teamId}/transactions`);
    const newDocRef = await addDoc(collectionRef, transaction);
    
    // Balance updates are tricky for team accounts. This needs a robust implementation.
    // For now, team account balances are not updated automatically by transactions.
    
    return { ...transaction, id: newDocRef.id };
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
        await deleteDoc(doc(db, `teams/${transaction.teamId}/transactions`, transaction.id));
    } else {
        console.error("Cannot delete personal transaction or transaction not found.");
    }
};

export const updateUserField = async (userId: string, field: string, value: any): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { [field]: value });
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
// FIX: Added addAsset to the export list.
export { checkAndUnlockAchievement, saveBudget, addGoal, deleteGoal, updateGoal, addTeamAsset, addTeamLiability, updateTeamAsset, updateTeamLiability, createTeam, logDividend, updateAccount, addAccount, deleteAsset, updateLiability, updateAsset, addAsset, addLiability, applyEventOutcome, performTransfer } from './dbService.mock';