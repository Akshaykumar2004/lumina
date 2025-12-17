import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { databaseService } from '../services/database';
import { geminiService } from '../services/geminiService';
import { ThinkingIndicator } from '../components/common/ThinkingIndicator';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  persona?: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
}

const PERSONAS = {
  GENERAL: { name: 'General', icon: '🤖', color: '#6366f1' },
  FINANCIAL: { name: 'Financial', icon: '💰', color: '#10b981' },
  EXECUTIVE: { name: 'Executive', icon: '📋', color: '#f59e0b' },
  WELLNESS: { name: 'Wellness', icon: '🧘', color: '#8b5cf6' },
};

export default function ChatScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<keyof typeof PERSONAS>('GENERAL');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedMessages, loadedTransactions] = await Promise.all([
        databaseService.getChatMessages(),
        databaseService.getTransactions(),
      ]);
      setMessages(loadedMessages);
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
      persona: selectedPersona,
    };

    const currentMessage = message;
    setMessage('');
    setLoading(true);

    try {
      // Save user message
      await databaseService.addChatMessage(userMsg);
      setMessages((prev) => [userMsg, ...prev]);

      // Build conversation history for context (reverse to get chronological order)
      const conversationHistory = messages
        .slice(0, 10)
        .reverse()
        .map((msg) => ({
          role: msg.isUser ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));

      // Send message with agentic function calling
      const { text: aiResponse, actions } = await geminiService.sendMessage(
        currentMessage,
        selectedPersona,
        conversationHistory
      );

      // Build response with action confirmations
      let responseText = aiResponse;
      const confirmations: string[] = [];

      for (const action of actions) {
        if (action.executed) {
          switch (action.type) {
            case 'transaction':
              confirmations.push(
                `✅ Added ${action.data.type}: ₹${action.data.amount} for ${action.data.category}`
              );
              break;
            case 'schedule':
              confirmations.push(`📅 Created schedule: ${action.data.title}`);
              break;
            case 'journal':
              confirmations.push(`📔 Added journal entry with ${action.data.mood} mood`);
              break;
          }
        }
      }

      if (confirmations.length > 0) {
        responseText += `\n\n${confirmations.join('\n')}`;
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isUser: false,
        timestamp: new Date(),
        persona: selectedPersona,
      };

      // Save AI message
      await databaseService.addChatMessage(aiMsg);
      setMessages((prev) => [aiMsg, ...prev]);

      // Reload data if any actions were executed
      if (actions.length > 0) {
        const [updatedTransactions] = await Promise.all([
          databaseService.getTransactions(),
        ]);
        setTransactions(updatedTransactions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Show error message to user
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        isUser: false,
        timestamp: new Date(),
        persona: selectedPersona,
      };
      
      setMessages((prev) => [errorMessage, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {!item.isUser && (
        <View style={styles.personaIndicator}>
          <Text style={styles.personaIcon}>
            {PERSONAS[item.persona as keyof typeof PERSONAS]?.icon || '🤖'}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.messageContent,
          item.isUser && styles.userMessageContent,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser && styles.userMessageText,
          ]}
        >
          {item.text}
        </Text>
        <Text
          style={[
            styles.timestamp,
            item.isUser && styles.userTimestamp,
          ]}
        >
          {item.timestamp.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Kolkata',
          })}
        </Text>
      </View>
    </View>
  );

  const renderPersonaSelector = () => (
    <View style={styles.personaContainer}>
      {Object.entries(PERSONAS).map(([key, persona]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.personaButton,
            selectedPersona === key && { backgroundColor: persona.color },
          ]}
          onPress={() => setSelectedPersona(key as keyof typeof PERSONAS)}
        >
          <Text style={styles.personaIcon}>{persona.icon}</Text>
          <Text
            style={[
              styles.personaName,
              selectedPersona === key && styles.selectedPersonaName,
            ]}
          >
            {persona.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💬 Chat</Text>
      </View>

      {renderPersonaSelector()}

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={
            loading
              ? [{ id: 'thinking', text: '', isUser: false, timestamp: new Date() }, ...messages]
              : messages
          }
          renderItem={({ item }) => {
            if (item.id === 'thinking') {
              return <ThinkingIndicator visible={true} color={PERSONAS[selectedPersona].color} />;
            }
            return renderMessage({ item });
          }}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: PERSONAS[selectedPersona].color },
              (!message.trim() || loading) && styles.disabledButton,
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || loading}
          >
            <Text style={styles.sendButtonText}>{loading ? '⏳' : '📤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  personaContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  personaButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    marginHorizontal: 0,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  personaIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  personaName: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  selectedPersonaName: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    maxWidth: width * 0.85,
  },
  userMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  personaIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageContent: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
  },
  userMessageContent: {
    backgroundColor: '#6366f1',
  },
  messageText: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#ffffff',
  },
  timestamp: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1f2937',
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#d1d5db',
  },
  sendButtonText: {
    fontSize: 18,
  },
});
