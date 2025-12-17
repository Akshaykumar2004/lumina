import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface BottomNavigationProps {
  activeScreen: 'chat' | 'finance' | 'schedule' | 'journal' | 'insights';
  onScreenChange: (screen: 'chat' | 'finance' | 'schedule' | 'journal' | 'insights') => void;
}

const TABS = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'journal', label: 'Journal', icon: '📔' },
  { id: 'insights', label: 'Insights', icon: '✨' },
];

function BottomNavigation({ activeScreen, onScreenChange }: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeScreen === tab.id && styles.activeTab,
          ]}
          onPress={() => onScreenChange(tab.id as any)}
        >
          <Text style={styles.icon}>{tab.icon}</Text>
          <Text style={[
            styles.label,
            activeScreen === tab.id && styles.activeLabel,
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#6366f1',
    fontWeight: '600',
  },
});

export default BottomNavigation;
