import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
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
import { ExpenseCategory } from '../types';

const CATEGORIES = [
  { id: 'Food' as ExpenseCategory, label: 'Food', Icon: Utensils, bgColor: '#FEE2E2', textColor: '#DC2626' },
  { id: 'Travel' as ExpenseCategory, label: 'Travel', Icon: MapPin, bgColor: '#DBEAFE', textColor: '#0EA5E9' },
  { id: 'Entertainment' as ExpenseCategory, label: 'Entertainment', Icon: Film, bgColor: '#FEF3C7', textColor: '#D97706' },
  { id: 'Shopping' as ExpenseCategory, label: 'Shopping', Icon: ShoppingBag, bgColor: '#D1FAE5', textColor: '#059669' },
  { id: 'Bills' as ExpenseCategory, label: 'Bills', Icon: FileText, bgColor: '#F1F5F9', textColor: '#475569' },
  { id: 'Education' as ExpenseCategory, label: 'Education', Icon: BookOpen, bgColor: '#EDE9FE', textColor: '#8B5CF6' },
  { id: 'Health' as ExpenseCategory, label: 'Health', Icon: HeartPulse, bgColor: '#CCFBF1', textColor: '#0D9488' },
  { id: 'Misc' as ExpenseCategory, label: 'Misc', Icon: MoreHorizontal, bgColor: '#F3F4F6', textColor: '#6B7280' },
];

interface CategoryItem {
  id: ExpenseCategory;
  label: string;
  Icon: any;
  bgColor: string;
  textColor: string;
}

const AddExpenseScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryItem>(CATEGORIES[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await expenseAPI.createExpense(parseFloat(amount), category.id, note, new Date());
      Alert.alert('Success', 'Expense added!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
      <ScrollView 
        style={styles.scroll} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Add Expense</Text>
          <Text style={styles.subtitle}>Track your spending</Text>

          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInput}>
              <TextInput
                style={styles.amountText}
                placeholder="0.00"
                placeholderTextColor="#94a3b8"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.label}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {CATEGORIES.map((cat) => {
                const isActive = category.id === cat.id;
                const IconComponent = cat.Icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryButton,
                      isActive && styles.categoryButtonActive,
                      { borderColor: isActive ? '#3B82F6' : '#E2E8F0' }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <View style={[
                      styles.categoryIcon,
                      isActive && { backgroundColor: cat.bgColor }
                    ]}>
                      <IconComponent 
                        size={24} 
                        color={isActive ? cat.textColor : '#64748b'} 
                      />
                    </View>
                    <Text style={[
                      styles.categoryLabel,
                      isActive && { color: cat.textColor }
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.label}>Note (optional)</Text>
            <View style={styles.noteInput}>
              <TextInput
                style={styles.noteText}
                placeholder="What did you spend on?"
                placeholderTextColor="#94a3b8"
                value={note}
                onChangeText={setNote}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

// Styles remain the same (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  content: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 18, fontWeight: '500', color: '#64748b', marginBottom: 40 },
  section: { marginBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 16 },
  amountInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  amountText: { fontSize: 36, fontWeight: '900', color: '#1e293b', textAlign: 'center' },
  categoryScroll: { flexDirection: 'row' },
  categoryScrollContent: { paddingHorizontal: 8 },
  categoryButton: {
    width: 96,
    height: 80,
    borderWidth: 2,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
  },
  categoryLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  noteInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: 96,
  },
  noteText: { fontSize: 16, fontWeight: '500', color: '#1e293b', lineHeight: 24 },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonDisabled: { backgroundColor: '#9ca3af', shadowOpacity: 0.1 },
  submitText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
});

export default AddExpenseScreen;
