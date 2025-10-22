
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isPassive?: boolean;
}

export enum AssetType {
  STOCK = 'STOCK',
  REAL_ESTATE = 'REAL_ESTATE',
  CASH = 'CASH',
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  monthlyCashflow: number;
}

export interface Liability {
  id:string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
}

export interface FinancialStatement {
  transactions: Transaction[];
  assets: Asset[];
  liabilities: Liability[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  financialStatement: FinancialStatement;
}

export interface Team {
  id: string;
  name: string;
  members: User[];
  financialStatement: FinancialStatement;
  goals: {
    description: string;
    target: number;
    current: number;
  }[];
}

export type View = 'dashboard' | 'statement' | 'portfolio' | 'teams' | 'coach';
