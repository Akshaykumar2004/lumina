import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ChatScreen } from '../screens/ChatScreen';
import { FinanceScreen } from '../screens/FinanceScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { JournalScreen } from '../screens/JournalScreen';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Finance') {
              iconName = focused ? 'wallet' : 'wallet-outline';
            } else if (route.name === 'Schedule') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Journal') {
              iconName = focused ? 'book' : 'book-outline';
            } else {
              iconName = 'help-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#1f2937',
            borderTopColor: '#374151',
            borderTopWidth: 1,
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: '#1f2937',
            borderBottomColor: '#374151',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        })}
      >
        <Tab.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            title: '🤖 Lumina AI',
          }}
        />
        <Tab.Screen 
          name="Finance" 
          component={FinanceScreen}
          options={{
            title: '💰 Finance',
          }}
        />
        <Tab.Screen 
          name="Schedule" 
          component={ScheduleScreen}
          options={{
            title: '📅 Schedule',
          }}
        />
        <Tab.Screen 
          name="Journal" 
          component={JournalScreen}
          options={{
            title: '📔 Journal',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};