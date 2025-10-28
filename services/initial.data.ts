import type { User } from '../types';
import { AccountType, TransactionType, AssetType } from '../types';

export const initialDataForGerman = (uid: string, name: string, avatar: string, email: string): User => ({
    id: uid,
    name,
    email,
    avatar,
    teamIds: ["team-condo-1"],
    onboardingCompleted: true,
    accounts: [
        { id: 'g-chequing', name: 'G-Chequing', type: AccountType.CHECKING, balance: 2500, ownerIds: [uid] },
        { id: 'g-savings', name: 'G-Savings', type: AccountType.SAVINGS, balance: 10000, ownerIds: [uid] },
        { id: 'g-credit', name: 'G-Credit Card', type: AccountType.CREDIT_CARD, balance: 1200, ownerIds: [uid] },
    ],
    financialStatement: {
        transactions: [],
        assets: [
            { id: 'a-stock-ggal', name: 'Grupo Financiero Galicia', type: AssetType.STOCK, value: 5000, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 100, purchasePrice: 50 },
        ],
        liabilities: [
            { id: 'l-student-loan', name: 'Student Loan', balance: 15000, interestRate: 5, monthlyPayment: 300 },
        ],
    },
    budgets: [],
    goals: [],
    achievements: ['FIRST_TRANSACTION', 'FIRST_INVESTMENT'],
});

export const initialDataForValeria = (uid: string, name: string, avatar: string, email: string): User => ({
    id: uid,
    name,
    email,
    avatar,
    teamIds: ["team-condo-1"],
    onboardingCompleted: true,
    accounts: [
        { id: 'v-chequing', name: 'V-Chequing', type: AccountType.CHECKING, balance: 3200, ownerIds: [uid] },
        { id: 'v-tfsa', name: 'V-TFSA', type: AccountType.TFSA, balance: 8500, ownerIds: [uid] },
    ],
    financialStatement: {
        transactions: [],
        assets: [
             { id: 'a-stock-vfv', name: 'Vanguard S&P 500 ETF', type: AssetType.STOCK, value: 8500, monthlyCashflow: 0, ticker: 'VFV.TO', numberOfShares: 50, purchasePrice: 170 },
        ],
        liabilities: [],
    },
    budgets: [],
    goals: [],
    achievements: ['FIRST_INVESTMENT'],
});