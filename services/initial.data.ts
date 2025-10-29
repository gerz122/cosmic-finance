import type { User, Team, Transaction } from '../types';
import { AccountType, TransactionType, AssetType } from '../types';

// Helper to get a date within the current month
const getRecentDate = (day: number): string => {
    const date = new Date();
    date.setDate(day);
    return date.toISOString().split('T')[0];
};

export const initialDataForGerman = (uid: string, name: string, avatar: string, email: string): User => {
    const chequingId = 'g-chequing';
    const transactions: Omit<Transaction, 'id'>[] = [
        { description: 'Salary - Software Developer', amount: 5500, type: TransactionType.INCOME, category: 'Job', date: getRecentDate(1), paymentShares: [{ userId: uid, accountId: chequingId, amount: 5500 }], expenseShares: [] },
        { description: 'Mortgage Payment', amount: 1800, type: TransactionType.EXPENSE, category: 'Housing', date: getRecentDate(2), paymentShares: [{ userId: uid, accountId: chequingId, amount: 1800 }], expenseShares: [{ userId: uid, amount: 1800 }] },
        { description: 'Car Loan Payment', amount: 450, type: TransactionType.EXPENSE, category: 'Transportation', date: getRecentDate(3), paymentShares: [{ userId: uid, accountId: chequingId, amount: 450 }], expenseShares: [{ userId: uid, amount: 450 }] },
        { description: 'Student Loan Payment', amount: 300, type: TransactionType.EXPENSE, category: 'Loan', date: getRecentDate(4), paymentShares: [{ userId: uid, accountId: chequingId, amount: 300 }], expenseShares: [{ userId: uid, amount: 300 }] },
        { description: 'Groceries', amount: 400, type: TransactionType.EXPENSE, category: 'Food', date: getRecentDate(5), paymentShares: [{ userId: uid, accountId: chequingId, amount: 400 }], expenseShares: [{ userId: uid, amount: 400 }] },
        { description: 'Utilities (Hydro, Internet)', amount: 150, type: TransactionType.EXPENSE, category: 'Utilities', date: getRecentDate(8), paymentShares: [{ userId: uid, accountId: chequingId, amount: 150 }], expenseShares: [{ userId: uid, amount: 150 }] },
        { description: 'Dinner with Friends', amount: 120, type: TransactionType.EXPENSE, category: 'Entertainment', date: getRecentDate(10), paymentShares: [{ userId: uid, accountId: chequingId, amount: 120 }], expenseShares: [{ userId: uid, amount: 120 }] },
    ];
    
    return {
        id: uid,
        name,
        email,
        avatar,
        teamIds: ["team-condo-1"],
        onboardingCompleted: true,
        accounts: [
            { id: chequingId, name: 'G-Chequing', type: AccountType.CHECKING, balance: 3500, ownerIds: [uid] },
            { id: 'g-savings', name: 'G-Savings', type: AccountType.SAVINGS, balance: 12000, ownerIds: [uid] },
            { id: 'g-credit', name: 'G-Credit Card', type: AccountType.CREDIT_CARD, balance: 1500, ownerIds: [uid] },
        ],
        financialStatement: {
            transactions: transactions as Transaction[],
            assets: [
                { id: 'a-stock-ggal', name: 'Grupo Financiero Galicia', type: AssetType.STOCK, value: 5000, monthlyCashflow: 0, ticker: 'GGAL', numberOfShares: 100, purchasePrice: 50 },
                { id: 'a-residence', name: 'Primary Residence', type: AssetType.REAL_ESTATE, value: 400000, monthlyCashflow: 0 },
                { id: 'a-car', name: 'Personal Vehicle', type: AssetType.OTHER, value: 20000, monthlyCashflow: 0 },
            ],
            liabilities: [
                { id: 'l-mortgage', name: 'Home Mortgage', balance: 320000, interestRate: 4.5, monthlyPayment: 1800 },
                { id: 'l-car-loan', name: 'Car Loan', balance: 15000, interestRate: 6, monthlyPayment: 450 },
                { id: 'l-student-loan', name: 'Student Loan', balance: 15000, interestRate: 5, monthlyPayment: 300 },
            ],
        },
        budgets: [],
        goals: [],
        achievements: ['FIRST_TRANSACTION', 'FIRST_INVESTMENT'],
    };
};

export const initialDataForValeria = (uid: string, name: string, avatar: string, email: string): User => {
    const chequingId = 'v-chequing';
    const transactions: Omit<Transaction, 'id'>[] = [
        { description: 'Salary - Marketing Manager', amount: 4800, type: TransactionType.INCOME, category: 'Job', date: getRecentDate(1), paymentShares: [{ userId: uid, accountId: chequingId, amount: 4800 }], expenseShares: [] },
        { description: 'Rent Payment', amount: 1600, type: TransactionType.EXPENSE, category: 'Housing', date: getRecentDate(2), paymentShares: [{ userId: uid, accountId: chequingId, amount: 1600 }], expenseShares: [{ userId: uid, amount: 1600 }] },
        { description: 'Groceries', amount: 350, type: TransactionType.EXPENSE, category: 'Food', date: getRecentDate(5), paymentShares: [{ userId: uid, accountId: chequingId, amount: 350 }], expenseShares: [{ userId: uid, amount: 350 }] },
        { description: 'Utilities', amount: 120, type: TransactionType.EXPENSE, category: 'Utilities', date: getRecentDate(8), paymentShares: [{ userId: uid, accountId: chequingId, amount: 120 }], expenseShares: [{ userId: uid, amount: 120 }] },
        { description: 'Shopping', amount: 250, type: TransactionType.EXPENSE, category: 'Shopping', date: getRecentDate(12), paymentShares: [{ userId: uid, accountId: chequingId, amount: 250 }], expenseShares: [{ userId: uid, amount: 250 }] },
    ];

    return {
        id: uid,
        name,
        email,
        avatar,
        teamIds: ["team-condo-1"],
        onboardingCompleted: true,
        accounts: [
            { id: chequingId, name: 'V-Chequing', type: AccountType.CHECKING, balance: 2800, ownerIds: [uid] },
            { id: 'v-tfsa', name: 'V-TFSA', type: AccountType.TFSA, balance: 10000, ownerIds: [uid] },
            { id: 'v-credit', name: 'V-Credit Card', type: AccountType.CREDIT_CARD, balance: 500, ownerIds: [uid] },
        ],
        financialStatement: {
            transactions: transactions as Transaction[],
            assets: [
                { id: 'a-stock-vfv', name: 'Vanguard S&P 500 ETF', type: AssetType.STOCK, value: 10000, monthlyCashflow: 0, ticker: 'VFV.TO', numberOfShares: 50, purchasePrice: 200 },
            ],
            liabilities: [],
        },
        budgets: [],
        goals: [],
        achievements: ['FIRST_INVESTMENT'],
    };
};

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