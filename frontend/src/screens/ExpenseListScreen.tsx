import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Filter,
  Utensils,
  MapPin,
  Film,
  ShoppingBag,
  FileText,
  BookOpen,
  HeartPulse,
  MoreHorizontal,
} from 'lucide-react-native';
import { expenseAPI } from '../services/api';
import { Expense } from '../types';
import { ExpenseCategory } from '../types';

const CATEGORY_ICONS: Record<ExpenseCategory, any> = {
  Food: Utensils,
  Travel: MapPin,
  Entertainment: Film,
  Shopping: ShoppingBag,
  Bills: FileText,
  Education: BookOpen,
  Health: HeartPulse,
  Misc: MoreHorizontal,
};

const ExpenseListScreen = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseAPI.getExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await expenseAPI.deleteExpense(id);
            setExpenses(prev => prev.filter(exp => exp._id !== id));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => {
    const IconComponent = CATEGORY_ICONS[item.category as ExpenseCategory];
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;

    return (
      <View style={styles.expenseItem}>
        <TouchableOpacity
          style={styles.expenseCard}
          onLongPress={() => handleDelete(item._id)}
          activeOpacity={0.9}
        >
          <View style={styles.expenseIcon}>
            <IconComponent size={20} color="#6b7280" />
          </View>
          
          <View style={styles.details}>
            <Text style={styles.category}>{item.category}</Text>
            {item.note ? (
              <Text style={styles.note} numberOfLines={1}>{item.note}</Text>
            ) : null}
            <Text style={styles.date}>{formatDate(item.date)}</Text>
          </View>
          
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>₹{item.amount.toFixed(0)}</Text>
            <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // ... rest of component remains same (loading, empty state, etc.)
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Filter size={48} color="#d1d5db" />
      </View>
      <Text style={styles.emptyTitle}>No expenses yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your spending by adding your first expense
      </Text>
    </View>
  );

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading expenses...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>₹{totalAmount.toFixed(0)}</Text>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

// Styles unchanged from previous version
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6b7280', fontWeight: '500' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: '#1e293b' },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  totalLabel: { fontSize: 14, color: '#6b7280', marginBottom: 4, fontWeight: '500' },
  totalAmount: { fontSize: 36, fontWeight: '900', color: '#1e293b' },
  listContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  expenseItem: { marginBottom: 16 },
  expenseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  expenseIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  details: { flex: 1, paddingRight: 16 },
  category: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  note: { fontSize: 14, color: '#6b7280', marginBottom: 8, lineHeight: 20 },
  date: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  amountContainer: { alignItems: 'flex-end' },
  amount: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  percentage: { fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center', lineHeight: 24, fontWeight: '500' },
});

export default ExpenseListScreen;
