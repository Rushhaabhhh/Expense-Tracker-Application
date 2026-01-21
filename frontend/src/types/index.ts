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