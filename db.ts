// FIX: Remove v9 firestore imports as they are replaced by v8 namespaced API.
import { firestore } from './services/firebase';
import type { User, Transaction, Asset, Liability, EventOutcome, Share } from './types';
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
                { id: 'a2', name: 'Galactic Holdings Inc.', type: AssetType.STOCK, value: 25000, monthlyCashflow: 100, ticker: 'GHI', shares: 100, purchasePrice: 250 },
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
                { id: 'a2-u2', name: 'Nebula Corp', type: AssetType.STOCK, value: 32000, monthlyCashflow: 0, ticker: 'NBLA', shares: 200, purchasePrice: 160 },
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
    // FIX: Use Firebase v8 batch syntax
    const batch = firestore.batch();
    initialUsers.forEach(user => {
        // FIX: Use Firebase v8 doc reference syntax
        const userRef = firestore.collection("users").doc(user.id);
        batch.set(userRef, user);
    });
    await batch.commit();
    console.log("Seeding complete.");
    return initialUsers;
};

export const db = {
    getUsers: async (): Promise<User[]> => {
        // FIX: Use Firebase v8 collection and get syntax
        const usersCol = firestore.collection('users');
        const userSnapshot = await usersCol.get();

        if (userSnapshot.empty) {
            // If the database is empty, seed it with initial data
            return await seedInitialData();
        }

        const userList = userSnapshot.docs.map(doc => doc.data() as User);
        return userList;
    },
    
    addTransaction: async (
        activeUserId: string, 
        transaction: Omit<Transaction, 'id'>, 
        teamMembers: User[]
    ): Promise<{ updatedPayer: User, updatedReceivers: User[] }> => {
        
        const newTransaction: Transaction = {
            ...transaction,
            id: `t${new Date().getTime()}`,
        };

        // FIX: Use Firebase v8 batch syntax
        const batch = firestore.batch();

        const payerId = newTransaction.isShared ? newTransaction.payerId! : activeUserId;
        
        // --- Process Payer ---
        // FIX: Use Firebase v8 doc reference and get syntax
        const payerRef = firestore.collection('users').doc(payerId);
        const payerSnap = await payerRef.get();
        if (!payerSnap.exists) throw new Error("Payer not found");
        const payer = payerSnap.data() as User;
        
        const payerCash = payer.financialStatement.assets.find(a => a.type === AssetType.CASH);
        
        // Adjust payer's cash by the FULL transaction amount
        if (newTransaction.type === TransactionType.INCOME) {
            if (payerCash) payerCash.value += newTransaction.amount;
            else payer.financialStatement.assets.push({ id: `a-cash-${new Date().getTime()}`, name: 'Cash', type: AssetType.CASH, value: newTransaction.amount, monthlyCashflow: 0 });
        } else { // Expense
            if (!payerCash || payerCash.value < newTransaction.amount) throw new Error("Payer has insufficient funds.");
            payerCash.value -= newTransaction.amount;
        }

        // --- Process all involved users (for shared transactions) ---
        let involvedUserIds: Set<string>;
        if (newTransaction.isShared && newTransaction.shares) {
            involvedUserIds = new Set(newTransaction.shares.map(s => s.userId));
        } else {
            involvedUserIds = new Set([activeUserId]);
        }
        
        const updatedReceivers: User[] = [];

        for (const userId of involvedUserIds) {
            let user: User;
            // If the current user is the payer, we already have their data.
            if(userId === payer.id) {
                user = payer;
            } else {
                // FIX: Use Firebase v8 doc reference and get syntax
                const userRef = firestore.collection('users').doc(userId);
                const userSnap = await userRef.get();
                if (!userSnap.exists) continue; // Skip if user not found
                user = userSnap.data() as User;
            }

            // Add the transaction to everyone's statement for record-keeping
            user.financialStatement.transactions.push(newTransaction);
            // FIX: Use Firebase v8 batch set syntax with doc reference
            const userDocRef = firestore.collection('users').doc(user.id);
            batch.set(userDocRef, user);
            if(user.id !== payer.id) updatedReceivers.push(user);
        }
        
        // Make sure the payer is also updated in the batch, especially if they are the only one involved.
        batch.set(payerRef, payer);

        await batch.commit();

        return { updatedPayer: payer, updatedReceivers };
    },

    performTransfer: async (fromUserId: string, toUserId: string, amount: number): Promise<{fromUser: User, toUser: User}> => {
        // FIX: Use Firebase v8 doc reference syntax
        const fromUserRef = firestore.collection('users').doc(fromUserId);
        const toUserRef = firestore.collection('users').doc(toUserId);
        
        // FIX: Use Firebase v8 batch syntax
        const batch = firestore.batch();

        // FIX: Use Firebase v8 get syntax on doc reference
        const fromUserSnap = await fromUserRef.get();
        const toUserSnap = await toUserRef.get();

        if (!fromUserSnap.exists || !toUserSnap.exists) {
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
    },
    
    addStock: async (userId: string, stockData: Omit<Asset, 'id' | 'type' | 'value' | 'monthlyCashflow'>): Promise<User> => {
        // FIX: Use Firebase v8 doc reference and get syntax
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = userSnap.data() as User;

        const cost = (stockData.shares || 0) * (stockData.purchasePrice || 0);
        const cash = user.financialStatement.assets.find(a => a.type === AssetType.CASH);
        if (!cash || cash.value < cost) throw new Error("Insufficient cash to purchase this stock.");
        
        cash.value -= cost;

        const newStock: Asset = {
            id: `a-stock-${new Date().getTime()}`,
            ...stockData,
            name: stockData.name || stockData.ticker || 'Unknown Stock',
            type: AssetType.STOCK,
            value: cost, // Initial value is the purchase cost
            monthlyCashflow: 0, // Assuming stocks don't provide monthly cashflow unless dividends are logged
        };
        user.financialStatement.assets.push(newStock);

        const purchaseTransaction: Transaction = {
            id: `t-buy-${new Date().getTime()}`,
            description: `Buy ${stockData.shares} of ${newStock.name} (${newStock.ticker})`,
            amount: cost,
            type: TransactionType.EXPENSE,
            category: 'Investment',
            date: new Date().toISOString().split('T')[0],
        };
        user.financialStatement.transactions.push(purchaseTransaction);
        
        // FIX: Use Firebase v8 set syntax
        await userRef.set(user);
        return user;
    },

    updateStock: async (userId: string, assetId: string, stockData: Partial<Asset>): Promise<User> => {
        // FIX: Use Firebase v8 doc reference and get syntax
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = userSnap.data() as User;

        const assetIndex = user.financialStatement.assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) throw new Error("Asset not found");

        // Merge new data into existing asset
        user.financialStatement.assets[assetIndex] = {
            ...user.financialStatement.assets[assetIndex],
            ...stockData
        };

        // FIX: Use Firebase v8 set syntax
        await userRef.set(user);
        return user;
    },

    deleteStock: async (userId: string, assetId: string): Promise<User> => {
        // FIX: Use Firebase v8 doc reference and get syntax
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = userSnap.data() as User;

        const assetIndex = user.financialStatement.assets.findIndex(a => a.id === assetId);
        if (assetIndex === -1) throw new Error("Asset not found");

        const [stockToSell] = user.financialStatement.assets.splice(assetIndex, 1);
        const sellValue = stockToSell.value; // Assume selling at current market value

        const cash = user.financialStatement.assets.find(a => a.type === AssetType.CASH);
        if (cash) {
            cash.value += sellValue;
        } else {
             user.financialStatement.assets.push({
                 id: `a-cash-${new Date().getTime()}`, name: 'Cash', type: AssetType.CASH,
                 value: sellValue, monthlyCashflow: 0
             });
        }
        
        const saleTransaction: Transaction = {
            id: `t-sell-${new Date().getTime()}`,
            description: `Sell ${stockToSell.name} (${stockToSell.ticker})`,
            amount: sellValue,
            type: TransactionType.INCOME,
            category: 'Investment',
            date: new Date().toISOString().split('T')[0],
        };
        user.financialStatement.transactions.push(saleTransaction);

        // FIX: Use Firebase v8 set syntax
        await userRef.set(user);
        return user;
    },

    logDividend: async (userId: string, assetId: string, amount: number): Promise<User> => {
        // FIX: Use Firebase v8 doc reference and get syntax
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();
        if (!userSnap.exists) throw new Error("User not found");
        const user = userSnap.data() as User;

        const stock = user.financialStatement.assets.find(a => a.id === assetId);
        if (!stock) throw new Error("Stock asset not found");

        const cash = user.financialStatement.assets.find(a => a.type === AssetType.CASH);
        if (cash) {
            cash.value += amount;
        } else {
             user.financialStatement.assets.push({
                 id: `a-cash-${new Date().getTime()}`, name: 'Cash', type: AssetType.CASH,
                 value: amount, monthlyCashflow: 0
             });
        }

        const dividendTransaction: Transaction = {
            id: `t-div-${new Date().getTime()}`,
            description: `Dividend from ${stock.name} (${stock.ticker})`,
            amount: amount,
            type: TransactionType.INCOME,
            category: 'Investment',
            date: new Date().toISOString().split('T')[0],
            isPassive: true, // Dividends are passive income
        };
        user.financialStatement.transactions.push(dividendTransaction);

        // FIX: Use Firebase v8 set syntax
        await userRef.set(user);
        return user;
    },

    applyEventOutcome: async (userId: string, outcome: EventOutcome): Promise<User> => {
        // FIX: Use Firebase v8 doc reference and get syntax
        const userRef = firestore.collection('users').doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            throw new Error("User not found");
        }

        const user = userSnap.data() as User;
        const statement = user.financialStatement;
        
        // 1. Apply cash change
        if (outcome.cashChange) {
            let cashAsset = statement.assets.find(a => a.type === AssetType.CASH);
            if (cashAsset) {
                if(cashAsset.value + outcome.cashChange < 0) {
                    throw new Error("Operation failed: Not enough cash for this event.");
                }
                cashAsset.value += outcome.cashChange;
            } else if (outcome.cashChange > 0) {
                statement.assets.push({
                    id: `a${new Date().getTime()}`, name: 'Cash', type: AssetType.CASH,
                    value: outcome.cashChange, monthlyCashflow: 0
                });
            } else {
                 throw new Error("Operation failed: Not enough cash for this event.");
            }
        }
        
        // 2. Add new asset
        if (outcome.newAsset) {
            const newAsset: Asset = {
                ...outcome.newAsset,
                id: `a${new Date().getTime()}`,
            };
            statement.assets.push(newAsset);
            
            // If the new asset generates passive income, add a recurring transaction
            if (newAsset.monthlyCashflow > 0) {
                 const newTransaction: Transaction = {
                    id: `t-passive-${new Date().getTime()}`,
                    description: `${newAsset.name} Cashflow`,
                    amount: newAsset.monthlyCashflow,
                    type: TransactionType.INCOME,
                    category: 'Investment',
                    date: new Date().toISOString().split('T')[0],
                    isPassive: true
                };
                statement.transactions.push(newTransaction);
            }
        }
        
        // Add a transaction to log the event
        const eventTransaction: Transaction = {
            id: `t-event-${new Date().getTime()}`,
            description: outcome.message.split('!')[0], // a summary of the message
            amount: Math.abs(outcome.cashChange || 0),
            type: (outcome.cashChange || 0) < 0 ? TransactionType.EXPENSE : TransactionType.INCOME,
            category: 'Cosmic Event',
            date: new Date().toISOString().split('T')[0],
        };

        // only add if there was a cash change
        if(outcome.cashChange && outcome.cashChange !== 0){
             statement.transactions.push(eventTransaction);
        }

        // FIX: Use Firebase v8 set syntax
        await userRef.set(user);
        return user;
    }
};