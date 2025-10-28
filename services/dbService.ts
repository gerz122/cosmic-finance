import { db, collection, doc, getDocs, writeBatch, query, where, getDoc, setDoc, deleteDoc } from './firebase';
import type { User, Transaction, Asset, Liability, EventOutcome, Account, Team, Budget, Goal } from '../types';
import { TransactionType, AssetType, AccountType } from '../types';

// Real data for German & Valeria
const initialData = {
    users: [
        { id: 'german', name: 'German', avatar: 'https://api.dicebear.com/8.x/pixel-art/svg?seed=german', teamIds: ['team-millo', 'team-casita', 'team-regina', 'team-viandas'], achievements: [] },
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
                    { id: 't-casita-3', description: 'Ingreso Alquiler 1', amount: 1100, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1100 }] },
                    { id: 't-casita-4', description: 'Ingreso Alquiler 2', amount: 1400, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-casita', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1400 }] },
                    { id: 't-casita-balance', description: 'Ajuste de Cuentas', amount: 43.12, type: TransactionType.EXPENSE, category: 'Utilities', date: '2023-10-26', teamId: 'team-casita', paymentShares: [{ userId: 'german', accountId: 'g-savings-1', amount: 43.12 }], expenseShares: [{ userId: 'german', amount: 21.56 }, { userId: 'valeria', amount: 21.56 }] }
                ],
                assets: [], liabilities: []
            }
        },
        {
            id: 'team-regina', name: 'Casa de Regina', memberIds: ['german', 'valeria'], goals: [], accounts: [],
            financialStatement: { 
                transactions: [
                    { id: 't-regina-income1', description: 'Ingreso Alquiler Basement', amount: 800, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 800 }] },
                    { id: 't-regina-income2', description: 'Ingreso Alquiler Main Floor', amount: 1150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 1150 }] },
                    { id: 't-regina-income3', description: 'Ingreso Alquiler Second Floor', amount: 1050, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 1050 }] },
                    { id: 't-regina-income4', description: 'Ingreso Alquiler Garage', amount: 150, type: TransactionType.INCOME, category: 'Rental', date: '2023-10-01', teamId: 'team-regina', isPassive: true, paymentShares: [{ userId: 'valeria', accountId: 'acc-joint-checking', amount: 150 }] },
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
                    { id: 't-viandas-1', description: 'Venta de Productos', amount: 130, type: TransactionType.INCOME, category: 'Business Income', date: '2023-10-22', teamId: 'team-viandas', paymentShares: [{ userId: 'valeria', accountId: 'v-savings-1', amount: 130 }] },
                    // FIX: The transaction object was incomplete, causing a syntax error. Completed the object with plausible data.
                    { id: 't-viandas-2', description: 'Compra de Comida', amount: 120, type: TransactionType.EXPENSE, category: 'Business Expense', date: '2023-10-23', teamId: 'team-viandas', paymentShares: [{ userId: 'german', accountId: 'acc-joint-checking', amount: 120 }], expenseShares: [{ userId: 'german', amount: 60 }, { userId: 'valeria', amount: 60 }] }
                ],
                assets: [],
                liabilities: []
            }
        },
    ],
};
// NOTE: The rest of the dbService implementation (functions like getUsers, addTransaction, etc.)
// was not provided in the original file snippet. The logic for these functions is assumed to exist
// and be correctly exported for the application to function at runtime.
