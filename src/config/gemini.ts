import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variable
// In Expo, environment variables must be prefixed with EXPO_PUBLIC_
const getApiKey = () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: EXPO_PUBLIC_GEMINI_API_KEY not found in environment variables. Please check your .env file.');
  }
  
  return apiKey || '';
};

const API_KEY = getApiKey();

export const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

export const PERSONAS = {
  GENERAL: {
    name: 'General Assistant',
    prompt: 'You are Lumina, a helpful AI assistant for Indian users. Be friendly, use freindly words as greeting, and help with various tasks. You can add expenses, create schedules, and add journal entries.',
    icon: '🤖'
  },
  FINANCIAL: {
    name: 'Financial Advisor',
    prompt: 'You are Lumina\'s financial advisor. Help with budgeting, track expenses and income in INR. You can automatically add transactions when users mention spending or earning money.',
    icon: '💰'
  },
  EXECUTIVE: {
    name: 'Executive Secretary',
    prompt: 'You are Lumina\'s executive secretary. Help with scheduling, meetings, and reminders. You can automatically create schedule entries when users mention appointments or tasks.',
    icon: '📋'
  },
  WELLNESS: {
    name: 'Wellness Companion',
    prompt: 'You are Lumina\'s wellness companion. Focus on mental health and well-being. You can automatically create journal entries when users share their thoughts or feelings.',
    icon: '🧘'
  }
};