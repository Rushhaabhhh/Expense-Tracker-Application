import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { expenseAPI } from '../services/api';
import { MonthlySummary } from '../types';

const HomeScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSummary();
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const budgetPercentage = summary ? summary.percentageUsed : 0;
  const isOverBudget = budgetPercentage > 100;
  const isNearBudget = budgetPercentage > 80 && budgetPercentage <= 100;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name}!</Text>
          <Text style={styles.date}>
            {summary ? `${getMonthName(summary.month)} ${summary.year}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.budgetCard}>
        <Text style={styles.budgetTitle}>Monthly Budget</Text>
        <Text style={styles.budgetAmount}>₹{summary?.budget || 0}</Text>
        
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(budgetPercentage, 100)}%` },
              isOverBudget && styles.progressOverBudget,
              isNearBudget && styles.progressNearBudget,
            ]}
          />
        </View>

        <View style={styles.budgetDetails}>
          <View>
            <Text style={styles.detailLabel}>Spent</Text>
            <Text style={styles.detailValue}>₹{summary?.totalSpent || 0}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text style={[styles.detailValue, isOverBudget && styles.negativeValue]}>
              ₹{summary?.remaining || 0}
            </Text>
          </View>
        </View>

        {isOverBudget && (
          <Text style={styles.warningText}>⚠️ You've exceeded your budget!</Text>
        )}
        {isNearBudget && (
          <Text style={styles.warningText}>⚠️ You're near your budget limit</Text>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddExpense')}>
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionText}>Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ExpenseList')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>View All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('MonthlyReport')}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>This Month</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Total Expenses:</Text>
          <Text style={styles.statsValue}>{summary?.expenseCount || 0}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
  },
  budgetCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetTitle: {
    fontSize: 16,
    color: '#666',
  },
  budgetAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginVertical: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressNearBudget: {
    backgroundColor: '#FF9500',
  },
  progressOverBudget: {
    backgroundColor: '#FF3B30',
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
  },
  negativeValue: {
    color: '#FF3B30',
  },
  warningText: {
    marginTop: 15,
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 16,
    color: '#666',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default HomeScreen;