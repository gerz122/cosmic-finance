export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

// New: Account Type Enum
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

// New: Account Interface
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  ownerIds: string[]; // Changed from ownerId to support multiple owners
  teamId?: string; // Accounts can belong to a team
  sharedWith?: string[]; // user IDs
}


export interface Share {
  userId: string;
  percentage: number; // Use percentage for assets/liabilities
}

// New: Defines who paid what, and from which account
export interface PaymentShare {
  userId: string;
  accountId: string;
  amount: number;
}

// New: Defines how an expense is split among users
export interface ExpenseShare {
  userId: string;
  amount: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number; // Total amount of the transaction
  type: TransactionType;
  category: string;
  date: string;
  isPassive?: boolean;
  teamId?: string; // Transactions can belong to a team
  receiptUrl?: string; // For uploading receipts

  // New: Advanced shared transaction details
  paymentShares: PaymentShare[]; // Who paid what from where. For INCOME, this is who received what.
  expenseShares?: ExpenseShare[]; // How an EXPENSE is split. Not applicable for INCOME.
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
  value: number; // Current market value
  monthlyCashflow: number;
  teamId?: string; // Assets can belong to a team
  shares?: Share[]; // For shared ownership
  
  // Stock specific fields
  ticker?: string;
  numberOfShares?: number;
  purchasePrice?: number;
  takeProfit?: number; // Optional TP price
  stopLoss?: number;   // Optional SL price
  strategy?: string;   // Optional user-defined strategy or notes
}


export interface Liability {
  id:string;
  name: string;
  balance: number; // This should be a positive number
  interestRate: number;
  monthlyPayment: number;
  teamId?: string; // Liabilities can belong to a team
  shares?: Share[]; // For shared ownership
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
  accounts: Account[]; // User's personal accounts
  teamIds?: string[]; // IDs of teams the user is a member of
}

// A Team is a financial entity like a business or project
export interface Team {
  id: string;
  name: string;
  memberIds: string[];
  financialStatement: FinancialStatement;
  accounts: Account[]; // Teams have their own accounts
  goals: {
    description: string;
    target: number;
    current: number;
  }[];
}

export type View = 'dashboard' | 'statement' | 'portfolio' | 'accounts' | 'teams' | 'coach' | 'team-detail' | 'balances';

// Types for the new Cosmic Event feature
export interface EventOutcome {
    message: string;
    cashChange?: number; // This will now affect a user's primary cash account
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

export interface HistoricalDataPoint {
    date: string;
    value: number;
}