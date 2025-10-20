# Unilang - Technical Context

## Technology Stack Details

### Frontend: React Native + Expo

**Why React Native?**

- Single codebase for iOS + Android
- Reuse React patterns developers know
- Expo handles build complexity (no native config needed)
- Fast development cycle

**Expo Benefits:**

- No Xcode/Android Studio needed
- Expo Go app for instant testing on physical device
- Built-in over-the-air updates
- Handles native module management

**Versions (MVP):**

- Node.js: 18.x or higher
- React Native: Latest (via Expo)
- Expo SDK: Latest stable

### UI Library: React Native Paper

**Why React Native Paper?**

- Material Design components out-of-the-box
- Pre-styled (save hours on design)
- Accessibility built-in
- Active maintenance

**Components we use:**

- `TextInput` - message input, search
- `Button` - send, create group
- `Card` - chat list items
- `Badge` - unread count
- `ActivityIndicator` - loading states
- `Snackbar` - error messages
- `Modal` - dialogs

### State Management: Zustand

**Store setup:**

```typescript
import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));
```

**Usage in components:**

```typescript
const { user, setUser } = useAuthStore();
```

### Backend: Firebase

**Services we use:**

1. **Firestore Database**

   - Real-time sync via `onSnapshot`
   - Automatic offline persistence
   - Built-in security rules
   - Collections: `users`, `chats`, `messages`

2. **Firebase Auth**

   - Email/password authentication
   - Google Sign-In integration
   - `onAuthStateChanged` observer
   - Session persistence automatic

3. **Cloud Functions**

   - Triggered on new message
   - Sends FCM notifications
   - Runs Node.js backend code

4. **Cloud Messaging (FCM)**

   - Push notifications to devices
   - Handles iOS APNs + Android FCM
   - Foreground + background messages

5. **Firestore Offline Persistence**
   - Automatic local caching
   - Message queuing when offline
   - Auto-sync on reconnect

### Navigation: React Navigation

**Structure:**

```
RootNavigator (conditional based on auth)
├── AuthStack
│   ├── LoginScreen
│   └── SignUpScreen
└── AppStack (BottomTabNavigator)
    ├── ChatsTab
    ├── ContactsTab
    └── ProfileTab
```

**Key concepts:**

- Conditional rendering based on `isAuthenticated`
- BottomTabNavigator for main app
- NativeStack for modal navigation

### Language: TypeScript

**Benefits:**

- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code via types
- Refactoring safety

**Setup:**

- Create Expo app with `--template blank-typescript`
- All `.ts` files use strict mode
- Interface definitions in `types/` folder

## Development Environment Setup

### Prerequisites

- **Node.js:** 18.x or higher (check: `node --version`)
- **npm or yarn:** Package manager (check: `npm --version`)
- **Expo CLI:** `npm install -g expo-cli`
- **VS Code:** Recommended editor
- **iOS Simulator:** Built-in with Xcode (macOS only)
- **Android Emulator:** From Android Studio (Windows/Mac/Linux)
- **Expo Go app:** Install on physical device from App Store/Play Store

### Project Structure

```
Unilang/
├── src/
│   ├── screens/              (full-screen components)
│   │   ├── AuthStack/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── SignUpScreen.tsx
│   │   ├── ChatsTab/
│   │   │   ├── ChatListScreen.tsx
│   │   │   ├── ChatScreen.tsx
│   │   │   └── GroupInfoScreen.tsx
│   │   ├── ContactsTab/
│   │   │   ├── NewChatScreen.tsx
│   │   │   └── NewGroupScreen.tsx
│   │   └── ProfileTab/
│   │       └── ProfileScreen.tsx
│   ├── components/           (reusable components)
│   │   ├── MessageBubble.tsx
│   │   ├── ChatListItem.tsx
│   │   ├── InputBar.tsx
│   │   ├── PresenceIndicator.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBanner.tsx
│   ├── services/             (business logic + Firestore)
│   │   ├── firebase.ts       (Firebase init)
│   │   ├── authService.ts    (signup, login, logout)
│   │   ├── chatService.ts    (create, update, delete chats)
│   │   ├── messageService.ts (send, receive, status)
│   │   ├── userService.ts    (profile, presence, search)
│   │   └── firestoreService.ts (generic CRUD)
│   ├── store/                (Zustand stores)
│   │   ├── authStore.ts      (user, auth state)
│   │   └── chatStore.ts      (chats, messages)
│   ├── types/                (TypeScript interfaces)
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── Message.ts
│   │   └── index.ts
│   ├── utils/                (helpers)
│   │   ├── formatTime.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── App.tsx               (root component)
│   └── index.ts              (entry point)
├── functions/                (Firebase Cloud Functions)
│   ├── src/
│   │   ├── index.ts
│   │   └── triggers/
│   │       └── onMessageCreate.ts
│   └── tsconfig.json
├── app.json                  (Expo config)
├── package.json
├── tsconfig.json
├── .gitignore
└── memory-bank/              (project documentation)
    ├── projectbrief.md
    ├── productContext.md
    ├── systemPatterns.md
    ├── techContext.md        (this file)
    ├── activeContext.md
    └── progress.md
```

## Dependencies (npm packages)

### Core

- `react` - UI library
- `react-native` - Mobile framework
- `expo` - Build tooling

### Firebase

- `firebase` - Firebase SDK (Auth, Firestore, Messaging)

### UI & Navigation

- `react-native-paper` - Material Design components
- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Tab navigator
- `react-native-safe-area-context` - Safe area handling
- `react-native-screens` - Platform-specific navigation

### State Management

- `zustand` - Lightweight state store

### Authentication

- `@react-native-google-signin/google-signin` - Google Sign-In

### Notifications

- `expo-notifications` - Push notifications
- `expo-device` - Device info
- `expo-constants` - Constants

### Network

- `@react-native-community/netinfo` - Check network status

### Utilities

- `date-fns` - Date formatting
- `react-native-vector-icons` - Icon library (or built-in Ionicons from Expo)

### Development

- `typescript` - TypeScript support
- `@types/react-native` - Type definitions
- `jest` - Testing framework

## Firebase Configuration

### Firebase Project Setup

1. **Create Firebase project**

   - Go to firebase.google.com
   - Click "Create Project"
   - Name: "Unilang"
   - Disable analytics (optional)

2. **Enable Firestore**

   - In Firebase Console → Build → Firestore Database
   - Click "Create Database"
   - Start in test mode (for MVP)
   - Location: Choose closest region

3. **Enable Authentication**

   - Build → Authentication → Get Started
   - Enable "Email/Password" provider
   - Enable "Google" provider

4. **Setup Google Sign-In**

   - Authentication → Google provider
   - Copy Client ID
   - Add to Android/iOS app configs

5. **Enable Cloud Messaging**

   - Build → Messaging
   - Create Android app (if needed)
   - Get Server Key (for Cloud Functions)

6. **Add iOS/Android Apps**
   - Project Settings → Add iOS app
   - Download GoogleService-Info.plist
   - Add Android app
   - Download google-services.json

### Firebase Config in Code

```typescript
// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db);
```

## Deployment

### Development

```bash
# Start Expo development server
npx expo start

# Open in iOS simulator
Press 'i'

# Open in Android emulator
Press 'a'

# Scan QR code in Expo Go app (physical device)
```

### Production (Expo Go)

```bash
# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Publish
npx expo publish
```

## Testing Strategy

### Unit Tests (Services)

- Test Firebase queries in isolation
- Mock Firestore responses
- Verify status transitions

### Integration Tests (Stores)

- Test stores with real Firebase
- Verify state updates
- Test offline behavior

### E2E Tests (Manual)

- Two real devices
- Send/receive messages
- Test offline sync
- Test notifications

## Performance Optimization

### Bundle Size

- Currently ~5MB (will increase with features)
- Monitor with `npx expo diagnostics`

### Memory Management

- Unsubscribe from listeners on unmount
- Memoize expensive components
- Limit message history fetched at once

### Network

- Use batch updates
- Composite indexes for fast queries
- Offline-first reduces server load

## Security

### Client-Side

- Firebase Auth handles session
- Never store sensitive data unencrypted
- Validate user input before sending

### Server-Side (Firestore)

- Security rules enforce access control
- No client can access other user's chats
- Message deletion disabled

### Network

- Firebase uses TLS for all traffic
- Firestore offline cache is encrypted

## Monitoring & Debugging

### Development

- React DevTools (Expo)
- Firebase Console (real-time stats)
- Network throttling (Chrome DevTools)

### Production

- Firebase Analytics (when added)
- Crashlytics for crash reporting
- Performance monitoring

## Known Limitations

- **No web version (MVP):** Focus on mobile-first
- **No end-to-end encryption (MVP):** TLS covers transport
- **No media attachments (MVP):** Text-only for reliability
- **Limited user base:** Firebase free tier handles ~100 concurrent users

## Upgrade Path (Phase 2+)

- **Web client:** React web app sharing services
- **Better state management:** Might upgrade to Redux if needed
- **Local storage:** SQLite for larger data
- **Encryption:** libsodium for E2E encryption
- **Analytics:** Firebase Analytics integration

## Technical Debt Tracker

Issues to address after MVP:

- [ ] Add TypeScript strict mode checks
- [ ] Setup Sentry for error tracking
- [ ] Add integration tests
- [ ] Setup CI/CD pipeline
- [ ] Add ESLint + Prettier
- [ ] Document API endpoints
- [ ] Add Storybook for components
