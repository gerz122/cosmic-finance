import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal, Share } from '../types';
import { TransactionType, AssetType, AccountType } from '../types';
import { ALL_ACHIEVEMENTS } from '../components/Achievements';


// --- IN-MEMORY DATABASE ---
// This service uses local data to simulate a database connection,
// restoring the app's functionality without requiring a live Firebase connection.

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
// FIX: Explicitly cast the 'teams' array to Team[] to ensure type compatibility.
    ] as Team[],
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Mocks fetching all users and assembling their complete data profile.
 */
export const getUsers = async (): Promise<User[]> => {
    await delay(500); // Simulate network latency
    console.log("dbService: Fetching users...");
    
    // The initial data for users is just basic info. We need to assemble the full object.
    const usersWithDetails: User[] = initialData.users.map(u => {
        // Find all accounts owned by this user
        const userAccounts = initialData.accounts.filter(acc => acc.ownerIds.includes(u.id));

        return {
            ...u,
            accounts: userAccounts as Account[],
            // In this mock, personal financial statements start empty. Data comes from teams.
            financialStatement: {
                transactions: [],
                assets: [],
                liabilities: [],
            },
            budgets: [],
            goals: [],
            achievements: u.achievements || [],
        };
    });
    
    return JSON.parse(JSON.stringify(usersWithDetails));
};

/**
 * Mocks fetching all teams a specific user belongs to.
 */
export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
    await delay(300);
    console.log(`dbService: Fetching teams for user ${userId}...`);
    
    const user = initialData.users.find(u => u.id === userId);
    if (!user || !user.teamIds) return [];

    const userTeams = initialData.teams.filter(team => user.teamIds.includes(team.id));
    return JSON.parse(JSON.stringify(userTeams));
};


// --- The following functions simulate writes by operating on the passed-in state ---
// In a real app, they would write to Firebase and then the main app state would be refetched or updated.

const findAccount = (users: User[], accountId: string): Account | undefined => {
    for (const user of users) {
        const account = user.accounts.find(a => a.id === accountId);
        if (account) return account;
    }
    return undefined;
};

const findTeam = (teams: Team[], teamId: string): Team | undefined => {
    return teams.find(t => t.id === teamId);
}

export const addTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>, users: User[]): Promise<User[]> => {
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };
    const usersCopy = JSON.parse(JSON.stringify(users));

    newTx.paymentShares.forEach(share => {
        const account = findAccount(usersCopy, share.accountId);
        if (account) {
            account.balance += (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
        }
    });

    // In this mocked version, we don't add the transaction to a user's personal statement,
    // as it mainly affects account balances. This mimics the initial data structure.
    
    return usersCopy;
};

export const addTeamTransaction = async (transaction: Omit<Transaction, 'id'>, teams: Team[], users: User[]): Promise<{ updatedTeam: Team, updatedUsers: User[] }> => {
    const newTx: Transaction = { ...transaction, id: `tx-${Date.now()}` };
    const teamsCopy = JSON.parse(JSON.stringify(teams));
    const usersCopy = JSON.parse(JSON.stringify(users));

    const team = findTeam(teamsCopy, newTx.teamId!);
    if (!team) throw new Error("Team not found");

    team.financialStatement.transactions.push(newTx);

    newTx.paymentShares.forEach(share => {
        const account = findAccount(usersCopy, share.accountId);
        if (account) {
            account.balance += (newTx.type === TransactionType.INCOME ? share.amount : -share.amount);
        }
    });

    return { updatedTeam: team, updatedUsers: usersCopy };
};

export const updateTransaction = async (transaction: Transaction, users: User[], teams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
    // This is complex to mock perfectly without a real DB. We'll simplify:
    // We assume amounts haven't changed, just details like description.
    // A real implementation would need to revert the old transaction's financial impact and apply the new one's.
    
    const teamsCopy = JSON.parse(JSON.stringify(teams));
    if (transaction.teamId) {
        const team = findTeam(teamsCopy, transaction.teamId);
        if (team) {
            const txIndex = team.financialStatement.transactions.findIndex(t => t.id === transaction.id);
            if (txIndex > -1) {
                team.financialStatement.transactions[txIndex] = transaction;
            }
        }
    }
    // Personal transaction update logic would go here.

    return { updatedUsers: users, updatedTeams: teamsCopy };
};

export const deleteTransaction = async (transactionId: string, users: User[], teams: Team[]): Promise<{ updatedUsers: User[], updatedTeams: Team[] }> => {
    // This is also complex. We'll just remove the transaction but won't revert the financial impact for this mock.
     const teamsCopy = JSON.parse(JSON.stringify(teams));
     teamsCopy.forEach(team => {
        team.financialStatement.transactions = team.financialStatement.transactions.filter(t => t.id !== transactionId);
     });
     return { updatedUsers: users, updatedTeams: teamsCopy };
};

export const performTransfer = async(userId: string, fromAccountId: string, toAccountId: string, amount: number): Promise<User> => {
    // This function can be fully implemented as it only affects user state.
    const user = (await getUsers()).find(u => u.id === userId)!; // Re-fetch to get clean state
    const userCopy = JSON.parse(JSON.stringify(user));
    
    const fromAccount = userCopy.accounts.find(a => a.id === fromAccountId);
    const toAccount = userCopy.accounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount) throw new Error("Account not found");
    if (fromAccount.balance < amount) throw new Error("Insufficient funds");

    fromAccount.balance -= amount;
    toAccount.balance += amount;

    return userCopy;
};

export const applyEventOutcome = async (user: User, outcome: EventOutcome): Promise<User> => {
    const userCopy = JSON.parse(JSON.stringify(user));
    if (outcome.cashChange) {
        // Apply to first checking/cash account
        const cashAccount = userCopy.accounts.find(a => a.type === AccountType.CHECKING || a.type === AccountType.CASH);
        if (cashAccount) {
            cashAccount.balance += outcome.cashChange;
        } else {
            alert("No cash/checking account to apply cash change!");
        }
    }
    if (outcome.newAsset) {
        const newAsset: Asset = { ...outcome.newAsset, id: `asset-${Date.now()}` };
        userCopy.financialStatement.assets.push(newAsset);
    }
    return userCopy;
};

// Mock implementations for other write functions
export const addAsset = async (userId: string, assetData: Partial<Asset>): Promise<User> => {
    // This is a placeholder. In a real app, this would update the user in the database.
    console.log("Mock addAsset called for user:", userId, assetData);
    const user = (await getUsers()).find(u => u.id === userId)!;
    user.financialStatement.assets.push({ ...assetData, id: `asset-${Date.now()}` } as Asset);
    return user;
};
export const addLiability = async (userId: string, liabilityData: Partial<Liability>): Promise<User> => {
    console.log("Mock addLiability called for user:", userId, liabilityData);
    const user = (await getUsers()).find(u => u.id === userId)!;
    user.financialStatement.liabilities.push({ ...liabilityData, id: `lia-${Date.now()}` } as Liability);
    return user;
};
export const updateAsset = async (userId: string, assetId: string, data: Partial<Asset>): Promise<User> => {
    console.log("Mock updateAsset called");
    return (await getUsers()).find(u => u.id === userId)!;
};
export const updateLiability = async (userId: string, liabilityId: string, data: Partial<Liability>): Promise<User> => {
    console.log("Mock updateLiability called");
    return (await getUsers()).find(u => u.id === userId)!;
};
export const deleteAsset = async (userId: string, assetId: string): Promise<User> => {
    console.log("Mock deleteAsset called");
    return (await getUsers()).find(u => u.id === userId)!;
};

export const addAccount = async (userId: string, accountData: Omit<Account, 'id' | 'ownerIds'>): Promise<User> => {
    console.log("Mock addAccount called for user:", userId, accountData);
    const user = (await getUsers()).find(u => u.id === userId)!;
    const newAccount: Account = {
        ...accountData,
        id: `acc-${Date.now()}`,
        ownerIds: [userId]
    };
    user.accounts.push(newAccount);
    return user;
};
export const updateAccount = async (account: Account, users: User[]): Promise<User[]> => {
    console.log("Mock updateAccount called");
    const usersCopy = JSON.parse(JSON.stringify(users));
    let found = false;
    for (const user of usersCopy) {
        const accIndex = user.accounts.findIndex(a => a.id === account.id);
        if (accIndex > -1) {
            user.accounts[accIndex] = account;
            found = true;
            break;
        }
    }
    return usersCopy;
};

export const logDividend = async (user: User, stockId: string, amount: number, accountId: string): Promise<User> => {
    const userCopy = JSON.parse(JSON.stringify(user));
    const stock = userCopy.financialStatement.assets.find(a => a.id === stockId);
    const account = userCopy.accounts.find(a => a.id === accountId);

    if (!stock || !account) throw new Error("Stock or account not found");

    account.balance += amount;

    // We also need to add a transaction for this
    const dividendTx: Omit<Transaction, 'id'> = {
        description: `Dividend from ${stock.ticker || stock.name}`,
        amount: amount,
        type: TransactionType.INCOME,
        category: 'Investment',
        date: new Date().toISOString().split('T')[0],
        isPassive: true,
        paymentShares: [{ userId: user.id, accountId: accountId, amount: amount }],
        expenseShares: []
    };
    
    // In a real app, you would call addTransaction here, but for mock, we'll just return the user with updated balance.
    console.log("Logged dividend, created transaction:", dividendTx);

    return userCopy;
};

export const createTeam = async (name: string, memberIds: string[]): Promise<Team> => {
    console.log("Creating team:", name, memberIds);
    const newTeam: Team = {
        id: `team-${Date.now()}`,
        name,
        memberIds,
        accounts: [],
        goals: [],
        financialStatement: {
            transactions: [],
            assets: [],
            liabilities: [],
        }
    };
    initialData.teams.push(newTeam); // Add to our mock data source
    return newTeam;
};


export const checkAndUnlockAchievement = async (userId: string, achievementId: string): Promise<User | null> => {
    const user = (await getUsers()).find(u => u.id === userId);
    if (!user) return null;
    if (user.achievements.includes(achievementId)) return null; // Already unlocked

    console.log(`Unlocking achievement ${achievementId} for ${userId}`);
    user.achievements.push(achievementId);
    return user;
};


// Budget and Goal functions
export const saveBudget = async (userId: string, budget: Budget): Promise<User> => {
    const user = (await getUsers()).find(u => u.id === userId)!;
    const budgetIndex = user.budgets.findIndex(b => b.month === budget.month);
    if (budgetIndex > -1) {
        user.budgets[budgetIndex] = budget;
    } else {
        user.budgets.push(budget);
    }
    return user;
};
export const addGoal = async (userId: string, goalData: Omit<Goal, 'id' | 'currentAmount'>): Promise<User> => {
    const user = (await getUsers()).find(u => u.id === userId)!;
    const newGoal: Goal = {
        ...goalData,
        id: `goal-${Date.now()}`,
        currentAmount: 0
    };
    user.goals.push(newGoal);
    return user;
};
export const deleteGoal = async (userId: string, goalId: string): Promise<User> => {
    const user = (await getUsers()).find(u => u.id === userId)!;
    user.goals = user.goals.filter(g => g.id !== goalId);
    return user;
};
export const updateGoal = async (userId: string, goal: Goal): Promise<User> => {
    const user = (await getUsers()).find(u => u.id === userId)!;
    const goalIndex = user.goals.findIndex(g => g.id === goal.id);
    if (goalIndex > -1) {
        user.goals[goalIndex] = goal;
    }
    return user;
};

// Team asset/liability functions (placeholders)
export const addTeamAsset = async (teamId: string, assetData: Partial<Asset>): Promise<Team> => {
    const team = (await getTeamsForUser('any')).find(t => t.id === teamId)!;
    team.financialStatement.assets.push({ ...assetData, id: `asset-team-${Date.now()}` } as Asset);
    return team;
}
export const addTeamLiability = async (teamId: string, liabilityData: Partial<Liability>): Promise<Team> => {
    const team = (await getTeamsForUser('any')).find(t => t.id === teamId)!;
    team.financialStatement.liabilities.push({ ...liabilityData, id: `lia-team-${Date.now()}` } as Liability);
    return team;
}
export const updateTeamAsset = async (teamId: string, assetId: string, data: Partial<Asset>): Promise<Team> => {
    return (await getTeamsForUser('any')).find(t => t.id === teamId)!;
}
export const updateTeamLiability = async (teamId: string, liabilityId: string, data: Partial<Liability>): Promise<Team> => {
    return (await getTeamsForUser('any')).find(t => t.id === teamId)!;
}
