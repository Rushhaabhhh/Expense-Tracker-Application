import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart3, Calendar } from 'lucide-react-native';
import { expenseAPI } from '../services/api';
import { MonthlySummary, ExpenseCategory } from '../types';

const { width } = Dimensions.get('window');

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  Food: '#F87171',
  Travel: '#0EA5E9',
  Entertainment: '#F59E0B',
  Shopping: '#10B981',
  Bills: '#6B7280',
  Education: '#8B5CF6',
  Health: '#0D9488',
  Misc: '#9CA3AF',
};

const MonthlyReportScreen = () => {
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

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  const categoryData = summary
    ? Object.entries(summary.categoryBreakdown).map(([category, amount]) => ({
        category: category as ExpenseCategory,
        amount,
        percentage: summary.totalSpent > 0 ? (amount / summary.totalSpent) * 100 : 0,
      })).sort((a, b) => b.amount - a.amount)
    : [];

  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <BarChart3 size={24} color="white" />
            </View>
            <View>
              <Text style={styles.title}>Monthly Report</Text>
              <Text style={styles.subtitle}>
                {summary ? `${getMonthName(summary.month)} ${summary.year}` : ''}
              </Text>
            </View>
          </View>

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryAmount}>
                ₹{summary?.totalSpent?.toLocaleString() || '0'}
              </Text>
            </View>
            
            <View style={styles.summaryDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Budget</Text>
                <Text style={styles.detailValue}>
                  ₹{summary?.budget?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remaining</Text>
                <Text style={[
                  styles.detailValue,
                  (summary?.remaining || 0) < 0 && styles.negativeValue
                ]}>
                  ₹{summary?.remaining?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Items</Text>
                <Text style={styles.detailValue}>
                  {summary?.expenseCount || 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.categoryCard}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            
            {categoryData.length > 0 ? (
              categoryData.map(({ category, amount, percentage }, index) => {
                const color = CATEGORY_COLORS[category];
                return (
                  <View key={category} style={[
                    styles.categoryItem,
                    index === categoryData.length - 1 && styles.lastCategoryItem
                  ]}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryDotContainer}>
                        <View style={[styles.categoryDot, { backgroundColor: color }]} />
                        <Text style={styles.categoryName}>{category}</Text>
                      </View>
                      <Text style={styles.categoryAmount}>
                        ₹{amount.toLocaleString()}
                      </Text>
                    </View>
                    
                    <View style={styles.progressContainer}>
                      <View style={[
                        styles.progressBar,
                        { 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: color 
                        }
                      ]} />
                    </View>
                    
                    <Text style={styles.categoryPercentage}>
                      {percentage.toFixed(1)}% of total
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color="#d1d5db" style={styles.emptyIcon} />
                <Text style={styles.emptyTitle}>No expenses</Text>
                <Text style={styles.emptySubtitle}>
                  No spending data available for this month
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1e293b',
  },
  summaryDetails: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
  },
  negativeValue: {
    color: '#ef4444',
  },
  categoryCard: {
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 32,
  },
  categoryItem: {
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastCategoryItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryDotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
    flex: 1,
  },
  categoryAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  categoryPercentage: {
    textAlign: 'right',
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default MonthlyReportScreen;
