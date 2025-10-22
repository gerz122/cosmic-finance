import { collection, getDocs, doc, setDoc, writeBatch, getDoc } from "firebase/firestore";
import { firestore } from './services/firebase';
import type { User, Transaction, Asset, Liability } from './types';
import { TransactionType, AssetType } from './types';


// --- Initial Mock Data for Seeding ---
const initialUsers: User[] = [
    {
        id: 'user1',
        name: 'Star Player',
        avatar: 'https://i.pravatar.cc/150?u=user1',
        financialStatement: {
            transactions: [
                { id: 't1', description: 'Salary', amount: 5000, type: TransactionType.INCOME, category: 'Job', date: '2023-10-01', isPassive: false },
                { id: 't2', description: 'Rental Income', amount: 600, type: TransactionType.INCOME, category: 'Real Estate', date: '2023-10-05', isPassive: true },
                { id: 't3', description: 'Rent', amount: 1500, type: TransactionType.EXPENSE, category: 'Housing', date: '2023-10-01' },
                { id: 't4', description: 'Groceries', amount: 400, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-03' },
            ],
            assets: [
                { id: 'a1', name: 'Rental Property', type: AssetType.REAL_ESTATE, value: 120000, monthlyCashflow: 600 },
                { id: 'a2', name: 'Stock Portfolio', type: AssetType.STOCK, value: 25000, monthlyCashflow: 100 },
                { id: 'a3', name: 'Cash', type: AssetType.CASH, value: 10000, monthlyCashflow: 0 },
            ],
            liabilities: [
                { id: 'l1', name: 'Mortgage', balance: 95000, interestRate: 3.5, monthlyPayment: 450 },
                { id: 'l2', name: 'Car Loan', balance: 12000, interestRate: 5.0, monthlyPayment: 350 },
            ],
        },
    },
    {
        id: 'user2',
        name: 'Cosmic Partner',
        avatar: 'https://i.pravatar.cc/150?u=user2',
        financialStatement: {
            transactions: [
                 { id: 't1-u2', description: 'Freelance Work', amount: 3500, type: TransactionType.INCOME, category: 'Job', date: '2023-10-01', isPassive: false },
                 { id: 't2-u2', description: 'Student Loan', amount: 400, type: TransactionType.EXPENSE, category: 'Loan', date: '2023-10-05' },
                 { id: 't3-u2', description: 'Groceries', amount: 350, type: TransactionType.EXPENSE, category: 'Food', date: '2023-10-03' },
            ],
            assets: [
                { id: 'a1-u2', name: 'Emergency Fund', type: AssetType.CASH, value: 15000, monthlyCashflow: 0 },
                { id: 'a2-u2', name: '401k', type: AssetType.STOCK, value: 32000, monthlyCashflow: 0 },
            ],
            liabilities: [
                 { id: 'l1-u2', name: 'Student Loan', balance: 25000, interestRate: 6.0, monthlyPayment: 400 },
            ],
        },
    }
];

// --- API Functions using Firebase ---

const seedInitialData = async () => {
    console.log("Seeding initial data to Firestore...");
    const batch = writeBatch(firestore);
    initialUsers.forEach(user => {
        const userRef = doc(firestore, "users", user.id);
        batch.set(userRef, user);
    });
    await batch.commit();
    console.log("Seeding complete.");
    return initialUsers;
};

export const db = {
    getUsers: async (): Promise<User[]> => {
        const usersCol = collection(firestore, 'users');
        const userSnapshot = await getDocs(usersCol);

        if (userSnapshot.empty) {
            // If the database is empty, seed it with initial data
            return await seedInitialData();
        }

        const userList = userSnapshot.docs.map(doc => doc.data() as User);
        return userList;
    },
    
    addTransaction: async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<User> => {
        const userRef = doc(firestore, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            throw new Error("User not found");
        }
        
        const user = userSnap.data() as User;

        const newTransaction: Transaction = {
            ...transaction,
            id: `t${new Date().getTime()}`,
        };

        user.financialStatement.transactions.push(newTransaction);
        
        let cashAsset = user.financialStatement.assets.find(a => a.type === AssetType.CASH);
        if (cashAsset) {
            if (newTransaction.type === TransactionType.INCOME) {
                cashAsset.value += newTransaction.amount;
            } else {
                cashAsset.value -= newTransaction.amount;
            }
        } else {
             user.financialStatement.assets.push({
                 id: `a${new Date().getTime()}`,
                 name: 'Cash',
                 type: AssetType.CASH,
                 value: newTransaction.type === TransactionType.INCOME ? newTransaction.amount : -newTransaction.amount,
                 monthlyCashflow: 0
             });
        }
        
        await setDoc(userRef, user);
        return user;
    },

    performTransfer: async (fromUserId: string, toUserId: string, amount: number): Promise<{fromUser: User, toUser: User}> => {
        const fromUserRef = doc(firestore, 'users', fromUserId);
        const toUserRef = doc(firestore, 'users', toUserId);
        
        const batch = writeBatch(firestore);

        const fromUserSnap = await getDoc(fromUserRef);
        const toUserSnap = await getDoc(toUserRef);

        if (!fromUserSnap.exists() || !toUserSnap.exists()) {
            throw new Error("User not found");
        }

        const fromUser = fromUserSnap.data() as User;
        const toUser = toUserSnap.data() as User;

        const fromCash = fromUser.financialStatement.assets.find(a => a.type === AssetType.CASH);
        
        if (!fromCash || fromCash.value < amount) {
            throw new Error("Insufficient funds for transfer");
        }

        fromCash.value -= amount;
        
        const toCash = toUser.financialStatement.assets.find(a => a.type === AssetType.CASH);
        if (toCash) {
            toCash.value += amount;
        } else {
            toUser.financialStatement.assets.push({
                id: `a${new Date().getTime()}`,
                name: 'Cash',
                type: AssetType.CASH,
                value: amount,
                monthlyCashflow: 0
            });
        }
        
        const transferTransactionOut: Transaction = {
            id: `t-out-${new Date().getTime()}`,
            description: `Transfer to ${toUser.name}`,
            amount: amount,
            type: TransactionType.EXPENSE,
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0]
        };
        fromUser.financialStatement.transactions.push(transferTransactionOut);
         
        const transferTransactionIn: Transaction = {
            id: `t-in-${new Date().getTime()}`,
            description: `Transfer from ${fromUser.name}`,
            amount: amount,
            type: TransactionType.INCOME,
            category: 'Transfer',
            date: new Date().toISOString().split('T')[0]
        };
        toUser.financialStatement.transactions.push(transferTransactionIn);

        batch.set(fromUserRef, fromUser);
        batch.set(toUserRef, toUser);
        
        await batch.commit();

        return { fromUser, toUser };
    }
};
