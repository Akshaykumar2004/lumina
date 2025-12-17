import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { databaseService } from '../services/database';

interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  date: Date;
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  energetic: '⚡',
  calm: '😌',
  neutral: '😐',
};

const MOOD_COLORS: Record<string, string> = {
  happy: '#fbbf24',
  sad: '#60a5fa',
  energetic: '#f87171',
  calm: '#86efac',
  neutral: '#d1d5db',
};

const MOODS = ['happy', 'sad', 'energetic', 'calm', 'neutral'] as const;

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('neutral');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await databaseService.getJournalEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await databaseService.deleteJournalEntry(id);
            setEntries((prev) => prev.filter((e) => e.id !== id));
          } catch (error) {
            console.error('Error deleting entry:', error);
          }
        },
      },
    ]);
  };

  const addEntry = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something');
      return;
    }

    try {
      await databaseService.addJournalEntry({
        content: content.trim(),
        mood: selectedMood,
        date: new Date(),
      });

      setContent('');
      setSelectedMood('neutral');
      setShowModal(false);
      loadEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add entry');
    }
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={styles.entryItem}
      onLongPress={() => deleteEntry(item.id)}
    >
      <View
        style={[
          styles.moodBadge,
          { backgroundColor: MOOD_COLORS[item.mood] || MOOD_COLORS.neutral },
        ]}
      >
        <Text style={styles.moodEmoji}>{MOOD_EMOJIS[item.mood] || '😐'}</Text>
      </View>
      <View style={styles.entryInfo}>
        <Text style={styles.date}>{item.date.toLocaleDateString('en-IN')}</Text>
        <Text style={styles.mood}>{item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}</Text>
        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const moodCounts = entries.reduce(
    (acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📔 Journal</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Entry</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>How are you feeling?</Text>
              <View style={styles.moodSelector}>
                {MOODS.map((mood) => (
                  <TouchableOpacity
                    key={mood}
                    style={[
                      styles.moodOption,
                      selectedMood === mood && styles.moodOptionSelected,
                      { backgroundColor: MOOD_COLORS[mood] },
                    ]}
                    onPress={() => setSelectedMood(mood)}
                  >
                    <Text style={styles.moodOptionEmoji}>{MOOD_EMOJIS[mood]}</Text>
                    <Text style={styles.moodOptionLabel}>{mood}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Your thoughts</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Write your thoughts, feelings, or reflections..."
                placeholderTextColor="#9ca3af"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={6}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={addEntry}
              >
                <Text style={styles.submitButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {Object.keys(moodCounts).length > 0 && (
        <View style={styles.moodStatsContainer}>
          {Object.entries(moodCounts).map(([mood, count]) => (
            <View key={mood} style={styles.moodStat}>
              <Text style={styles.moodStatEmoji}>{MOOD_EMOJIS[mood]}</Text>
              <Text style={styles.moodStatCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No journal entries yet</Text>
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
  addButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#9ca3af',
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 12,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  moodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    borderColor: '#1f2937',
  },
  moodOptionEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodOptionLabel: {
    fontSize: 10,
    color: '#1f2937',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1f2937',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  moodStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  moodStat: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  moodStatEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  moodStatCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  moodBadge: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moodEmoji: {
    fontSize: 24,
  },
  entryInfo: {
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  mood: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
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
