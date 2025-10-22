
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

// Types for the new Cosmic Event feature
export interface EventOutcome {
    message: string;
    cashChange?: number;
    newAsset?: Omit<Asset, 'id'>;
    // Future outcomes like new liabilities, etc., can be added here
}

export interface EventChoice {
    text: string;
    outcome: EventOutcome;
}

export interface CosmicEvent {
    title: string;
    description: string;
    choices: EventChoice[];
}
