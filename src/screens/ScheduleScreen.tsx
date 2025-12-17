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

interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time: string;
  reminder?: number;
}

export default function ScheduleScreen() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const data = await databaseService.getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const deleteSchedule = (id: string) => {
    Alert.alert('Delete Schedule', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await databaseService.deleteSchedule(id);
            setSchedules((prev) => prev.filter((s) => s.id !== id));
          } catch (error) {
            console.error('Error deleting schedule:', error);
          }
        },
      },
    ]);
  };

  const addSchedule = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      const scheduleDate = new Date(date);
      await databaseService.addSchedule({
        title: title.trim(),
        description: description.trim(),
        date: scheduleDate,
        time,
        reminder: 15,
      });

      setTitle('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setShowModal(false);
      loadSchedules();
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Error', 'Failed to add schedule');
    }
  };

  const isUpcoming = (date: Date) => {
    return date.getTime() > new Date().getTime();
  };

  const upcomingSchedules = schedules.filter((s) => isUpcoming(s.date));
  const pastSchedules = schedules.filter((s) => !isUpcoming(s.date));

  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={styles.scheduleItem}
      onLongPress={() => deleteSchedule(item.id)}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{item.time}</Text>
        <Text style={styles.date}>{item.date.toLocaleDateString('en-IN')}</Text>
      </View>
      <View style={styles.scheduleInfo}>
        <Text style={styles.scheduleTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}
      </View>
      {item.reminder && (
        <View style={styles.reminderBadge}>
          <Text style={styles.reminderText}>🔔</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📅 Schedule</Text>
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
              <Text style={styles.modalTitle}>Add Schedule</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Event title"
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Event description"
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={date}
                onChangeText={setDate}
              />

              <Text style={styles.label}>Time</Text>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor="#9ca3af"
                value={time}
                onChangeText={setTime}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={addSchedule}
              >
                <Text style={styles.submitButtonText}>Create Schedule</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FlatList
        data={[
          ...(upcomingSchedules.length > 0
            ? [{ id: 'upcoming-header', isHeader: true, label: 'Upcoming' }]
            : []),
          ...upcomingSchedules,
          ...(pastSchedules.length > 0
            ? [{ id: 'past-header', isHeader: true, label: 'Past' }]
            : []),
          ...pastSchedules,
        ]}
        renderItem={({ item }: any) => {
          if (item.isHeader) {
            return (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{item.label}</Text>
              </View>
            );
          }
          return renderScheduleItem({ item });
        }}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No schedules yet</Text>
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
    backgroundColor: '#6366f1',
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
    marginBottom: 8,
    marginTop: 12,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6366f1',
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeContainer: {
    width: 60,
    alignItems: 'center',
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  date: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    color: '#1f2937',
    fontWeight: '500',
    fontSize: 14,
  },
  description: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  reminderBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 16,
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
