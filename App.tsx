import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databaseService } from './src/services/database';
import ChatScreen from './src/screens/ChatScreen';
import FinanceScreen from './src/screens/FinanceScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import JournalScreen from './src/screens/JournalScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import BottomNavigation from './src/components/common/BottomNavigation';

type Screen = 'chat' | 'finance' | 'schedule' | 'journal' | 'insights';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('chat');
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await databaseService.init();
      setDbInitialized(true);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize database');
    }
  };

  if (!dbInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View />
        </View>
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'chat':
        return <ChatScreen />;
      case 'finance':
        return <FinanceScreen />;
      case 'schedule':
        return <ScheduleScreen />;
      case 'journal':
        return <JournalScreen />;
      case 'insights':
        return <InsightsScreen />;
      default:
        return <ChatScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#1a1a2e" />
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
      <BottomNavigation activeScreen={activeScreen} onScreenChange={setActiveScreen} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: {
    flex: 1,
  },
});
