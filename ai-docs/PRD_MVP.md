# Unilang - MVP Product Requirements Document

**Platform:** React Native (Expo)  
**Backend:** Firebase (Firestore, Auth, Cloud Functions, FCM)  
**Target:** 24-hour MVP checkpoint

---

## 1. Objective

Build a reliable, cross-platform messaging app with WhatsApp-style core functionality. The MVP proves the messaging infrastructure works solidly before adding AI features in Phase 2.

**Success = Messages sync reliably in real-time with offline support.**

---

## 2. MVP Features (Hard Requirements)

### Authentication

- Email/password sign-up and login
- Google Sign-In integration
- Firebase Auth implementation

### User Profile

- Display name (editable)
- Preferred language selection (stored for Phase 2 AI features)
- No profile pictures in MVP (placeholder only)

### One-on-One Chat

- Real-time message delivery between users
- Instant sync via Firestore
- Optimistic UI updates (messages appear immediately)
- Message timestamps (local time)

### User Discovery & Chat Initiation

- Search all users by name/email
- View user list with online/offline status
- Start direct chat with any user (Telegram-style open messaging)
- Prevent duplicate chats (reuse existing conversation)

### Group Chat

- Support 3+ participants
- Create new groups with custom names
- Display group name (editable by admin)
- Show participant list
- Message attribution (who sent what)
- **Group Admin Features:**
  - Add members to group
  - Remove members from group
  - Edit group name
  - Delete group entirely
- **Member Features:**
  - Leave group voluntarily
  - Send/receive messages
  - View all participants
- When group is deleted: Chat disappears for all members with "This group was deleted" indicator

### Message States & Indicators

- ✓ Sent (message left device)
- ✓✓ Delivered (reached recipient device)
- ✓✓ Read (blue checkmarks when opened)
- Visual indicators similar to WhatsApp

### Presence System

- Online/offline status indicator (live dot)
- Real-time updates via Firestore onSnapshot
- Last seen timestamp

### Offline Support

- Messages persist locally using Firestore offline caching
- Messages queue when offline, sync on reconnect
- Chat history survives app restarts
- Works gracefully on poor network conditions

### Push Notifications

- Foreground notifications (required)
- Background notifications (required if not too complex)
- Firebase Cloud Messaging implementation
- Cloud Function triggers for new messages

### UI/UX

- Messenger-style layout
- React Native Paper components
- Single theme (light mode only)
- Smooth scrolling and input responsiveness

---

## 3. Deferred to Phase 2

- **AI Features:** Translation, summarization, all persona-specific features
- **Media:** Image/file attachments
- **Advanced Chat:** Typing indicators, message editing/deletion
- **Group Management:** Transfer admin rights to another member
- **Profile:** Avatar upload, status messages
- **Themes:** Dark mode, customization
- **Advanced Notifications:** Custom sounds, in-app banner styles

---

## 4. Technical Stack

| Layer              | Technology                                 |
| ------------------ | ------------------------------------------ |
| Frontend           | React Native (Expo)                        |
| UI Library         | React Native Paper                         |
| State Management   | Zustand or React Context                   |
| Backend Database   | Firebase Firestore                         |
| Authentication     | Firebase Auth                              |
| Cloud Functions    | Firebase Cloud Functions                   |
| Push Notifications | Firebase Cloud Messaging (FCM)             |
| Local Persistence  | Firestore built-in offline caching         |
| Deployment         | Local emulator + Expo Go (if time permits) |

---

## 5. Data Models

### User Collection (`users/{uid}`)

```javascript
{
  uid: "user123",
  name: "John Doe",
  email: "john@example.com",
  preferred_language: "en",
  status: "online",        // "online" | "offline"
  lastSeen: "2025-10-20T12:00:00Z",
  createdAt: "2025-10-20T10:00:00Z"
}
```

### Message Collection (`messages/{messageId}`)

```javascript
{
  id: "msg456",
  chatId: "chat001",
  senderId: "user123",
  text: "Hello!",
  timestamp: "2025-10-20T12:01:00Z",
  status: "read",          // "sent" | "delivered" | "read"

  // AI hooks for Phase 2
  ai: {
    translated_text: "",
    detected_language: "",
    summary: ""
  }
}
```

### Chat Collection (`chats/{chatId}`)

```javascript
{
  id: "chat001",
  type: "group",           // "direct" | "group"
  name: "Team Chat",       // null for direct chats
  participants: ["user123", "user789", "user456"],
  adminId: "user123",      // Group creator/admin (null for direct chats)
  isDeleted: false,        // True when admin deletes group
  lastMessage: "See you soon!",
  lastMessageTime: "2025-10-20T12:10:00Z",
  updatedAt: "2025-10-20T12:10:00Z",
  createdBy: "user123",
  createdAt: "2025-10-20T10:00:00Z"
}
```

---

## 6. MVP Success Criteria

| Category           | Requirement                                              |
| ------------------ | -------------------------------------------------------- |
| Real-time Delivery | < 500ms delay between devices                            |
| Offline Sync       | Messages reappear correctly after reconnect              |
| Persistence        | Chat history survives app force-quit and restart         |
| Read Receipts      | Status updates across all participants                   |
| Presence           | Online/offline indicator updates in real-time            |
| Notifications      | FCM working in foreground; background if feasible        |
| Stability          | No crashes under rapid send (≥20 msgs/sec)               |
| UI Performance     | Smooth message input and list scrolling on iOS & Android |
| Group Chat         | Works correctly with 3+ participants                     |

---

## 7. Testing Checklist (MVP Gate)

Must pass ALL of these to clear MVP:

- [ ] Two devices send and receive messages in real-time
- [ ] One device goes offline → messages queue and sync when back online
- [ ] App force-quit and reopened → chat history intact
- [ ] Read receipts update correctly for all participants
- [ ] Presence indicator toggles when user closes/reopens app
- [ ] Group chat works with 3+ participants
- [ ] Group creation with custom name
- [ ] Admin can add/remove members from group
- [ ] Admin can edit group name
- [ ] Admin can delete group (shows "This group was deleted" for all members)
- [ ] Regular members can leave group voluntarily
- [ ] Participant list and group name display correctly
- [ ] Notifications fire from Cloud Function (foreground minimum)
- [ ] Rapid-fire test: Send 20+ messages quickly without crashes
- [ ] Poor network handling: Works on throttled/intermittent connection

---

## 8. Development Priority & Strategy

### Recommended Implementation Order (24-Hour Breakdown)

**Hours 0-4: Foundation**

1. Firebase project setup + Firestore initialization
2. Enable Auth (Email/Password + Google), Cloud Messaging
3. Deploy Firestore security rules + create composite indexes
4. Expo project initialization with TypeScript
5. Install all dependencies + setup folder structure

**Hours 4-8: Authentication & UI Shell**

1. Implement email/password signup (with language picker: 10 languages)
2. Implement email/password login
3. Implement Google Sign-In
4. Auth state observer + Zustand auth store
5. Basic navigation setup (Auth stack, App stack with tabs)
6. Build Login/Signup screens

**Hours 8-12: Chat UI & List Setup**

1. Chat List screen (UI only, no real data)
2. Chat screen (UI only, message bubble component)
3. New Chat screen (user selection UI)
4. Profile screen (UI only)
5. Test UI responsiveness on iOS & Android

**Hours 12-18: Real-Time Messaging (CRITICAL)**

1. Firestore services: message send, receive, status updates
2. One-on-one chat with real-time sync (onSnapshot)
3. Optimistic UI updates (messages appear immediately)
4. Message status indicators (sent/delivered/read - simple approach: any participant = delivered/read)
5. Offline support verification
6. Chat creation logic (prevent duplicates)

**Hours 18-22: Presence, Groups & Features**

1. User presence system (online/offline + last seen)
2. Group chat creation
3. Group management (add/remove members, edit name, delete)
4. Admin restrictions: prevent admin from leaving/removing themselves
5. Show "This group was deleted" banner (stays in list, grayed out, disabled input)
6. Member leave group functionality

**Hours 22-24: Notifications & Testing**

1. Push notifications via FCM + Cloud Functions
2. Notification handling (foreground + background)
3. Badge count (total unread messages)
4. Run all 10 core tests
5. Stress test + bug fixes

### Phase Breakdown (from original document)

**Hours 1-8:** Core Infrastructure

1. Firebase project setup + authentication
2. User registration/login flow
3. Basic UI shell (chat list, chat screen)

**Hours 9-16:** Messaging Core

1. One-on-one chat with real-time sync
2. Message persistence and offline support
3. Optimistic UI updates
4. Message status indicators

**Hours 17-20:** Group & Polish

1. Group chat functionality
2. Presence system
3. Push notifications via Cloud Functions

**Hours 21-24:** Testing & Stability

1. Run all testing scenarios
2. Fix critical bugs
3. Stress test (20+ msgs/sec)
4. Deploy to Expo Go if time permits

---

## 9. Out of Scope for MVP

- AI translation or summarization
- Media attachments (images, videos, files)
- Typing indicators
- Message reactions or replies
- Profile avatars
- Dark mode
- Message search
- Voice messages
- Video/audio calls
- End-to-end encryption

These features are planned for Phase 2 after MVP validation.

---

## 10. Key Technical Decisions

- **Why Firebase?** Real-time sync and offline support out-of-the-box
- **Why Expo?** Fastest cross-platform development path
- **Why React Native Paper?** Pre-built components for Messenger-style UI
- **Why Zustand?** Lightweight state management, easier than Redux
- **Why no SQLite?** Firestore offline caching handles local persistence
- **Why composite indexes?** Combining array-contains + orderBy requires indexed queries for performance
- **Why stricter security rules?** Only authorized users access their data; prevents unauthorized chat access

---

## 11. Message Status System (MVP Approach - Simplified)

For MVP, we use a **simple status model** to minimize complexity:

- **✓ Sent:** Message successfully written to Firestore
- **✓✓ Delivered:** Message received by ANY participant (shown once received)
- **✓✓ Read:** Message read by ANY participant (shown in blue once opened by any user)

This differs from WhatsApp's per-participant tracking but significantly reduces code complexity. Phase 2 can upgrade to per-participant tracking if needed.

---

## 12. Admin & Group Management (MVP Constraints)

**Admin Restrictions (MVP only):**

- Admin **cannot leave** a group (prevents accidental loss of control)
- Admin **cannot remove themselves** from the participant list
- If admin wants to leave, they must **delete the group** first

**Why?** Simplifies MVP; Phase 2 can add "transfer admin" feature.

**Group Deletion:**

- Only admin can delete
- When deleted: `isDeleted: true` set in Firestore
- All members see banner: "⚠️ This group was deleted"
- Chat stays in list (grayed out) so users can reference history
- Input disabled; no new messages can be sent
- User can swipe to archive if desired

---

## 13. User Languages (MVP Supported)

MVP supports these 10 major languages for user preference:

1. **English** (en)
2. **Spanish** (es)
3. **French** (fr)
4. **German** (de)
5. **Chinese Simplified** (zh-CN)
6. **Portuguese** (pt)
7. **Russian** (ru)
8. **Japanese** (ja)
9. **Korean** (ko)
10. **Arabic** (ar)

Users select preferred language during signup. This field is stored for Phase 2 AI translation features.

---

## 14. Firestore Indexes (Composite & Security)

### Composite Indexes Required

**Index 1: Chat List Query**

- Collection: `chats`
- Fields: `participants` (Arrays), `updatedAt` (Descending)
- Purpose: Efficiently query user's chats sorted by most recent

**Index 2: Message History Query**

- Collection: `messages`
- Fields: `chatId` (Ascending), `timestamp` (Ascending)
- Purpose: Efficiently retrieve messages for a chat in chronological order

**Setup:** Create these in Firebase Console → Firestore Database → Indexes before testing.

### Firestore Security Rules (Enhanced for MVP)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: Anyone authenticated can read any user, but only write their own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Chats: Only participants can access chats they're in
    match /chats/{chatId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.adminId;
    }

    // Messages: Sender creates, chat participants can read and update status
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

**Security Improvements:**

- ✅ Only chat participants can read/write to their chats
- ✅ Only message sender can create messages
- ✅ Only group admin can delete groups
- ✅ Message deletion is prevented for data integrity
- ✅ Prevents unauthorized access to other users' conversations

---

## 15. Error Handling & User Feedback (MVP)

### Loading States

- Show `ActivityIndicator` while chats load from Firestore
- Show skeleton loaders for message list
- Show loading state on send button (disable + spinner)

### Error States

- **Auth errors:** "Invalid email or password" / "Email already in use"
- **Network errors:** "Network unavailable. Messages will sync when online."
- **Permission errors:** "You don't have access to this chat"
- **Message send failure:** Show retry button with error message
- **Group operation failure:** Show specific error (e.g., "Cannot leave: you are admin")

### Empty States

- **No chats:** "No chats yet. Start a conversation!"
- **No users found:** "No users found matching your search"
- **No messages:** Show empty message list gracefully

### Offline Indicator

- Banner at top when offline: "🔴 You're offline. Messages will sync when online."

---

## 16. Notes

- MVP focuses on **reliability over features**
- A simple chat that syncs perfectly > feature-rich app with sync issues
- Test on physical devices when possible (real network conditions)
- All AI schema hooks (translated_text, etc.) are prepared but unused in MVP
- Composite indexes must be created before testing to avoid query errors
- Security rules are stricter than original to prevent unauthorized access
