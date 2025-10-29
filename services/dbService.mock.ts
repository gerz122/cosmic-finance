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
        const user1: User = { id: 'german', name: 'German', email: 'german@example.com', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=german', teamIds: [], accounts: [{id: 'g-cash', name: 'G-Cash', type: AccountType.CASH, balance: 1000, ownerIds: ['german']}], financialStatement: { transactions:[], assets: [], liabilities: []}, budgets: [], goals: [], achievements: [] };
        const user2: User = { id: 'valeria', name: 'Valeria', email: 'valeria@example.com', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=valeria', teamIds: [], accounts: [{id: 'v-cash', name: 'V-Cash', type: AccountType.CASH, balance: 1200, ownerIds: ['valeria']}], financialStatement: { transactions:[], assets: [], liabilities: []}, budgets: [], goals: [], achievements: [] };
        mockUsers = [user1, user2];
    }
    return {
        users: JSON.parse(JSON.stringify(mockUsers)),
        teams: JSON.parse(JSON.stringify(mockTeams)),
    }
}

// NOTE: Most functions are now implemented in dbService.ts.
// Only functions that are still placeholders should remain here.

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
