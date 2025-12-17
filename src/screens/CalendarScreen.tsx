import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { GradientBackground } from '../components/common/GradientBackground';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { Meeting } from '../types';

export const CalendarScreen: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    reminder: 15
  });
  
  const { user } = useAuth();
  const firestoreService = new FirestoreService();

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    if (!user) return;
    try {
      const data = await firestoreService.getMeetings(user.id);
      setMeetings(data);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMeeting = async () => {
    if (!user || !newMeeting.title || !newMeeting.date || !newMeeting.startTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const [year, month, day] = newMeeting.date.split('-');
      const [startHour, startMinute] = newMeeting.startTime.split(':');
      const [endHour, endMinute] = newMeeting.endTime ? newMeeting.endTime.split(':') : [startHour, startMinute];

      const startTime = new Date();
      startTime.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
      startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

      const endTime = new Date(startTime);
      if (newMeeting.endTime) {
        endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      } else {
        endTime.setTime(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
      }

      await firestoreService.addMeeting({
        title: newMeeting.title,
        description: newMeeting.description,
        startTime,
        endTime,
        userId: user.id,
        reminder: newMeeting.reminder
      });
      
      setModalVisible(false);
      setNewMeeting({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        reminder: 15
      });
      loadMeetings();
    } catch (error) {
      Alert.alert('Error', 'Failed to add meeting');
    }
  };

  const deleteMeeting = async (meetingId: string) => {
    Alert.alert(
      'Delete Meeting',
      'Are you sure you want to delete this meeting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await firestoreService.deleteMeeting(meetingId);
              loadMeetings();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete meeting');
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getTodaysMeetings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate >= today && meetingDate < tomorrow;
    });
  };

  const getUpcomingMeetings = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate > today;
    }).slice(0, 5);
  };

  const todaysMeetings = getTodaysMeetings();
  const upcomingMeetings = getUpcomingMeetings();

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading calendar...</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📅 Calendar</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add Meeting</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Meetings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Meetings</Text>
          {todaysMeetings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No meetings scheduled for today</Text>
            </View>
          ) : (
            todaysMeetings.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                style={styles.meetingItem}
                onLongPress={() => deleteMeeting(meeting.id)}
              >
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingTitle}>{meeting.title}</Text>
                  {meeting.description && (
                    <Text style={styles.meetingDescription}>{meeting.description}</Text>
                  )}
                  <Text style={styles.meetingTime}>
                    {formatDateTime(meeting.startTime)} - {formatDateTime(meeting.endTime)}
                  </Text>
                  {meeting.reminder && (
                    <Text style={styles.reminderText}>
                      🔔 Reminder: {meeting.reminder} minutes before
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Meetings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Meetings</Text>
          {upcomingMeetings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No upcoming meetings</Text>
            </View>
          ) : (
            upcomingMeetings.map((meeting) => (
              <TouchableOpacity
                key={meeting.id}
                style={styles.meetingItem}
                onLongPress={() => deleteMeeting(meeting.id)}
              >
                <View style={styles.meetingInfo}>
                  <Text style={styles.meetingTitle}>{meeting.title}</Text>
                  {meeting.description && (
                    <Text style={styles.meetingDescription}>{meeting.description}</Text>
                  )}
                  <Text style={styles.meetingTime}>
                    {formatDateTime(meeting.startTime)} - {formatDateTime(meeting.endTime)}
                  </Text>
                  {meeting.reminder && (
                    <Text style={styles.reminderText}>
                      🔔 Reminder: {meeting.reminder} minutes before
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Add Meeting Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Meeting</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Meeting Title *"
                placeholderTextColor="#9ca3af"
                value={newMeeting.title}
                onChangeText={(text) => setNewMeeting({...newMeeting, title: text})}
              />

              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                placeholderTextColor="#9ca3af"
                value={newMeeting.description}
                onChangeText={(text) => setNewMeeting({...newMeeting, description: text})}
                multiline
              />

              <TextInput
                style={styles.input}
                placeholder="Date (YYYY-MM-DD) *"
                placeholderTextColor="#9ca3af"
                value={newMeeting.date}
                onChangeText={(text) => setNewMeeting({...newMeeting, date: text})}
              />

              <TextInput
                style={styles.input}
                placeholder="Start Time (HH:MM) *"
                placeholderTextColor="#9ca3af"
                value={newMeeting.startTime}
                onChangeText={(text) => setNewMeeting({...newMeeting, startTime: text})}
              />

              <TextInput
                style={styles.input}
                placeholder="End Time (HH:MM) - optional"
                placeholderTextColor="#9ca3af"
                value={newMeeting.endTime}
                onChangeText={(text) => setNewMeeting({...newMeeting, endTime: text})}
              />

              <View style={styles.reminderContainer}>
                <Text style={styles.reminderLabel}>Reminder (minutes before):</Text>
                <View style={styles.reminderOptions}>
                  {[5, 15, 30, 60].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.reminderOption,
                        newMeeting.reminder === minutes && styles.selectedReminder
                      ]}
                      onPress={() => setNewMeeting({...newMeeting, reminder: minutes})}
                    >
                      <Text style={styles.reminderOptionText}>{minutes}m</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={addMeeting}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  meetingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  meetingInfo: {
    flex: 1,
  },
  meetingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  meetingDescription: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
  },
  meetingTime: {
    color: '#a78bfa',
    fontSize: 14,
    marginBottom: 5,
  },
  reminderText: {
    color: '#fbbf24',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    color: '#ffffff',
    fontSize: 16,
  },
  reminderContainer: {
    marginBottom: 20,
  },
  reminderLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  reminderOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reminderOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  selectedReminder: {
    backgroundColor: '#6366f1',
  },
  reminderOptionText: {
    color: '#ffffff',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});