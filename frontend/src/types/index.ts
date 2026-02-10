export interface User {
  id: string;
  email: string;
  name: string;
  monthlyBudget: number;
}

export interface Expense {
  _id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  date: string;
  createdAt: string;
  source?: string;
  clientExpenseId?: string;
  importHash?: string;
}

export type ExpenseCategory = 
  | 'Food' 
  | 'Travel' 
  | 'Entertainment' 
  | 'Shopping' 
  | 'Bills' 
  | 'Education' 
  | 'Health' 
  | 'Misc';

export interface MonthlySummary {
  month: number;
  year: number;
  totalSpent: number;
  budget: number;
  remaining: number;
  percentageUsed: number;
  categoryBreakdown: { [key: string]: number };
  expenseCount: number;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface BankImportTransaction {
  clientExpenseId: string;
  amount: number;
  date: string;
  description: string;
  category: ExpenseCategory;
  source: 'BANK_CSV';
  isDuplicate?: boolean;
}

export interface BankImportParseResponse {
  transactions: BankImportTransaction[];
  skipped: { row: number; reason: string }[];
  summary: {
    totalRows: number;
    validDebits: number;
    duplicates: number;
    skipped: number;
  };
}

export interface BankImportConfirmResponse {
  importedCount: number;
  skippedDuplicates: number;
  totalSelected: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface ChatResponse {
  message: string;
  reply: string;
  timestamp: string;
}