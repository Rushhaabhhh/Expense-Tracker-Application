import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Expense, MonthlySummary, ExpenseCategory } from '../types';

const API_URL = 'http://localhost:5000/api'; // Change to your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
  signup: async (email: string, password: string, name: string, monthlyBudget: number) => {
    const response = await api.post<AuthResponse>('/auth/signup', {
      email,
      password,
      name,
      monthlyBudget,
    });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateBudget: async (monthlyBudget: number) => {
    const response = await api.put('/auth/budget', { monthlyBudget });
    return response.data;
  },
};

// Expense APIs
export const expenseAPI = {
  createExpense: async (amount: number, category: ExpenseCategory, note: string, date: Date) => {
    const response = await api.post<{ expense: Expense }>('/expenses', {
      amount,
      category,
      note,
      date: date.toISOString(),
    });
    return response.data.expense;
  },

  getExpenses: async (filters?: { category?: string; month?: number; year?: number }) => {
    const response = await api.get<{ expenses: Expense[] }>('/expenses', {
      params: filters,
    });
    return response.data.expenses;
  },

  getExpenseById: async (id: string) => {
    const response = await api.get<{ expense: Expense }>(`/expenses/${id}`);
    return response.data.expense;
  },

  updateExpense: async (id: string, data: Partial<Expense>) => {
    const response = await api.put<{ expense: Expense }>(`/expenses/${id}`, data);
    return response.data.expense;
  },

  deleteExpense: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },

  getMonthlySummary: async (month?: number, year?: number) => {
    const response = await api.get<MonthlySummary>('/expenses/summary', {
      params: { month, year },
    });
    return response.data;
  },
};

export default api;