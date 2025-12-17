import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { databaseService } from '../services/database';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#ff6b6b',
  Transport: '#4ecdc4',
  Shopping: '#ffe66d',
  Bills: '#95e1d3',
  Entertainment: '#c7ceea',
  Healthcare: '#ff8b94',
  Education: '#a8d8ea',
  Investment: '#aa96da',
  Salary: '#fcbad3',
  Business: '#a1de93',
  Other: '#9ca3af',
};

export default function FinanceScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await databaseService.getTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const deleteTransaction = (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await databaseService.deleteTransaction(id);
            setTransactions((prev) => prev.filter((t) => t.id !== id));
          } catch (error) {
            console.error('Error deleting transaction:', error);
          }
        },
      },
    ]);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.transactionItem}
      onLongPress={() => deleteTransaction(item.id)}
    >
      <View
        style={[
          styles.categoryBadge,
          { backgroundColor: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other },
        ]}
      >
        <Text style={styles.categoryText}>{item.category[0]}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.categoryName}>{item.category}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          { color: item.type === 'income' ? '#10b981' : '#ef4444' },
        ]}
      >
        {item.type === 'income' ? '+' : '-'}₹{item.amount}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Finance</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>₹{totalIncome}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Expense</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>₹{totalExpense}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: balance >= 0 ? '#10b98133' : '#ef444433' }]}>
          <Text style={styles.statLabel}>Balance</Text>
          <Text style={[styles.statValue, { color: balance >= 0 ? '#10b981' : '#ef4444' }]}>
            ₹{balance}
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'income', 'expense'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.filterButton,
              filter === type && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(type)}
          >
            <Text
              style={[
                styles.filterText,
                filter === type && styles.filterTextActive,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  categoryName: {
    color: '#1f2937',
    fontWeight: '500',
    fontSize: 14,
  },
  description: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
