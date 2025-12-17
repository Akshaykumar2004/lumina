import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Schedule, JournalEntry, ChatMessage } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    
    try {
      this.db = await SQLite.openDatabaseAsync('lumina.db');
      
      // Create tables
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          date TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS schedules (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          reminder INTEGER
        );
        
        CREATE TABLE IF NOT EXISTS journal_entries (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          mood TEXT NOT NULL,
          date TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          isUser INTEGER NOT NULL,
          timestamp TEXT NOT NULL,
          persona TEXT
        );
      `);
      
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Transactions
  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    try {
      await this.db.runAsync(
        'INSERT INTO transactions (id, amount, type, category, description, date) VALUES (?, ?, ?, ?, ?, ?)',
        [id, transaction.amount, transaction.type, transaction.category, transaction.description || '', transaction.date.toISOString()]
      );
      return id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync<any>(
        'SELECT * FROM transactions ORDER BY date DESC'
      );
      return result.map((row) => ({
        id: row.id,
        amount: row.amount,
        type: row.type,
        category: row.category,
        description: row.description,
        date: new Date(row.date)
      }));
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Schedules
  async addSchedule(schedule: Omit<Schedule, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    try {
      await this.db.runAsync(
        'INSERT INTO schedules (id, title, description, date, time, reminder) VALUES (?, ?, ?, ?, ?, ?)',
        [id, schedule.title, schedule.description || '', schedule.date.toISOString(), schedule.time, schedule.reminder || 0]
      );
      return id;
    } catch (error) {
      console.error('Error adding schedule:', error);
      throw error;
    }
  }

  async getSchedules(): Promise<Schedule[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync<any>(
        'SELECT * FROM schedules ORDER BY date ASC'
      );
      return result.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        date: new Date(row.date),
        time: row.time,
        reminder: row.reminder
      }));
    } catch (error) {
      console.error('Error getting schedules:', error);
      return [];
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync('DELETE FROM schedules WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  // Journal Entries
  async addJournalEntry(entry: Omit<JournalEntry, 'id'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = Date.now().toString();
    try {
      await this.db.runAsync(
        'INSERT INTO journal_entries (id, content, mood, date) VALUES (?, ?, ?, ?)',
        [id, entry.content, entry.mood, entry.date.toISOString()]
      );
      return id;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      throw error;
    }
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync<any>(
        'SELECT * FROM journal_entries ORDER BY date DESC'
      );
      return result.map((row) => ({
        id: row.id,
        content: row.content,
        mood: row.mood,
        date: new Date(row.date)
      }));
    } catch (error) {
      console.error('Error getting journal entries:', error);
      return [];
    }
  }

  async deleteJournalEntry(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Chat Messages
  async addChatMessage(message: ChatMessage): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.runAsync(
        'INSERT INTO chat_messages (id, text, isUser, timestamp, persona) VALUES (?, ?, ?, ?, ?)',
        [message.id, message.text, message.isUser ? 1 : 0, message.timestamp.toISOString(), message.persona || '']
      );
      
      // Keep only last 100 messages
      await this.db.runAsync(`
        DELETE FROM chat_messages WHERE id NOT IN (
          SELECT id FROM chat_messages ORDER BY timestamp DESC LIMIT 100
        )
      `);
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getAllAsync<any>(
        'SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT 100'
      );
      return result.map((row) => ({
        id: row.id,
        text: row.text,
        isUser: row.isUser === 1,
        timestamp: new Date(row.timestamp),
        persona: row.persona
      }));
    } catch (error) {
      console.error('Error getting chat messages:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      await this.db.execAsync(`
        DELETE FROM transactions;
        DELETE FROM schedules;
        DELETE FROM journal_entries;
        DELETE FROM chat_messages;
      `);
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
