# Unilang - System Patterns & Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────┐
│  React Native (Expo) - Mobile Frontend      │
├─────────────────────────────────────────────┤
│  Zustand State Management (Auth + Chat)     │
├─────────────────────────────────────────────┤
│  Service Layer (Auth, Messages, Chat, User) │
├─────────────────────────────────────────────┤
│  Firebase SDK                               │
└─────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────┐
│  Firebase Backend                           │
├─────────────────────────────────────────────┤
│  • Firestore (database + real-time sync)    │
│  • Auth (user management)                   │
│  • Cloud Functions (notification triggers)  │
│  • Cloud Messaging (FCM)                    │
│  • Firestore Persistence (offline cache)    │
└─────────────────────────────────────────────┘
```

## Key Technical Decisions

### 1. Why Firestore for Database?

**Decision:** Use Firestore (NoSQL) instead of traditional SQL database

**Reasoning:**

- Built-in real-time sync via `onSnapshot` listeners
- Automatic offline persistence (caches documents locally)
- Automatic message queuing when offline
- No backend server needed
- Scales to 1000+ concurrent users easily
- Firebase handles infrastructure

**Alternative considered:** SQLite + custom sync layer

- ❌ Would require complex sync logic
- ❌ Would need backend server
- ❌ Would delay MVP by 6+ hours

### 2. Why Optimistic UI Updates?

**Decision:** Show message immediately before it's saved to database

**Pattern:**

```
User sends message
        ↓
Show message immediately (status: "sending")
        ↓
Send to Firestore in background
        ↓
On success: message stays (updates with real ID)
On error: mark as failed, show retry
```

**Why this matters:**

- Feels instant (no 200-500ms delay)
- User knows message was sent
- Retry button if it fails
- Critical for good UX

### 3. Why Real-Time Listeners (onSnapshot)?

**Decision:** Use Firestore's `onSnapshot` instead of polling

**Pattern:**

```typescript
// Subscribe once, get instant updates forever
const unsubscribe = onSnapshot(query(...), (snapshot) => {
  updateUI(snapshot.data());
});

// Cleanup when component unmounts
return () => unsubscribe();
```

**Benefits:**

- Instant updates (<50ms)
- Automatic offline caching
- Single listener = efficient
- Handles network reconnect automatically

### 4. Why Zustand for State Management?

**Decision:** Use Zustand instead of Redux/Context

**Reasoning:**

- Lightweight (11KB vs Redux's 40KB)
- Simple to learn
- No boilerplate
- Perfect for MVP scope
- Can migrate to Redux later if needed

**Structure:**

```typescript
// authStore.ts
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: true }),
  clearUser: () => set({ user: null, isAuthenticated: false }),
}));

// Usage in component
const { user, isAuthenticated } = useAuthStore();
```

### 5. Why Service Layer?

**Decision:** Abstract Firestore logic into dedicated services

**Pattern:**

```
Component
    ↓
Service (e.g., messageService)
    ↓
Firestore SDK
    ↓
Firebase Backend
```

**Services:**

- `authService` - signup, login, logout
- `messageService` - send, receive, update status
- `chatService` - create, update, delete chats
- `userService` - profile, presence, search
- `firestoreService` - generic CRUD (createDoc, updateDoc, deleteDoc, queryDocs)

**Benefits:**

- Components stay simple (just UI)
- Firestore logic is testable
- Easy to mock in tests
- Single source of truth for each domain

## Data Flow Patterns

### Pattern 1: Real-Time Message Sync

```
User opens ChatScreen
        ↓
messageService.subscribeToMessages(chatId)
        ↓
Sets up onSnapshot listener on Firestore
        ↓
Updates Zustand chatStore with messages
        ↓
Component re-renders
        ↓
User sends message
        ↓
Shows optimistic message immediately
        ↓
messageService.sendMessage() → Firestore
        ↓
onSnapshot fires with updated message
        ↓
UI updates with real message ID + status
```

### Pattern 2: Offline-First Message Queuing

```
User offline (no internet)
        ↓
Calls messageService.sendMessage()
        ↓
Firestore queues write locally
        ↓
Message shows status: "sending"
        ↓
Network reconnects
        ↓
Firestore auto-syncs queued message
        ↓
Status updates to "sent" → "delivered" → "read"
```

### Pattern 3: Presence System

```
App opens
        ↓
userService.updateUserStatus(userId, "online")
        ↓
Sets user.status = "online" in Firestore
        ↓
onSnapshot listener in chat header fires
        ↓
Shows green dot
        ↓
App backgrounded
        ↓
userService.updateUserStatus(userId, "offline")
        ↓
Sets user.status = "offline" + lastSeen timestamp
        ↓
Listeners fire
        ↓
Shows "Last seen X minutes ago"
```

## Component Architecture

### Screen Hierarchy

```
RootNavigator
├── AuthStack
│   ├── LoginScreen
│   └── SignUpScreen
└── AppStack (BottomTabNavigator)
    ├── ChatsTab
    │   ├── ChatListScreen
    │   └── ChatScreen
    ├── ContactsTab
    │   ├── NewChatScreen
    │   └── NewGroupScreen
    └── ProfileTab
        ├── ProfileScreen
        └── GroupInfoScreen
```

### Component Breakdown

**Core Components:**

- `MessageBubble` - Single message with status indicator
- `ChatListItem` - Chat preview (last message, timestamp)
- `PresenceIndicator` - Green/red dot (online/offline)
- `InputBar` - Message input + send button
- `LoadingSpinner` - Activity indicator
- `ErrorBanner` - Network/error messages
- `EmptyState` - "No chats" placeholder

**Feature Components:**

- `UserList` - Searchable user list
- `GroupParticipants` - List of group members
- `ConfirmDialog` - Delete group, leave group

## Message Status Flow (Simple MVP Model)

```
"sending"
    ↓ (Firestore write succeeds)
"sent"
    ↓ (Any participant receives onSnapshot)
"delivered"
    ↓ (Any participant opens chat)
"read"
```

**Why simple?** Reduces code by ~60% vs per-participant tracking. Phase 2 can upgrade.

## Error Handling Patterns

### Pattern 1: Network Errors

```typescript
try {
  await sendMessage(text);
} catch (error) {
  if (error.code === "unavailable") {
    showBanner("You're offline. Syncing when online...");
    // Firestore handles queuing automatically
  }
}
```

### Pattern 2: Auth Errors

```typescript
try {
  await signUp(email, password);
} catch (error) {
  if (error.code === "auth/email-already-in-use") {
    Alert.alert("Email already registered");
  }
}
```

### Pattern 3: Permission Errors

```typescript
// Firestore security rules handle this
// Client receives permission-denied error
// Show: "You don't have access to this chat"
```

## Performance Patterns

### Pattern 1: Memoization

```typescript
// Only re-render if message ID changed
const MessageBubble = React.memo(
  ({ message }) => {
    return <View>{message.text}</View>;
  },
  (prev, next) => prev.message.id === next.message.id
);
```

### Pattern 2: Batch Updates

```typescript
// Mark all unread messages as read in one operation
const batch = writeBatch(db);
unreadMessages.forEach((msg) => {
  batch.update(doc(db, "messages", msg.id), { status: "read" });
});
await batch.commit();
```

### Pattern 3: Composite Indexes

```
Chat List Query:
  where(participants CONTAINS userId)
  .orderBy(updatedAt, DESC)
  ↓ REQUIRES COMPOSITE INDEX
  collection: chats
  fields: [participants (Arrays), updatedAt (DESC)]

Message History Query:
  where(chatId == X)
  .orderBy(timestamp, ASC)
  ↓ REQUIRES COMPOSITE INDEX
  collection: messages
  fields: [chatId (ASC), timestamp (ASC)]
```

## State Management Patterns

### Store Structure

```typescript
// authStore.ts
{
  user: { uid, name, email, preferred_language },
  isAuthenticated: boolean,
  loading: boolean,
  actions: { setUser, clearUser, setLoading }
}

// chatStore.ts
{
  chats: Chat[],
  currentChat: Chat,
  messages: Message[],
  actions: { setChats, setCurrentChat, setMessages }
}
```

### Usage Pattern

```typescript
// In component
const { user, isAuthenticated } = useAuthStore();
const { messages, setMessages } = useChatStore();

// Real-time sync
useEffect(() => {
  const unsubscribe = messageService.subscribeToMessages(chatId, (messages) =>
    setMessages(messages)
  );
  return () => unsubscribe();
}, [chatId]);
```

## Security Patterns

### Firestore Security Rules

```javascript
// Only authenticated users
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// Only chat participants
match /chats/{chatId} {
  allow read: if request.auth.uid in resource.data.participants;
}

// Only sender creates messages
match /messages/{messageId} {
  allow create: if request.auth.uid == request.resource.data.senderId;
}
```

**Result:** Unauthorized access is impossible; Firestore rejects at database level.

## Navigation Patterns

### Pattern 1: Auth Stack

```
unauthenticated
    ↓
show AuthStack (Login, Signup)
    ↓
user logs in
    ↓
setUser() in authStore
    ↓
switch to AppStack
```

### Pattern 2: Deep Linking (Notifications)

```
User taps notification
    ↓
Extract chatId from notification data
    ↓
navigation.navigate('Chat', { chatId })
    ↓
ChatScreen opens with that chat pre-loaded
```

## Testing Patterns

### Pattern 1: Service Testing

```typescript
// Mock Firestore
jest.mock('../services/firestore', () => ({
  sendMessage: jest.fn()
}));

// Test business logic
test('sendMessage updates status', async () => {
  const result = await messageService.sendMessage(...);
  expect(result.status).toBe('sent');
});
```

### Pattern 2: Component Testing

```typescript
// Mock stores
jest.mock("../store/chatStore", () => ({
  useChatStore: () => ({
    messages: mockMessages,
    setMessages: jest.fn(),
  }),
}));

// Test UI
test("renders message bubbles", () => {
  const { getByText } = render(<ChatScreen />);
  expect(getByText("Hello")).toBeTruthy();
});
```

## Deployment Patterns

### Dev Environment

- Local Expo dev server
- Firebase project (development config)
- Test on simulator/emulator

### Prod Environment (Expo Go)

- Published Expo app
- Firebase project (production config)
- Test on physical device

## Key Invariants

These MUST always be true:

1. **Message consistency:** Message appears in one place = appears everywhere
2. **Offline guarantee:** Every message sent offline WILL sync when online
3. **No duplicates:** Same message won't appear twice
4. **Presence accuracy:** User's status updates within 5 seconds
5. **Read receipt accuracy:** Message marked read = user opened chat
6. **Admin authority:** Only admin can delete group
7. **Participant access:** Only chat members can see chat

Violating any of these = critical bug.

## Performance Targets

- Real-time delivery: <500ms
- Chat list load: <1s
- Message rendering: 20+ msgs/sec without lag
- Memory usage: <100MB (idle), <200MB (active chat with 500+ messages)
