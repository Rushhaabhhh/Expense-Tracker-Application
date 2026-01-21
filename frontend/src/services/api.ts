import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, Expense, MonthlySummary, ExpenseCategory } from '../types';

const API_URL = 'http://localhost:5000/api'; // Change to your backend URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token sent to:', config.url?.substring(config.url.lastIndexOf('/') + 1));
      } else {
        console.log('No authToken found - public request:', config.url);
      }
    } catch (error) {
      console.error('Token fetch error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Success:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status);
    if (error.response?.status === 401) {
      console.log('401 - Token invalid/expired');
    }
    return Promise.reject(error);
  }
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

  getExpenses: async (filters?: { 
    category?: string; 
    startDate?: string; 
    endDate?: string; 
    month?: number; 
    year?: number 
  }) => {
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