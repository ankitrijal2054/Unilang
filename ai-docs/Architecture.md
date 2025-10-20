# Unilang MVP - System Architecture

## Overview

Unilang is a real-time messaging app built with React Native (Expo) frontend and Firebase backend. The architecture prioritizes **reliability and real-time sync** with offline-first capabilities.

### Key Design Principles

1. **Real-time first:** All data syncs instantly via Firestore `onSnapshot` listeners
2. **Offline-capable:** Firestore handles local persistence and queuing automatically
3. **Optimistic UI:** Messages appear immediately; sync happens in background
4. **Scalable structure:** Services layer abstracts Firestore complexity
5. **Type-safe:** TypeScript throughout for reliability

---

## Technology Stack

| Layer              | Technology                     | Purpose                              |
| ------------------ | ------------------------------ | ------------------------------------ |
| Frontend           | React Native (Expo)            | Cross-platform mobile app            |
| UI Components      | React Native Paper             | Material Design UI                   |
| State Management   | Zustand                        | Global app state                     |
| Navigation         | React Navigation               | Screen routing + tabs                |
| Backend Database   | Firebase Firestore             | Real-time NoSQL database             |
| Authentication     | Firebase Auth                  | User signup/login/Google Sign-In     |
| Cloud Functions    | Firebase Cloud Functions       | Trigger notifications on new message |
| Push Notifications | Firebase Cloud Messaging (FCM) | Background/foreground notifications  |
| Local Storage      | Firestore offline persistence  | Automatic caching + queuing          |

---

## Data Model

### Users Collection (`users/{uid}`)

```javascript
{
  uid: "user123",
  name: "John Doe",
  email: "john@example.com",
  preferred_language: "en",
  status: "online" | "offline",
  lastSeen: "2025-10-20T12:00:00Z",
  fcmToken: "device-fcm-token",
  createdAt: "2025-10-20T10:00:00Z"
}
```

### Chats Collection (`chats/{chatId}`)

```javascript
{
  id: "chat001",
  type: "direct" | "group",
  name: "Team Chat",        // null for direct chats
  participants: ["user123", "user789"],
  adminId: "user123",       // Group creator (null for direct)
  isDeleted: false,         // True when admin deletes
  lastMessage: "Hello!",
  lastMessageTime: "2025-10-20T12:10:00Z",
  updatedAt: "2025-10-20T12:10:00Z",
  createdBy: "user123",
  createdAt: "2025-10-20T10:00:00Z"
}
```

### Messages Collection (`messages/{messageId}`)

```javascript
{
  id: "msg456",
  chatId: "chat001",
  senderId: "user123",
  text: "Hello!",
  timestamp: "2025-10-20T12:01:00Z",
  status: "sent" | "delivered" | "read",
  ai: {
    translated_text: "",     // For Phase 2
    detected_language: "",   // For Phase 2
    summary: ""              // For Phase 2
  }
}
```

---

## Firestore Indexes (Composite & Atomic)

### Index 1: Chat List Query (CRITICAL)

- **Collection:** `chats`
- **Fields:** `participants` (Arrays), `updatedAt` (Descending)
- **Query:** Get all chats for a user, sorted by most recent
- **SQL Equivalent:** `SELECT * FROM chats WHERE participants CONTAINS userId ORDER BY updatedAt DESC`

### Index 2: Message History Query

- **Collection:** `messages`
- **Fields:** `chatId` (Ascending), `timestamp` (Ascending)
- **Query:** Get all messages in a chat, in chronological order
- **SQL Equivalent:** `SELECT * FROM messages WHERE chatId = X ORDER BY timestamp ASC`

**Setup in Firebase Console:**

1. Go to Firestore Database → Indexes tab
2. Click "Create Index"
3. Select collection and add fields
4. Wait 2-5 minutes for index to build
5. Status changes from "Building" → "Enabled"

---

## Security Architecture

### Firestore Security Rules (Enhanced for MVP)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: Anyone authenticated can read any user profile
    // But only the user can write to their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Chats: Only participants of a chat can access it
    // Admin can delete group chats
    match /chats/{chatId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.adminId;
    }

    // Messages: Sender creates messages, participants can read
    // Anyone can update (for status changes: sent → delivered → read)
    // Message deletion is disabled to prevent data loss
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.senderId;
      allow update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

**Key Security Decisions:**

- ✅ Users can only read their own messages (chat participants only)
- ✅ Users can only send their own messages
- ✅ Only group admin can delete chats
- ✅ Message deletion is disabled (preserve history)
- ✅ Prevents unauthorized access to private conversations

---

## Data Flow Diagrams

### 1. Authentication Flow

```
User Login Screen
    ↓
Firebase Auth (email/password or Google)
    ↓
Create/Update User Document (Firestore)
    ↓
Zustand Auth Store (save user state)
    ↓
Navigate to Chat List Screen
```

### 2. Message Send & Receive Flow

```
Sender Types Message
    ↓
Click Send Button
    ↓
Optimistic UI: Show message immediately (status: "sending")
    ↓
Call sendMessage() → Firestore addDoc()
    ↓
Message written to Firestore → status: "sent"
    ↓
Cloud Function triggered on new message
    ↓
Send FCM notification to recipients
    ↓
Recipients' onSnapshot listener fires
    ↓
Update local message list (status: "delivered")
    ↓
User opens chat
    ↓
Mark messages as read (status: "read")
```

### 3. Real-Time Sync Flow

```
Firestore onSnapshot Listener (active on chat screen)
    ↓
Message changes detected in real-time
    ↓
Update Zustand Chat Store
    ↓
React re-renders message list
    ↓
UI shows new message instantly
```

### 4. Offline Flow

```
User sends message while offline
    ↓
Firestore offline persistence queues write
    ↓
Message shows status: "sending" locally
    ↓
Network reconnects
    ↓
Firestore syncs queued messages
    ↓
Message reaches server → status: "sent"
    ↓
Recipient receives notification
```

---

## Component Architecture

### Screens (UI Layers)

- **AuthStack:** LoginScreen, SignUpScreen
- **AppStack (Tabs):**
  - **Chats Tab:** ChatListScreen, ChatScreen
  - **Contacts Tab:** NewChatScreen, NewGroupScreen
  - **Profile Tab:** ProfileScreen, GroupInfoScreen

### Services (Business Logic)

- **authService:** Signup, login, logout, auth state
- **chatService:** Create chat, fetch chats, update chat, delete chat
- **messageService:** Send message, subscribe to messages, update status
- **userService:** Update profile, get all users, subscribe to presence
- **firestoreService:** Generic CRUD operations (createDoc, updateDoc, deleteDoc, queryDocs)

### State Management (Zustand Stores)

- **authStore:** `{ user, isAuthenticated, loading }`
- **chatStore:** `{ chats, currentChat, messages }`

### UI Components

- **MessageBubble:** Single message with status indicator
- **ChatListItem:** Chat preview with last message and time
- **PresenceIndicator:** Green dot for online/red for offline
- **InputBar:** Message input + send button

---

## Real-Time Architecture

### Why Firestore onSnapshot?

Firestore's `onSnapshot` listener automatically:

1. **Initial load:** Fetch all matching documents
2. **Live updates:** Listen for real-time changes
3. **Offline caching:** Store documents locally
4. **Auto-sync:** Resync when connection restored

```typescript
// Example: Real-time message listener
const unsubscribe = onSnapshot(
  query(
    collection(db, "messages"),
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  ),
  (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setMessages(messages); // Update UI immediately
  }
);

// Cleanup when component unmounts
return () => unsubscribe();
```

---

## Optimization Strategies

### 1. Optimistic UI Updates

**Problem:** Waiting for Firestore write latency feels slow (200-500ms)  
**Solution:** Show message in UI immediately, sync in background

```typescript
// 1. Add message to local state immediately
setMessages((prev) => [...prev, optimisticMessage]);

// 2. Send to Firestore in background
addDoc(collection(db, "messages"), message)
  .then((docRef) => {
    // 3. Real-time listener will update with server data
  })
  .catch((error) => {
    // 4. On error, mark as failed
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m))
    );
  });
```

### 2. Composite Indexes

**Problem:** Combining `array-contains` + `orderBy` is slow without an index  
**Solution:** Create composite indexes in Firestore

We create 2 indexes upfront (see above) to ensure queries are fast.

### 3. Component Memoization

```typescript
// Only re-render if message content changed
const MessageBubble = React.memo(
  ({ message }) => {
    return <View>{message.text}</View>;
  },
  (prev, next) => prev.message.id === next.message.id
);
```

### 4. Batch Updates

```typescript
// Mark all unread messages as read in one operation
const batch = writeBatch(db);
unreadMessages.forEach((msg) => {
  batch.update(doc(db, "messages", msg.id), { status: "read" });
});
await batch.commit();
```

---

## Error Handling Strategy

### Network Errors

```typescript
try {
  await sendMessage(text);
} catch (error) {
  if (error.code === "unavailable") {
    showBanner("Network unavailable. Syncing when online...");
    // Firestore queues it automatically
  } else if (error.code === "permission-denied") {
    showBanner("You don't have access to this chat");
  }
}
```

### Auth Errors

```typescript
try {
  await signUp(email, password);
} catch (error) {
  if (error.code === "auth/email-already-in-use") {
    showError("Email already registered");
  } else if (error.code === "auth/weak-password") {
    showError("Password must be 6+ characters");
  }
}
```

---

## Deployment Architecture

### Development (Local Emulator)

```
Local Expo Dev Server
    ↓
Connects to Firebase Emulator (optional)
    ↓
Test on iOS Simulator / Android Emulator
```

### Production (Expo Go)

```
Expo Go App (on physical device)
    ↓
Connects to live Firebase project
    ↓
Real network conditions
    ↓
Test messaging, notifications, offline sync
```

---

## System Architecture Diagram

graph TB
subgraph "Client Layer - React Native (Expo)"
subgraph "Screens"
AUTH[Auth Screens<br/>Login/Signup]
CHATLIST[Chat List Screen<br/>All Conversations]
CHAT[Chat Screen<br/>Messages + Input]
PROFILE[Profile Screen<br/>User Settings]
NEWCHAT[New Chat Screen<br/>User Selection]
NEWGROUP[New Group Screen<br/>Create Group]
GROUPINFO[Group Info Screen<br/>Manage Group]
end

        subgraph "Components"
            MSGBUBBLE[Message Bubble<br/>Text + Status]
            CHATITEM[Chat List Item<br/>Preview + Time]
            PRESENCE[Presence Indicator<br/>Online/Offline Dot]
        end

        subgraph "State Management (Zustand)"
            AUTHSTORE[Auth Store<br/>User + Auth State]
            CHATSTORE[Chat Store<br/>Messages + Chats]
        end

        subgraph "Services"
            AUTHSVC[Auth Service<br/>Login/Signup/SignOut]
            MSGSVC[Message Service<br/>Send/Receive/Status]
            CHATSVC[Chat Service<br/>Create/Update/Delete]
            USERSVC[User Service<br/>Profile/Presence/Status]
            FIRESVC[Firestore Service<br/>Generic CRUD]
        end

        subgraph "Local Features"
            OFFLINE[Offline Queue<br/>Firestore Cache]
            OPTIMISTIC[Optimistic UI<br/>Instant Updates]
            NOTIFHANDLER[Notification Handler<br/>Foreground/Background]
        end
    end

    subgraph "Firebase Backend"
        subgraph "Firebase Auth"
            EMAILAUTH[Email/Password]
            GOOGLEAUTH[Google Sign-In]
        end

        subgraph "Firestore Database"
            USERSCOL[(Users Collection)]
            CHATSCOL[(Chats Collection)]
            MSGSCOL[(Messages Collection)]
        end

        subgraph "Cloud Functions"
            MSGFUNC[onMessageCreate<br/>Trigger Function]
        end

        subgraph "Firebase Cloud Messaging"
            FCM[FCM Service<br/>Push Notifications]
        end

        subgraph "Real-time Engine"
            REALTIME[Firestore onSnapshot<br/>Live Sync]
        end
    end

    subgraph "External Services"
        FCMDEVICE[Device Notification<br/>iOS/Android]
    end

    %% Authentication Flow
    AUTH --> AUTHSVC
    AUTHSVC --> EMAILAUTH
    AUTHSVC --> GOOGLEAUTH
    EMAILAUTH --> USERSCOL
    GOOGLEAUTH --> USERSCOL
    USERSCOL --> AUTHSTORE

    %% Chat List Flow
    CHATLIST --> CHATSVC
    CHATSVC --> CHATSCOL
    CHATSCOL --> REALTIME
    REALTIME --> CHATSTORE
    CHATSTORE --> CHATITEM
    CHATITEM --> CHATLIST

    %% Messaging Flow
    CHAT --> MSGSVC
    MSGSVC --> OPTIMISTIC
    OPTIMISTIC --> MSGBUBBLE
    MSGSVC --> MSGSCOL
    MSGSCOL --> REALTIME
    REALTIME --> CHATSTORE
    CHATSTORE --> MSGBUBBLE
    MSGBUBBLE --> CHAT

    %% Message Status Flow
    MSGSCOL --> MSGFUNC
    MSGFUNC --> FCM
    FCM --> FCMDEVICE
    FCMDEVICE --> NOTIFHANDLER
    NOTIFHANDLER --> CHAT

    %% Offline Support
    MSGSVC --> OFFLINE
    OFFLINE --> MSGSCOL

    %% User Presence
    PROFILE --> USERSVC
    USERSVC --> USERSCOL
    USERSCOL --> REALTIME
    REALTIME --> PRESENCE
    PRESENCE --> CHAT

    %% Group Chat Flow
    NEWGROUP --> CHATSVC
    GROUPINFO --> CHATSVC
    CHATSVC --> CHATSCOL

    %% New Chat Flow
    NEWCHAT --> USERSVC
    USERSVC --> USERSCOL
    NEWCHAT --> CHATSVC

    %% Styling
    classDef frontend fill:#4A90E2,stroke:#2E5C8A,stroke-width:2px,color:#fff
    classDef backend fill:#50C878,stroke:#2E7D4E,stroke-width:2px,color:#fff
    classDef storage fill:#FF6B6B,stroke:#C44545,stroke-width:2px,color:#fff
    classDef external fill:#FFD93D,stroke:#C4A82E,stroke-width:2px,color:#333

    class AUTH,CHATLIST,CHAT,PROFILE,NEWCHAT,NEWGROUP,GROUPINFO,MSGBUBBLE,CHATITEM,PRESENCE,AUTHSTORE,CHATSTORE,AUTHSVC,MSGSVC,CHATSVC,USERSVC,FIRESVC,OFFLINE,OPTIMISTIC,NOTIFHANDLER frontend
    class EMAILAUTH,GOOGLEAUTH,MSGFUNC,FCM,REALTIME backend
    class USERSCOL,CHATSCOL,MSGSCOL storage
    class FCMDEVICE external
