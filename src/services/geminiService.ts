import { GoogleGenerativeAI, FunctionDeclaration, Tool, SchemaType } from '@google/generative-ai';
import { databaseService } from './database';

// Get API key from environment variable
// In Expo, environment variables must be prefixed with EXPO_PUBLIC_
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: EXPO_PUBLIC_GEMINI_API_KEY not found in environment variables. Please check your .env file.');
}

const genAI = new GoogleGenerativeAI(apiKey || 'placeholder');

// Tool Definitions
const logTransactionTool: FunctionDeclaration = {
  name: 'logTransaction',
  description: 'Log a financial transaction (income or expense). Default currency is INR (₹).',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      type: {
        type: SchemaType.STRING,
        enum: ['income', 'expense'],
        description: 'Type of transaction',
      },
      amount: {
        type: SchemaType.NUMBER,
        description: 'Amount of money in INR',
      },
      category: {
        type: SchemaType.STRING,
        description: 'Category (e.g., Groceries, UPI, Rent, Food, Transport)',
      },
      description: {
        type: SchemaType.STRING,
        description: 'Short description of the transaction',
      },
    },
    required: ['type', 'amount', 'category', 'description'],
  },
};

const scheduleMeetingTool: FunctionDeclaration = {
  name: 'scheduleMeeting',
  description: 'Schedule a new meeting or appointment.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      title: {
        type: SchemaType.STRING,
        description: 'Title of the meeting',
      },
      date: {
        type: SchemaType.STRING,
        description: 'Date in YYYY-MM-DD format',
      },
      time: {
        type: SchemaType.STRING,
        description: 'Time in HH:MM format (24h)',
      },
      duration: {
        type: SchemaType.NUMBER,
        description: 'Duration in minutes',
      },
      description: {
        type: SchemaType.STRING,
        description: 'Optional notes about the meeting',
      },
    },
    required: ['title', 'date', 'time', 'duration'],
  },
};

const addJournalEntryTool: FunctionDeclaration = {
  name: 'addJournalEntry',
  description: 'Save a personal journal entry or diary log.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      content: {
        type: SchemaType.STRING,
        description: 'The content of the journal entry',
      },
      mood: {
        type: SchemaType.STRING,
        enum: ['happy', 'neutral', 'sad', 'energetic', 'calm'],
        description: 'Current mood associated with the entry',
      },
    },
    required: ['content', 'mood'],
  },
};

const getDailyQuoteTool: FunctionDeclaration = {
  name: 'getDailyQuote',
  description: 'Fetch a random good message or quote for the user.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {},
  },
};

const getUserFinancesTool: FunctionDeclaration = {
  name: 'getUserFinances',
  description:
    "Get user's financial data including income, expenses, and transactions for a specific time period.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      period: {
        type: SchemaType.STRING,
        enum: ['today', 'this_week', 'last_week', 'this_month', 'last_month', 'all'],
        description: 'Time period to fetch financial data for',
      },
    },
    required: ['period'],
  },
};

const getUserScheduleTool: FunctionDeclaration = {
  name: 'getUserSchedule',
  description:
    "Get user's schedule and meetings for a specific time period. Use this to check availability or discuss schedule.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      period: {
        type: SchemaType.STRING,
        enum: ['today', 'tomorrow', 'this_week', 'next_week', 'this_month', 'all'],
        description: 'Time period to fetch schedule for',
      },
    },
    required: ['period'],
  },
};

const getUserJournalsTool: FunctionDeclaration = {
  name: 'getUserJournals',
  description:
    "Get user's journal entries and mood data for a specific time period. Use this to understand how the user has been feeling.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      period: {
        type: SchemaType.STRING,
        enum: ['today', 'this_week', 'last_week', 'this_month', 'last_month', 'all'],
        description: 'Time period to fetch journal entries for',
      },
    },
    required: ['period'],
  },
};

const searchWebTool: FunctionDeclaration = {
  name: 'searchWeb',
  description:
    'Search the internet for real-time information, news, stock prices, or current events. Use this when user asks for information you might not know.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      query: {
        type: SchemaType.STRING,
        description: 'The search query to look up on Google.',
      },
    },
    required: ['query'],
  },
};

export const tools: Tool[] = [
  {
    functionDeclarations: [
      logTransactionTool,
      scheduleMeetingTool,
      addJournalEntryTool,
      getDailyQuoteTool,
      getUserFinancesTool,
      getUserScheduleTool,
      getUserJournalsTool,
      searchWebTool,
    ],
  },
];

export interface AgenticAction {
  type: 'transaction' | 'schedule' | 'journal' | 'quote' | 'search' | 'none';
  data?: any;
  executed: boolean;
}

export class GeminiService {
  private lastRequestTime = 0;
  private minRequestInterval = 3000; // 3 seconds between requests (increased to reduce quota usage)
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private quotaResetTime = 0;
  private quoteCache: { text: string; timestamp: number } | null = null;
  private quoteCacheDuration = 3600000; // 1 hour
  private searchCache: Map<string, { text: string; timestamp: number }> = new Map();
  private searchCacheDuration = 1800000; // 30 minutes

  private async waitForRateLimit() {
    const now = Date.now();
    
    // If we hit quota, wait before retrying
    if (this.quotaResetTime > now) {
      const waitTime = this.quotaResetTime - now;
      console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.quotaResetTime = 0;
    }
    
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  private async queueRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queue request error:', error);
        }
        await this.waitForRateLimit();
      }
    }
    this.isProcessingQueue = false;
  }

  private getSystemInstruction(persona: string): string {
    const base = `You are Lumina, a smart agentic AI assistant designed for Indian users.
- Default currency is Indian Rupee (₹ / INR).
- Current Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}.
- Always use tools when the user's intent matches a tool's capability.
- If a tool is called, confirm the action in a natural, friendly way.
- IMPORTANT: Only use searchWeb tool if absolutely necessary for current events or real-time information. Avoid web searches for general knowledge.
- Prefer using your existing knowledge for most queries.

**CONTEXT-AWARE CAPABILITIES**:
- When user asks about their finances, expenses, income, or budget, USE 'getUserFinances' tool to fetch their data.
- When user asks about their schedule, meetings, availability, or calendar, USE 'getUserSchedule' tool.
- When user asks about their mood, feelings, or how their month/week has been, USE 'getUserJournals' tool.
- When user asks "how was my month/week", fetch ALL relevant data (finances, schedule, journals) to give a comprehensive answer.
- Always analyze the data you receive and provide insights, not just raw numbers.`;

    let personaInstruction = '';
    switch (persona) {
      case 'FINANCIAL':
        personaInstruction = `Your persona is a **Financial Advisor** for the Indian market.
- Be precise about budgets, savings, and spending.
- You understand UPI, SIPs, Mutual Funds, Gold investments, FDs, and GST.
- When discussing money, think in terms of Lakhs and Crores if applicable.
- Encourage saving for festivals and future goals.`;
        break;
      case 'EXECUTIVE':
        personaInstruction = `Your persona is an **Executive Secretary**.
- Be professional, efficient, and organized.
- Confirm dates and times clearly.
- Be aware of general Indian holidays/festivals context if relevant.`;
        break;
      case 'WELLNESS':
        personaInstruction = `Your persona is a **Wellness Companion**.
- Be empathetic, warm, and encouraging.
- Focus on mental health, mindfulness, and perhaps occasional references to Yoga or meditation if appropriate.
- Use the journal tool frequently.`;
        break;
      case 'GENERAL':
      default:
        personaInstruction = `Your persona is a **General Assistant**.
- Be versatile and adapt to the user's needs.
- Be friendly and helpful.`;
        break;
    }

    return `${base}\n\n${personaInstruction}`;
  }

  async sendMessage(
    userMessage: string,
    persona: string,
    conversationHistory: any[] = []
  ): Promise<{ text: string; actions: AgenticAction[] }> {
    try {
      await this.waitForRateLimit();

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-preview-09-2025',
        systemInstruction: this.getSystemInstruction(persona),
        tools: tools,
      });

      // Validate and clean conversation history
      // Ensure it starts with a user message and alternates properly
      let validHistory = conversationHistory;
      if (validHistory.length > 0) {
        // If history starts with model, remove it
        if (validHistory[0].role === 'model') {
          validHistory = validHistory.slice(1);
        }
        // Ensure alternating pattern
        validHistory = validHistory.filter((msg, index) => {
          if (index === 0) return msg.role === 'user';
          const prevRole = validHistory[index - 1].role;
          return (prevRole === 'user' && msg.role === 'model') || 
                 (prevRole === 'model' && msg.role === 'user');
        });
      }

      const chat = model.startChat({
        history: validHistory,
      });

      let response = await chat.sendMessage(userMessage);
      const executedActions: AgenticAction[] = [];

      // Handle function calls (agentic loop)
      let functionCalls = response.response.functionCalls?.();
      while (functionCalls && functionCalls.length > 0) {

        const functionResponses = await Promise.all(
          functionCalls.map(async (call: any) => {
            let result = { result: 'Function executed successfully.' };

            try {
              switch (call.name) {
                case 'logTransaction':
                  await databaseService.addTransaction({
                    amount: call.args.amount,
                    type: call.args.type,
                    category: call.args.category,
                    description: call.args.description,
                    date: new Date(),
                  });
                  executedActions.push({
                    type: 'transaction',
                    data: call.args,
                    executed: true,
                  });
                  result = { result: `Transaction logged: ₹${call.args.amount} for ${call.args.category}` };
                  break;

                case 'scheduleMeeting':
                  const scheduleDate = new Date(call.args.date);
                  await databaseService.addSchedule({
                    title: call.args.title,
                    description: call.args.description || '',
                    date: scheduleDate,
                    time: call.args.time,
                    reminder: 15,
                  });
                  executedActions.push({
                    type: 'schedule',
                    data: call.args,
                    executed: true,
                  });
                  result = { result: `Meeting scheduled: ${call.args.title} on ${call.args.date} at ${call.args.time}` };
                  break;

                case 'addJournalEntry':
                  await databaseService.addJournalEntry({
                    content: call.args.content,
                    mood: call.args.mood,
                    date: new Date(),
                  });
                  executedActions.push({
                    type: 'journal',
                    data: call.args,
                    executed: true,
                  });
                  result = { result: `Journal entry saved with ${call.args.mood} mood` };
                  break;

                case 'getDailyQuote':
                  const quote = await this.generateDailyQuote();
                  result = { result: quote };
                  break;

                case 'getUserFinances':
                  const transactions = await databaseService.getTransactions();
                  const totalIncome = transactions
                    .filter((t) => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const totalExpense = transactions
                    .filter((t) => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                  result = {
                    result: JSON.stringify({
                      totalIncome,
                      totalExpense,
                      balance: totalIncome - totalExpense,
                      transactionCount: transactions.length,
                    }),
                  };
                  break;

                case 'getUserSchedule':
                  const schedules = await databaseService.getSchedules();
                  result = {
                    result: JSON.stringify({
                      upcomingCount: schedules.filter((s) => new Date(s.date) > new Date()).length,
                      totalSchedules: schedules.length,
                      schedules: schedules.slice(0, 5),
                    }),
                  };
                  break;

                case 'getUserJournals':
                  const journals = await databaseService.getJournalEntries();
                  const moodCounts = journals.reduce(
                    (acc, entry) => {
                      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>
                  );
                  result = {
                    result: JSON.stringify({
                      totalEntries: journals.length,
                      moodCounts,
                      recentEntries: journals.slice(0, 3),
                    }),
                  };
                  break;

                case 'searchWeb':
                  try {
                    const searchResults = await this.performWebSearch(call.args.query);
                    result = { result: searchResults };
                  } catch (searchError: any) {
                    result = { result: `Search failed: ${searchError.message}` };
                  }
                  break;

                default:
                  result = { result: 'Unknown function' };
              }
            } catch (error: any) {
              console.error(`Error executing ${call.name}:`, error);
              result = { result: `Error: ${error.message}` };
            }

            return {
              functionResponse: {
                name: call.name,
                response: result,
              },
            };
          })
        );

        // Send function responses back to the model
        response = await chat.sendMessage(functionResponses);
        functionCalls = response.response.functionCalls?.();
      }

      return {
        text: response.response.text(),
        actions: executedActions,
      };
    } catch (err) {
      console.error('Error in sendMessage:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        // Set quota reset time to 60 seconds from now
        this.quotaResetTime = Date.now() + 60000;
        console.warn('Quota exceeded. Will retry after 60 seconds.');
        return {
          text: '⏳ I\'ve hit my API quota. Please wait about a minute before trying again. This helps me manage my usage limits.',
          actions: [],
        };
      }
      
      if (errorMsg.includes('PERMISSION_DENIED') || errorMsg.includes('UNAUTHENTICATED')) {
        return {
          text: '🔑 There\'s an issue with my API key. Please check that your EXPO_PUBLIC_GEMINI_API_KEY is set correctly in the .env file.',
          actions: [],
        };
      }
      
      return {
        text: `I apologize, but I encountered an error: ${errorMsg.substring(0, 100)}. Please try again.`,
        actions: [],
      };
    }
  }

  async performWebSearch(query: string): Promise<string> {
    try {
      // Check cache first
      const cacheKey = query.toLowerCase();
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.searchCacheDuration) {
        console.log('Using cached search result for:', query);
        return cached.text;
      }

      await this.waitForRateLimit();

      // Use a simple prompt to get search-like results from the model
      // In a production app, you'd integrate with a real search API
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' });
      const prompt = `Provide information about: ${query}
      
Give a brief, factual response with:
1. Key facts
2. Recent developments if applicable
3. Relevant data

Keep it concise (2-3 sentences max).`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Cache the result
      this.searchCache.set(cacheKey, { text, timestamp: Date.now() });
      
      return text || 'No information found.';
    } catch (err) {
      console.error('Error performing web search:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        this.quotaResetTime = Date.now() + 120000; // Wait 2 minutes
        return 'I\'ve hit my search quota. Please wait a couple of minutes before trying again.';
      }
      
      return 'Unable to search at this moment. Please try again later.';
    }
  }

  async generateDailyQuote(): Promise<string> {
    try {
      // Check cache first
      if (this.quoteCache && Date.now() - this.quoteCache.timestamp < this.quoteCacheDuration) {
        console.log('Using cached quote');
        return this.quoteCache.text;
      }

      await this.waitForRateLimit();

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' });
      const prompt = `Generate an inspiring, motivational quote for an Indian user. Make it relevant to personal growth, productivity, or well-being. Keep it concise (1-2 sentences).`;

      const result = await model.generateContent(prompt);
      const quote = result.response.text();
      
      // Cache the quote
      this.quoteCache = { text: quote, timestamp: Date.now() };
      return quote;
    } catch (err) {
      console.error('Error generating quote:', err);
      return 'Every day is a new opportunity to grow. 🌟';
    }
  }

  async analyzeFinancialHealth(transactions: any[]): Promise<string> {
    try {
      await this.waitForRateLimit();

      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const categoryBreakdown = transactions
        .filter((t) => t.type === 'expense')
        .reduce(
          (acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
          },
          {} as Record<string, number>
        );

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' });
      const prompt = `Analyze this financial data and provide insights:
      
Total Income: ₹${totalIncome}
Total Expense: ₹${totalExpense}
Balance: ₹${totalIncome - totalExpense}
Category Breakdown: ${JSON.stringify(categoryBreakdown)}

Provide 2-3 actionable financial insights for an Indian user. Be concise and practical.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Error analyzing financial health:', err);
      return 'Keep tracking your expenses to get better insights!';
    }
  }

  async analyzeMoodTrends(journalEntries: any[]): Promise<string> {
    try {
      await this.waitForRateLimit();

      const moodCounts = journalEntries.reduce(
        (acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const recentEntries = journalEntries.slice(0, 5);

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' });
      const prompt = `Analyze this mood tracking data and provide wellness insights:
      
Mood Distribution: ${JSON.stringify(moodCounts)}
Recent Entries: ${recentEntries.map((e) => `${e.mood}: ${e.content.substring(0, 50)}`).join('\n')}

Provide 2-3 supportive wellness insights for an Indian user. Be empathetic and encouraging.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Error analyzing mood trends:', err);
      return 'Keep journaling to track your emotional well-being!';
    }
  }

  async getScheduleInsights(schedules: any[]): Promise<string> {
    try {
      await this.waitForRateLimit();

      const upcomingCount = schedules.filter((s) => new Date(s.date) > new Date()).length;
      const thisWeek = schedules.filter((s) => {
        const date = new Date(s.date);
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return date > now && date < weekFromNow;
      });

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' });
      const prompt = `Provide schedule management insights:
      
Upcoming Events: ${upcomingCount}
This Week: ${thisWeek.length} events
Events: ${schedules.slice(0, 5).map((s) => s.title).join(', ')}

Provide 2-3 brief scheduling tips for better time management. Be practical and actionable.`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.error('Error getting schedule insights:', err);
      return 'Stay organized with your schedule!';
    }
  }
}

export const geminiService = new GeminiService();
