import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { bankImportAPI } from '../services/api';
import { BankImportParseResponse, BankImportTransaction } from '../types';

const ImportBankScreen = () => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<BankImportTransaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<BankImportParseResponse['summary'] | null>(null);
  const [importResult, setImportResult] = useState<{
    importedCount: number;
    skippedDuplicates: number;
    totalSelected: number;
  } | null>(null);

  const selectedCount = selectedIds.size;

  const pickCsvFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
        multiple: false,
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled || !result.assets?.length) {
        console.log('Document picker was canceled or no assets');
        return;
      }

      const asset = result.assets[0];
      console.log('Selected file:', {
        name: asset.name,
        uri: asset.uri,
        mimeType: asset.mimeType,
        size: asset.size,
      });

      setFileName(asset.name || 'bank-statement.csv');
      setImportResult(null);
      setLoading(true);

      try {
        const response = await bankImportAPI.parseCsv({
          uri: asset.uri,
          name: asset.name || 'bank-statement.csv',
          mimeType: asset.mimeType || 'text/csv',
        });

        console.log('Parse response:', response);
        setTransactions(response.transactions);
        setSummary(response.summary);

        const defaultSelected = new Set(
          response.transactions
            .filter((txn) => !txn.isDuplicate)
            .map((txn) => txn.clientExpenseId)
        );
        setSelectedIds(defaultSelected);
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        console.error('API Error Response:', apiError.response);
        console.error('API Error Data:', apiError.response?.data);
        throw apiError;
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unable to parse CSV file';
      Alert.alert('Import Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedTransactions = useMemo(
    () => transactions.filter((txn) => selectedIds.has(txn.clientExpenseId)),
    [transactions, selectedIds]
  );

  const confirmImport = async () => {
    if (selectedTransactions.length === 0) {
      Alert.alert('No Selection', 'Select at least one transaction to import.');
      return;
    }

    setLoading(true);
    try {
      const result = await bankImportAPI.confirmImport(selectedTransactions);
      setImportResult(result);
    } catch (error: any) {
      Alert.alert('Import Failed', error.response?.data?.message || 'Unable to import transactions');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: BankImportTransaction }) => {
    const isSelected = selectedIds.has(item.clientExpenseId);
    const isDuplicate = Boolean(item.isDuplicate);

    return (
      <TouchableOpacity
        style={[styles.transactionRow, isDuplicate && styles.transactionRowDuplicate]}
        onPress={() => toggleSelection(item.clientExpenseId)}
        activeOpacity={0.8}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected ? <Text style={styles.checkboxText}>✓</Text> : null}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionMeta}>
            {new Date(item.date).toLocaleDateString()} • {item.category}
          </Text>
        </View>
        <View style={styles.transactionAmountBlock}>
          <Text style={styles.transactionAmount}>₹{item.amount.toFixed(2)}</Text>
          {isDuplicate ? <Text style={styles.duplicateTag}>Duplicate</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Import from Bank</Text>
        <Text style={styles.subtitle}>Upload a CSV file and review before saving.</Text>
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={pickCsvFile} activeOpacity={0.9}>
        <Text style={styles.uploadButtonText}>{fileName ? 'Replace CSV' : 'Select CSV File'}</Text>
      </TouchableOpacity>

      {fileName ? <Text style={styles.fileName}>{fileName}</Text> : null}

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {summary ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Preview Summary</Text>
          <Text style={styles.summaryText}>Rows: {summary.totalRows}</Text>
          <Text style={styles.summaryText}>Valid debits: {summary.validDebits}</Text>
          <Text style={styles.summaryText}>Duplicates: {summary.duplicates}</Text>
          <Text style={styles.summaryText}>Skipped: {summary.skipped}</Text>
        </View>
      ) : null}

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.clientExpenseId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Select a CSV file to preview debit transactions.
          </Text>
        }
      />

      {transactions.length > 0 ? (
        <View style={styles.footer}>
          <Text style={styles.selectionText}>Selected: {selectedCount}</Text>
          <TouchableOpacity
            style={[styles.importButton, selectedCount === 0 && styles.importButtonDisabled]}
            onPress={confirmImport}
            disabled={selectedCount === 0 || loading}
          >
            <Text style={styles.importButtonText}>Import Selected</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {importResult ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Import Result</Text>
          <Text style={styles.resultText}>Imported: {importResult.importedCount}</Text>
          <Text style={styles.resultText}>Skipped duplicates: {importResult.skippedDuplicates}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 6 },
  uploadButton: {
    marginHorizontal: 24,
    marginBottom: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadButtonText: { color: 'white', fontWeight: '700' },
  fileName: { marginHorizontal: 24, marginBottom: 12, color: '#475569' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, marginBottom: 8 },
  loadingText: { marginLeft: 8, color: '#64748b' },
  summaryCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryTitle: { fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  summaryText: { color: '#475569', fontSize: 13 },
  listContent: { paddingHorizontal: 24, paddingBottom: 24 },
  emptyText: { color: '#94a3b8', textAlign: 'center', marginTop: 24 },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transactionRowDuplicate: { opacity: 0.6 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxText: { color: 'white', fontWeight: '700' },
  transactionInfo: { flex: 1 },
  transactionDescription: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  transactionMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  transactionAmountBlock: { alignItems: 'flex-end', marginLeft: 8 },
  transactionAmount: { fontWeight: '800', color: '#1e293b' },
  duplicateTag: { fontSize: 10, color: '#ef4444', marginTop: 4 },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  selectionText: { color: '#475569', marginBottom: 8 },
  importButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  importButtonDisabled: { backgroundColor: '#9ca3af' },
  importButtonText: { color: 'white', fontWeight: '800' },
  resultCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultTitle: { fontWeight: '800', color: '#047857', marginBottom: 6 },
  resultText: { color: '#047857' },
});

export default ImportBankScreen;
