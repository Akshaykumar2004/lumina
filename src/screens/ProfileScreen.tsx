import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { GradientBackground } from '../components/common/GradientBackground';
import { useAuth } from '../contexts/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const profileStats = [
    { label: 'Member Since', value: user?.createdAt.toLocaleDateString('en-IN') || 'N/A' },
    { label: 'Time Zone', value: 'Asia/Kolkata (IST)' },
    { label: 'Currency', value: 'Indian Rupee (₹)' },
    { label: 'Language', value: 'English (India)' }
  ];

  const features = [
    { icon: '🤖', title: 'AI Chat Assistant', description: 'Multi-persona AI powered by Gemini' },
    { icon: '💰', title: 'Finance Tracking', description: 'Income, expenses, and budget insights' },
    { icon: '📅', title: 'Smart Calendar', description: 'Meeting scheduling with reminders' },
    { icon: '📔', title: 'Personal Journal', description: 'Mood tracking and reflection' },
    { icon: '🔔', title: 'Smart Notifications', description: 'Intelligent reminders and alerts' }
  ];

  return (
    <GradientBackground>
      <ScrollView style={styles.container}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>
            {user?.displayName || 'User'}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.greeting}>नमस्ते! Welcome to Lumina</Text>
        </View>

        {/* Profile Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          {profileStats.map((stat, index) => (
            <View key={index} style={styles.statItem}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lumina Features</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Lumina</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              Lumina is your comprehensive AI assistant designed specifically for Indian users. 
              It combines intelligent conversation, financial management, scheduling, and wellness 
              tracking in one beautiful app.
            </Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>🔔 Notification Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>🌙 Theme Settings</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>🔒 Privacy & Security</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>📱 Export Data</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for India</Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  displayName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    color: '#d1d5db',
    fontSize: 16,
    marginBottom: 10,
  },
  greeting: {
    color: '#a78bfa',
    fontSize: 14,
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
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  statLabel: {
    color: '#d1d5db',
    fontSize: 16,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  featureDescription: {
    color: '#9ca3af',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 10,
  },
  infoText: {
    color: '#d1d5db',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  versionText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  settingArrow: {
    color: '#9ca3af',
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});