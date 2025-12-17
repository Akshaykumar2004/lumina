export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  persona?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
}

export interface Schedule {
  id: string;
  title: string;
  description?: string;
  date: Date;
  time: string;
  reminder?: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: 'happy' | 'sad' | 'energetic' | 'calm' | 'neutral';
  date: Date;
}

export type PersonaType = 'GENERAL' | 'FINANCIAL' | 'EXECUTIVE' | 'WELLNESS';