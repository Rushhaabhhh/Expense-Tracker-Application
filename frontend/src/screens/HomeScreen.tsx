import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Plus, List, BarChart3, AlertCircle, DollarSign } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { expenseAPI } from '../services/api';
import { MonthlySummary } from '../types';

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadSummary();
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await expenseAPI.getMonthlySummary();
      setSummary(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSummary();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['authToken', 'user', 'expensesCache', 'summaryCache']);
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }] 
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const budgetPercentage = summary ? summary.percentageUsed : 0;
  const isOverBudget = budgetPercentage > 100;
  const isNearBudget = budgetPercentage > 80 && budgetPercentage <= 100;

  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name}!</Text>
              <Text style={styles.date}>
                {summary ? `${getMonthName(summary.month)} ${summary.year}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <LogOut size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* ✅ Budget Card - SWAPPED CONTENTS */}
          <View style={[
            styles.budgetCard,
            isOverBudget && styles.budgetCardWarning
          ]}>
            <View style={styles.budgetHeader}>
              <DollarSign size={20} color="#64748b" />
              <Text style={styles.budgetLabel}>Remaining</Text>
            </View>
            
            {/* ✅ SWAPPED: Remaining → Big Display, Spent → Detail */}
            <Text style={styles.budgetAmount}>
              ₹{summary?.remaining?.toLocaleString() || '0'}
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressBar,
                {
                  width: `${Math.min(budgetPercentage, 100)}%`,
                  backgroundColor: isOverBudget ? '#f87171' : 
                                  isNearBudget ? '#f59e0b' : '#10b981',
                }
              ]} />
            </View>

            <View style={styles.budgetDetails}>
              <View>
                <Text style={styles.detailLabel}>Spent</Text>
                <Text style={[
                  styles.detailValue,
                  isOverBudget && styles.negativeValue
                ]}>
                  ₹{summary?.totalSpent?.toLocaleString() || '0'}
                </Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Monthly Budget</Text>
                <Text style={styles.detailValue}>
                  ₹{summary?.budget?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>

            {(isOverBudget || isNearBudget) && (
              <View style={styles.warningContainer}>
                <AlertCircle size={20} color="#f59e0b" style={styles.warningIcon} />
                <Text style={styles.warningText}>
                  {isOverBudget ? "You've exceeded your budget!" : "You're near your budget limit"}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddExpense')}
              activeOpacity={0.9}
            >
              <View style={styles.actionIconContainer}>
                <Plus size={24} color="white" />
              </View>
              <Text style={styles.actionLabel}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonSecondary]}
              onPress={() => navigation.navigate('ExpenseList')}
              activeOpacity={0.9}
            >
              <View style={[styles.actionIconContainer, styles.actionIconSecondary]}>
                <List size={24} color="white" />
              </View>
              <Text style={styles.actionLabel}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>This Month</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Total Expenses</Text>
              <View style={styles.statsValueContainer}>
                <Text style={styles.statsValue}>
                  {summary?.expenseCount || 0}
                </Text>
                <BarChart3 size={24} color="#3b82f6" />
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

// Updated Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  date: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ✅ NEW Budget Header
  budgetCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  budgetCardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: 'rgba(245, 158, 11, 0.2)',
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginLeft: 12,
  },
  budgetAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 24,
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
  },
  negativeValue: {
    color: '#ef4444',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(254, 243, 199, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningIcon: { marginRight: 12 },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 24,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtonSecondary: {
    marginRight: 0,
    marginLeft: 12,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#10b981',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconSecondary: {
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
  },
  actionLabel: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1e293b',
    marginRight: 8,
  },
});

export default HomeScreen;
