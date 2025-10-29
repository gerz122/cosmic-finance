import type { User, Team } from '../types';
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

export const getInitialTeamData = (memberUids: string[]): Omit<Team, 'id'> => ({
    name: 'Condo Project',
    memberIds: memberUids,
    accounts: [
        { id: 't-condo-chequing', name: 'Condo Joint Chequing', type: AccountType.CHECKING, balance: 500, ownerIds: memberUids, teamId: 'team-condo-1' }
    ],
    financialStatement: {
        transactions: [],
        assets: [
            { id: 't-asset-condo', name: 'Investment Condo', type: AssetType.REAL_ESTATE, value: 250000, monthlyCashflow: 1500, teamId: 'team-condo-1' }
        ],
        liabilities: [
            { id: 't-lia-mortgage', name: 'Condo Mortgage', balance: 200000, interestRate: 3.5, monthlyPayment: 990, teamId: 'team-condo-1' }
        ]
    },
    goals: [
        { description: 'Pay off 10% of mortgage', target: 20000, current: 0 }
    ]
});
