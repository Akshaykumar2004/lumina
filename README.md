# Lumina - Smart Agentic Assistant

A comprehensive personal AI assistant app designed specifically for Indian users, built with React Native, TypeScript, and Firebase.

## 🌟 Features

### AI-Powered Chat Assistant
- Multi-persona AI assistant powered by Google's Gemini 2.0 Flash model
- Four specialized personas: General Assistant, Financial Advisor, Executive Secretary, and Wellness Companion
- Context-aware responses using user's personal data
- Real-time conversation with intelligent responses

### Financial Management
- Income and expense tracking with INR currency support
- Transaction categorization and analytics
- Visual spending breakdowns and budget insights
- Category-wise expense analysis
- Monthly financial summaries

### Schedule & Calendar Management
- Meeting and appointment scheduling
- Smart notification system with customizable reminders
- Conflict detection and availability checking
- Time zone support (Asia/Kolkata)

### Personal Journal & Wellness
- Daily journaling with AI-powered mood detection
- Emotional state tracking (happy, sad, energetic, calm, neutral)
- Mood analytics and patterns
- Reflection prompts and wellness insights

### Smart Notifications
- Cross-platform notifications
- Daily finance summary reminders
- Evening journal prompts
- Meeting reminders with custom timing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Firebase account
- Google AI (Gemini) API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lumina-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` file and add your Firebase and Gemini API keys
   - Update Firebase configuration in `src/config/firebase.ts`

4. Start the development server:
```bash
npm start
```

5. Run on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Update the configuration in `src/config/firebase.ts`

### Gemini AI Setup
1. Get API key from Google AI Studio
2. Add the key to your `.env` file
3. Update the configuration in `src/config/gemini.ts`

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
├── config/             # Configuration files
├── contexts/           # React contexts
├── navigation/         # Navigation setup
├── screens/           # App screens
├── services/          # API and business logic
└── types/             # TypeScript type definitions
```

## 🎨 Design Philosophy

The app follows a modern, Indian-centric design with:
- freindly words greetings and cultural context awareness
- INR currency formatting and Indian date/time formats
- Dark theme with indigo/purple gradient accents
- Clean, minimalist interface with smooth animations
- Mobile-optimized navigation with bottom tabs

## 🔒 Privacy & Security

- Secure Firebase authentication
- Encrypted data transmission
- Local data caching for offline use
- User-controlled data management
- Privacy-focused notification system

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions, please open an issue in the repository.