export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum AccountType {
  CASH = 'Cash',
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT_CARD = 'Credit Card',
  INVESTMENT = 'Investment',
  LOAN = 'Loan',
  TFSA = 'TFSA',
  RRSP = 'RRSP',
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  ownerIds: string[];
  teamId?: string;
  sharedWith?: string[];
  shares?: Share[];
  importBatchId?: string;
}

export interface Share {
  userId: string;
  percentage: number;
}

export interface PaymentShare {
  userId: string;
  accountId: string;
  amount: number;
}

export interface ExpenseShare {
  userId: string;
  amount: number;
}

export type SplitMode = 'equal' | 'amount' | 'percentage';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isPassive?: boolean;
  teamId?: string;
  receiptUrl?: string;
  paymentShares: PaymentShare[];
  expenseShares?: ExpenseShare[];
  isTaxDeductible?: boolean;
  importBatchId?: string;
}

export enum AssetType {
  STOCK = 'Stock',
  REAL_ESTATE = 'Real Estate',
  BUSINESS = 'Business',
  OTHER = 'Other',
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  monthlyCashflow: number;
  teamId?: string;
  shares?: Share[];
  ticker?: string;
  numberOfShares?: number;
  purchasePrice?: number;
  takeProfit?: number;
  stopLoss?: number;
  strategy?: string;
}

export interface Liability {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  teamId?: string;
  shares?: Share[];
}

export interface FinancialStatement {
  transactions: Transaction[];
  assets: Asset[];
  liabilities: Liability[];
}

// New: Budgeting interfaces
export type BudgetCategory = 'Housing' | 'Food' | 'Transportation' | 'Entertainment' | 'Utilities' | 'Shopping' | 'Business Expense' | 'Maintenance' | 'Other' | 'Goals' | 'Job' | 'Investment' | 'Loan' | 'Team Contribution' | 'Transfer' | 'Cosmic Event' | 'Initial Balance' | 'Rental' | 'Mortgage' | 'Business Income';

export interface Budget {
    month: string; // "YYYY-MM" format
    limits: Partial<Record<BudgetCategory, number>>;
}

// New: Financial Goal interface
export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: React.FC<{ className?: string }>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  financialStatement: FinancialStatement;
  accounts: Account[];
  teamIds: string[];
  budgets: Budget[];
  goals: Goal[];
  achievements: string[];
  onboardingCompleted?: boolean;
}

export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  financialStatement: FinancialStatement;
  accounts: Account[];
  goals: {
    description: string;
    target: number;
    current: number;
  }[];
}

export type View = 'dashboard' | 'statement' | 'portfolio' | 'accounts' | 'teams' | 'coach' | 'team-detail' | 'balances' | 'budget' | 'goals' | 'history' | 'achievements' | 'importer' | 'auth' | 'data';

export interface EventOutcome {
  message: string;
  cashChange?: number;
  newAsset?: Omit<Asset, 'id'>;
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

// For charts
export interface HistoricalDataPoint {
  date: string; // YYYY-MM-DD
  [key: string]: number | string; // e.g., { date: '2023-01-01', netWorth: 5000 }
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface AppTask {
  id: string;
  name: string;
  status: 'processing' | 'success' | 'failed';
  error?: string;
  createdAt: number;
  onRetry?: () => void;
  result?: any;
}