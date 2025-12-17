import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { databaseService } from '../services/database';
import { geminiService } from '../services/geminiService';

export default function InsightsScreen() {
  const [financialInsights, setFinancialInsights] = useState('');
  const [moodInsights, setMoodInsights] = useState('');
  const [scheduleInsights, setScheduleInsights] = useState('');
  const [dailyQuote, setDailyQuote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      setLoading(true);

      const [transactions, journalEntries, schedules] = await Promise.all([
        databaseService.getTransactions(),
        databaseService.getJournalEntries(),
        databaseService.getSchedules(),
      ]);

      const [financial, mood, schedule, quote] = await Promise.all([
        geminiService.analyzeFinancialHealth(transactions),
        geminiService.analyzeMoodTrends(journalEntries),
        geminiService.getScheduleInsights(schedules),
        geminiService.generateDailyQuote(),
      ]);

      setFinancialInsights(financial);
      setMoodInsights(mood);
      setScheduleInsights(schedule);
      setDailyQuote(quote);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Generating insights...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>✨ Insights</Text>
        <TouchableOpacity onPress={loadInsights}>
          <Text style={styles.refreshButton}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Quote */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>💡</Text>
          <Text style={styles.cardTitle}>Daily Inspiration</Text>
          <Text style={styles.cardContent}>{dailyQuote}</Text>
        </View>

        {/* Financial Insights */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>💰</Text>
          <Text style={styles.cardTitle}>Financial Health</Text>
          <Text style={styles.cardContent}>{financialInsights}</Text>
        </View>

        {/* Mood Insights */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>🧘</Text>
          <Text style={styles.cardTitle}>Wellness Insights</Text>
          <Text style={styles.cardContent}>{moodInsights}</Text>
        </View>

        {/* Schedule Insights */}
        <View style={styles.card}>
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardTitle}>Schedule Tips</Text>
          <Text style={styles.cardContent}>{scheduleInsights}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  refreshButton: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});
