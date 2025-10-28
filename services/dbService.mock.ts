// This file contains the mock (in-memory) implementations of the dbService functions.
// The main dbService.ts file now re-exports these to maintain functionality for less critical paths
// while the core data fetching is handled by Firestore.

import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal, Share } from '../types';
import { TransactionType, AssetType, AccountType } from '../types';

// This is a simplified local state for mocking.
let mockUsers: User[] = [];
let mockTeams: Team[] = [];

// Helper to get a clean copy of data to avoid mutation issues
async function getFreshMockData() {
    // This would be a more robust fetch in a real mock setup
    if(mockUsers.length === 0) {
       // A simplified version of the initial data setup
        const user1: User = { id: 'german', name: 'German', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=german', teamIds: [], accounts: [{id: 'g-cash', name: 'G-Cash', type: AccountType.CASH, balance: 1000, ownerIds: ['german']}], financialStatement: { transactions:[], assets: [], liabilities: []}, budgets: [], goals: [], achievements: [] };
        const user2: User = { id: 'valeria', name: 'Valeria', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=valeria', teamIds: [], accounts: [{id: 'v-cash', name: 'V-Cash', type: AccountType.CASH, balance: 1200, ownerIds: ['valeria']}], financialStatement: { transactions:[], assets: [], liabilities: []}, budgets: [], goals: [], achievements: [] };
        mockUsers = [user1, user2];
    }
    return {
        users: JSON.parse(JSON.stringify(mockUsers)),
        teams: JSON.parse(JSON.stringify(mockTeams)),
    }
}

export const performTransfer = async(userId: string, fromAccountId: string, toAccountId: string, amount: number): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    
    const fromAccount = user.accounts.find(a => a.id === fromAccountId);
    const toAccount = user.accounts.find(a => a.id === toAccountId);

    if (!fromAccount || !toAccount) throw new Error("Account not found");
    if (fromAccount.balance < amount) throw new Error("Insufficient funds");

    fromAccount.balance -= amount;
    toAccount.balance += amount;
    
    // Update the 'database'
    mockUsers = users;

    return user;
};

export const applyEventOutcome = async (user: User, outcome: EventOutcome): Promise<User> => {
    const userCopy = JSON.parse(JSON.stringify(user));
    if (outcome.cashChange) {
        const cashAccount = userCopy.accounts.find((a: Account) => a.type === AccountType.CHECKING || a.type === AccountType.CASH);
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

export const addAsset = async (userId: string, assetData: Partial<Asset>): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    user.financialStatement.assets.push({ ...assetData, id: `asset-${Date.now()}` } as Asset);
    mockUsers = users;
    return user;
};
export const addLiability = async (userId: string, liabilityData: Partial<Liability>): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    user.financialStatement.liabilities.push({ ...liabilityData, id: `lia-${Date.now()}` } as Liability);
    mockUsers = users;
    return user;
};
export const updateAsset = async (userId: string, assetId: string, data: Partial<Asset>): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    const assetIndex = user.financialStatement.assets.findIndex(a => a.id === assetId);
    if (assetIndex > -1) {
        Object.assign(user.financialStatement.assets[assetIndex], data);
    }
    mockUsers = users;
    return user;
};
export const updateLiability = async (userId: string, liabilityId: string, data: Partial<Liability>): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    const liaIndex = user.financialStatement.liabilities.findIndex(l => l.id === liabilityId);
    if (liaIndex > -1) {
        Object.assign(user.financialStatement.liabilities[liaIndex], data);
    }
    mockUsers = users;
    return user;
};
export const deleteAsset = async (userId: string, assetId: string): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    user.financialStatement.assets = user.financialStatement.assets.filter(a => a.id !== assetId);
    mockUsers = users;
    return user;
};

export const addAccount = async (userId: string, accountData: Omit<Account, 'id' | 'ownerIds'>): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    const newAccount: Account = {
        ...accountData,
        id: `acc-${Date.now()}`,
        ownerIds: [userId]
    };
    user.accounts.push(newAccount);
    mockUsers = users;
    return user;
};
export const updateAccount = async (account: Account, users: User[]): Promise<User[]> => {
    const usersCopy = JSON.parse(JSON.stringify(users));
    for (const user of usersCopy) {
        const accIndex = user.accounts.findIndex((a: Account) => a.id === account.id);
        if (accIndex > -1) {
            user.accounts[accIndex] = account;
            break;
        }
    }
    mockUsers = usersCopy;
    return usersCopy;
};

export const logDividend = async (user: User, stockId: string, amount: number, accountId: string): Promise<User> => {
    const userCopy = JSON.parse(JSON.stringify(user));
    const stock = userCopy.financialStatement.assets.find((a: Asset) => a.id === stockId);
    const account = userCopy.accounts.find((a: Account) => a.id === accountId);

    if (!stock || !account) throw new Error("Stock or account not found");
    account.balance += amount;
    
    // In a real app, you would also create a transaction here.
    return userCopy;
};

export const createTeam = async (name: string, memberIds: string[]): Promise<Team> => {
    const { teams } = await getFreshMockData();
    const newTeam: Team = {
        id: `team-${Date.now()}`,
        name,
        memberIds,
        accounts: [],
        goals: [],
        financialStatement: { transactions: [], assets: [], liabilities: [] }
    };
    teams.push(newTeam);
    mockTeams = teams;
    return newTeam;
};


export const checkAndUnlockAchievement = async (userId: string, achievementId: string): Promise<User | null> => {
    const { users } = await getFreshMockData();
    const user = users.find((u:User) => u.id === userId);
    if (!user || user.achievements.includes(achievementId)) return null;

    user.achievements.push(achievementId);
    mockUsers = users;
    return user;
};


// Budget and Goal functions
export const saveBudget = async (userId: string, budget: Budget): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    const budgetIndex = user.budgets.findIndex(b => b.month === budget.month);
    if (budgetIndex > -1) user.budgets[budgetIndex] = budget;
    else user.budgets.push(budget);
    mockUsers = users;
    return user;
};
export const addGoal = async (userId: string, goalData: Omit<Goal, 'id' | 'currentAmount'>): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    const newGoal: Goal = { ...goalData, id: `goal-${Date.now()}`, currentAmount: 0 };
    user.goals.push(newGoal);
    mockUsers = users;
    return user;
};
export const deleteGoal = async (userId: string, goalId: string): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    user.goals = user.goals.filter(g => g.id !== goalId);
    mockUsers = users;
    return user;
};
export const updateGoal = async (userId: string, goal: Goal): Promise<User> => {
    const { users } = await getFreshMockData();
    const user = users.find((u: User) => u.id === userId)!;
    const goalIndex = user.goals.findIndex(g => g.id === goal.id);
    if (goalIndex > -1) user.goals[goalIndex] = goal;
    mockUsers = users;
    return user;
};

// Team asset/liability functions
export const addTeamAsset = async (teamId: string, assetData: Partial<Asset>): Promise<Team> => {
    const { teams } = await getFreshMockData();
    const team = teams.find((t:Team) => t.id === teamId)!;
    team.financialStatement.assets.push({ ...assetData, id: `asset-team-${Date.now()}` } as Asset);
    mockTeams = teams;
    return team;
}
export const addTeamLiability = async (teamId: string, liabilityData: Partial<Liability>): Promise<Team> => {
    const { teams } = await getFreshMockData();
    const team = teams.find((t:Team) => t.id === teamId)!;
    team.financialStatement.liabilities.push({ ...liabilityData, id: `lia-team-${Date.now()}` } as Liability);
    mockTeams = teams;
    return team;
}
export const updateTeamAsset = async (teamId: string, assetId: string, data: Partial<Asset>): Promise<Team> => {
    const { teams } = await getFreshMockData();
    const team = teams.find((t:Team) => t.id === teamId)!;
    const assetIndex = team.financialStatement.assets.findIndex(a => a.id === assetId);
    if(assetIndex > -1) Object.assign(team.financialStatement.assets[assetIndex], data);
    mockTeams = teams;
    return team;
}
export const updateTeamLiability = async (teamId: string, liabilityId: string, data: Partial<Liability>): Promise<Team> => {
    const { teams } = await getFreshMockData();
    const team = teams.find((t:Team) => t.id === teamId)!;
    const liaIndex = team.financialStatement.liabilities.findIndex(l => l.id === liabilityId);
    if(liaIndex > -1) Object.assign(team.financialStatement.liabilities[liaIndex], data);
    mockTeams = teams;
    return team;
}
