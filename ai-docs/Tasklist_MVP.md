# Unilang MVP - Task List with Implementation Guide

---

## Phase 1: Project Setup & Authentication

### 1.1 Project Initialization

- [ ] ✅ Create new Expo project with TypeScript

  - Run: `npx create-expo-app@latest Unilang --template blank-typescript`
  - Test app runs: `npx expo start`

- [ ] ✅ Install dependencies:

  ```bash
  npx expo install firebase
  npm install react-native-paper react-native-safe-area-context
  npm install zustand
  npx expo install expo-notifications expo-device expo-constants
  npm install @react-navigation/native @react-navigation/native-stack
  npx expo install react-native-screens react-native-safe-area-context
  npm install @react-native-google-signin/google-signin
  ```

- [ ] Configure app.json

  - Update `name`, `slug` to "Unilang"
  - Add `icon` and `splash` placeholders
  - Add notification configuration under `ios` and `android` sections

- [ ] Setup project structure
  ```
  src/
    screens/       (AuthScreen, ChatListScreen, ChatScreen, etc.)
    components/    (MessageBubble, ChatListItem, etc.)
    services/      (firebase.ts, auth.ts, firestore.ts)
    store/         (authStore.ts, chatStore.ts)
    types/         (User.ts, Message.ts, Chat.ts)
    utils/         (helpers.ts, constants.ts)
  ```

### 1.2 Firebase Setup

- [ ] Create Firebase project in console

  - Go to firebase.google.com → Create new project
  - Name it "Unilang"

- [ ] Enable Firestore Database

  - Firebase Console → Build → Firestore Database → Create
  - Start in test mode initially

- [ ] Enable Firebase Authentication

  - Firebase Console → Build → Authentication → Get Started
  - Enable Email/Password provider
  - Enable Google Sign-In provider

- [ ] Enable Cloud Messaging (FCM)

  - Firebase Console → Build → Cloud Messaging
  - Copy Server Key for later

- [ ] Add Firebase config to project

  - Create `src/services/firebase.ts`
  - Add iOS and Android apps in Firebase Console
  - Copy config object (apiKey, authDomain, etc.)
  - Initialize Firebase: `initializeApp(firebaseConfig)`

- [ ] Initialize Firebase in app

  - Import firebase config in App.tsx
  - Ensure it initializes before rendering

- [ ] Enable Firestore offline persistence

  - In firebase.ts: `enableIndexedDbPersistence(db)` for web
  - For React Native: persistence enabled by default

- [ ] Setup Firestore security rules

  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == userId;
      }
      match /chats/{chatId} {
        allow read, write: if request.auth != null &&
          request.auth.uid in resource.data.participants;
      }
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null &&
          request.auth.uid == request.resource.data.senderId;
        allow update: if request.auth != null;
      }
    }
  }
  ```

- [ ] Setup Firebase Cloud Functions project

  - In project root: `firebase init functions`
  - Choose TypeScript
  - Creates `functions/` directory

- [ ] **Create Composite Indexes in Firestore** (CRITICAL)
  - Go to Firebase Console → Firestore Database → Indexes
  - **Index 1:** Collection `chats`, Fields: `participants` (Arrays), `updatedAt` (Descending)
    - Purpose: Efficiently query user's chats sorted by most recent
  - **Index 2:** Collection `messages`, Fields: `chatId` (Ascending), `timestamp` (Ascending)
    - Purpose: Efficiently retrieve messages for a chat in chronological order
  - ⏱️ Wait for indexes to build (usually 2-5 minutes per index)
  - Verify both show "Enabled" status before proceeding with testing

### 1.3 Authentication Implementation

- [ ] Create authentication service module

  - Create `src/services/auth.ts`
  - Export functions: `signUp`, `signIn`, `signInWithGoogle`, `signOut`, `onAuthStateChanged`

- [ ] Implement email/password sign up

  - Use `createUserWithEmailAndPassword(auth, email, password)`
  - After success, create user document in Firestore `users/{uid}`
  - Include: name, email, preferred_language, status: "online", createdAt

- [ ] Implement email/password login

  - Use `signInWithEmailAndPassword(auth, email, password)`
  - Update user status to "online" in Firestore

- [ ] Implement Google Sign-In

  - Configure Google Sign-In in Firebase Console
  - Use `@react-native-google-signin/google-signin` library
  - Get Google ID token → sign in with `signInWithCredential(auth, credential)`
  - Create user document if first time

- [ ] Setup auth state observer

  - Use `onAuthStateChanged(auth, callback)` in App.tsx
  - Update global auth state (Zustand store)

- [ ] Create auth context/store (Zustand)

  - Create `src/store/authStore.ts`
  - State: `user`, `loading`, `isAuthenticated`
  - Actions: `setUser`, `clearUser`, `setLoading`

- [ ] Build Login screen UI

  - Create `src/screens/LoginScreen.tsx`
  - Use React Native Paper: `TextInput`, `Button`
  - Email and password inputs
  - Login button → call `signIn()` from auth service
  - "Don't have account? Sign up" link

- [ ] Build Sign Up screen UI

  - Create `src/screens/SignUpScreen.tsx`
  - Inputs: name, email, password, confirm password
  - Dropdown/picker for preferred language

- [ ] Add preferred language selection on sign-up

  - Use `Picker` or custom modal with language options
  - Support these 10 languages:
    1. English (en)
    2. Spanish (es)
    3. French (fr)
    4. German (de)
    5. Chinese Simplified (zh-CN)
    6. Portuguese (pt)
    7. Russian (ru)
    8. Japanese (ja)
    9. Korean (ko)
    10. Arabic (ar)
  - Store in user document: `preferred_language: "en"`

- [ ] Handle auth errors (display to user)

  - Wrap auth calls in try-catch
  - Show error with `Alert.alert()` or Snackbar from React Native Paper

- [ ] Create user document in Firestore on sign-up
  - After `createUserWithEmailAndPassword`, use `setDoc(doc(db, 'users', uid), userData)`
  - Include all required User fields from PRD

---

## Phase 2: Core Messaging Infrastructure

### 2.1 Data Models & Services

- [ ] Create User data model/interface

  - Create `src/types/User.ts`

  ```typescript
  interface User {
    uid: string;
    name: string;
    email: string;
    preferred_language: string;
    status: "online" | "offline";
    lastSeen: string;
    fcmToken?: string;
    createdAt: string;
  }
  ```

- [ ] Create Message data model/interface

  - Create `src/types/Message.ts`

  ```typescript
  interface Message {
    id: string;
    chatId: string;
    senderId: string;
    text: string;
    timestamp: string;
    status: "sending" | "sent" | "delivered" | "read";
    ai: {
      translated_text: string;
      detected_language: string;
      summary: string;
    };
  }
  ```

- [ ] Create Chat data model/interface

  - Create `src/types/Chat.ts`

  ```typescript
  interface Chat {
    id: string;
    type: "direct" | "group";
    name?: string;
    participants: string[];
    adminId?: string;
    isDeleted: boolean;
    lastMessage: string;
    lastMessageTime: string;
    updatedAt: string;
    createdBy: string;
    createdAt: string;
  }
  ```

- [ ] Create Firestore service module (CRUD operations)

  - Create `src/services/firestore.ts`
  - Export generic functions: `createDoc`, `updateDoc`, `deleteDoc`, `getDoc`, `queryDocs`

- [ ] Create message service (send, receive, update status)

  - Create `src/services/messageService.ts`
  - `sendMessage(chatId, text, senderId)`: Use `addDoc(collection(db, 'messages'), {...})`
  - `subscribeToMessages(chatId, callback)`: Use `onSnapshot(query(collection(db, 'messages'), where('chatId', '==', chatId), orderBy('timestamp')), callback)`
  - `updateMessageStatus(messageId, status)`: Use `updateDoc(doc(db, 'messages', messageId), {status})`

- [ ] Create chat service (create, fetch, update)

  - Create `src/services/chatService.ts`
  - `createDirectChat(userId1, userId2)`: Check if exists, else create in `chats` collection
  - `createGroupChat(name, participants, adminId)`: Use `addDoc` with Chat data
  - `subscribeToUserChats(userId, callback)`: Use `onSnapshot(query(collection(db, 'chats'), where('participants', 'array-contains', userId), orderBy('updatedAt', 'desc')))`
  - `updateChat(chatId, updates)`: Use `updateDoc`

- [ ] Create user service (profile, status, presence)
  - Create `src/services/userService.ts`
  - `updateUserStatus(userId, status)`: Update `status` and `lastSeen` fields
  - `updateUserProfile(userId, updates)`: Use `updateDoc`
  - `subscribeToUserPresence(userId, callback)`: Use `onSnapshot(doc(db, 'users', userId))`
  - `getAllUsers()`: Use `getDocs(collection(db, 'users'))`

### 2.2 Chat List Screen

- [ ] Create ChatList screen UI

  - Create `src/screens/ChatListScreen.tsx`
  - Use FlatList to render list of chats
  - Header with app title "Unilang" and "New Chat" button

- [ ] Setup real-time listener for user's chats

  - In useEffect, call `subscribeToUserChats(currentUserId, (chats) => setChats(chats))`
  - Cleanup: unsubscribe on unmount

- [ ] Display chat list (sorted by lastMessageTime)

  - FlatList data already sorted from Firestore query
  - Create `ChatListItem` component

- [ ] Show last message preview

  - In ChatListItem: display `chat.lastMessage` (truncate if too long)

- [ ] Show timestamp (relative: "2m ago", "Yesterday")

  - Create helper function `formatRelativeTime(timestamp)` in utils
  - Use library like `date-fns` or custom logic

- [ ] Show unread count badge (if applicable)

  - Query messages with `status != 'read'` for this chat
  - Display count in badge (use React Native Paper Badge)

- [ ] Handle empty state (no chats)

  - If `chats.length === 0`, show "No chats yet" message with "Start chatting" button

- [ ] Add pull-to-refresh

  - Use `refreshControl` prop on FlatList
  - Manually refetch chats (or rely on real-time listener)

- [ ] Navigate to chat screen on tap
  - onPress → `navigation.navigate('Chat', { chatId, chatName })`

### 2.3 One-on-One Chat Screen

- [ ] Create Chat screen UI (message list + input)

  - Create `src/screens/ChatScreen.tsx`
  - FlatList for messages (inverted for bottom-up scrolling)
  - TextInput + Send IconButton at bottom

- [ ] Setup real-time message listener for chatId

  - Get chatId from route params
  - In useEffect: `subscribeToMessages(chatId, (messages) => setMessages(messages))`

- [ ] Display messages (sender name, text, timestamp)

  - Create `MessageBubble` component
  - Different styles for own messages vs others
  - Show sender name if group chat
  - Format timestamp: `formatTime(message.timestamp)`

- [ ] Show message status indicators (✓ sent, ✓✓ delivered, ✓✓ read)

  - In MessageBubble, render icons based on `message.status`
  - Use `Ionicons` or custom SVG
  - Blue checkmarks for "read"

- [ ] Implement message input field

  - Use TextInput with multiline support
  - Placeholder: "Type a message..."
  - Track input value in state

- [ ] Implement send button

  - IconButton (paper plane icon)
  - onPress → call sendMessage function
  - Disable if input is empty

- [ ] **Optimistic UI:** Show message immediately on send

  - Create temporary message object with status: "sending" and temp ID
  - Add to local state immediately
  - Call `sendMessage()` which returns real message ID
  - Replace temp message with real one

- [ ] Update message with server ID after sync

  - In sendMessage callback, update local state with real message from Firestore

- [ ] Handle send errors (retry mechanism)

  - Wrap sendMessage in try-catch
  - On error, set message status to "failed"
  - Show retry button or auto-retry after delay

- [ ] **Implement Simple Status Model (MVP):**

  - ✓ Sent: Message successfully written to Firestore
  - ✓✓ Delivered: Show once message received by ANY participant
  - ✓✓ Read (blue): Show once message opened by ANY participant
  - Note: NOT per-participant tracking. Phase 2 can upgrade.

- [ ] Auto-scroll to bottom on new message

  - Use FlatList ref: `flatListRef.current?.scrollToEnd()`
  - Trigger on new message or keyboard show

- [ ] Message grouping by sender (consecutive messages)

  - Check if previous message has same senderId
  - If yes, reduce spacing and hide sender name

- [ ] Show "Today", "Yesterday" date separators
  - Group messages by date
  - Render date header between groups

### 2.4 Message Status System

- [ ] Implement "sent" status (message left device)

  - Set status: "sent" after `addDoc` succeeds

- [ ] Implement "delivered" status (reached recipient device)

  - Update status to "delivered" when recipient's device receives it
  - Use Cloud Function or client-side logic: when user opens app, update all "sent" messages in their chats to "delivered"

- [ ] Implement "read" status (recipient opened chat)

  - When user opens chat screen, mark all unread messages as "read"
  - Batch update: `updateDoc` for each message or use `writeBatch()`

- [ ] Update status in real-time via Firestore

  - Real-time listener automatically updates message list when status changes

- [ ] Visual indicators: ✓ (sent), ✓✓ (delivered), ✓✓ blue (read)

  - Use conditional rendering in MessageBubble
  - Import icons from react-native-vector-icons or Ionicons

- [ ] Mark messages as read when chat screen is visible

  - In useEffect when screen focused, call `markMessagesAsRead(chatId, currentUserId)`

- [ ] Update read receipts for all unread messages on chat open
  - Query messages where `status != 'read'` and `senderId != currentUserId`
  - Update each to `status: 'read'`

---

### 2.4b Message Status System (Simple MVP Approach)

**MVP Status Flow:**

1. User sends message → status: "sending" (optimistic UI)
2. Message written to Firestore → status: "sent"
3. ANY participant device receives message → status: "delivered"
4. ANY participant opens chat → ALL unread messages → status: "read"

**Key Difference from WhatsApp:**

- NOT tracking per-participant read/delivery status
- Show ✓✓ delivered once ANY person receives
- Show ✓✓ blue once ANY person reads
- Simplifies implementation significantly
- Phase 2 can add per-participant tracking

### 2.5 Offline Support

- [ ] Verify Firestore offline persistence is enabled

  - Check firebase.ts initialization
  - For React Native, it's enabled by default

- [ ] Queue messages when offline

  - Firestore automatically queues writes when offline
  - Messages show "sending" status

- [ ] Sync messages when back online

  - Firestore automatically syncs on reconnect
  - Status updates from "sending" to "sent"

- [ ] Show "connecting..." indicator when offline

  - Use NetInfo from `@react-native-community/netinfo`
  - Subscribe to network state: `NetInfo.addEventListener(state => setIsConnected(state.isConnected))`
  - Show banner at top if offline

- [ ] Test: Send messages offline → go online → verify sync

  - Manual testing: enable airplane mode, send messages, disable airplane mode

- [ ] Retry failed messages automatically

  - If message status stays "sending" for > 10s, retry
  - Use setTimeout or retry library

- [ ] Show pending/failed status in UI
  - Gray checkmark for "sending", red icon for "failed"

---

## Phase 3: User Presence & Profile

### 3.1 User Presence System

- [ ] Update user status to "online" on app open

  - In App.tsx or useEffect: when auth state changes to logged in, call `updateUserStatus(userId, 'online')`

- [ ] Update user status to "offline" on app close/background

  - Use `AppState` from React Native
  - Subscribe: `AppState.addEventListener('change', handleAppStateChange)`
  - If state becomes "background" or "inactive", call `updateUserStatus(userId, 'offline')`

- [ ] Update lastSeen timestamp

  - When setting status to "offline", also update `lastSeen: new Date().toISOString()`

- [ ] Setup real-time listener for other user's status

  - In chat screen header, subscribe to recipient's user document
  - Update presence indicator when status changes

- [ ] Display online/offline indicator (green dot) in chat

  - In chat header, show green dot if `recipient.status === 'online'`
  - Use View with borderRadius and backgroundColor

- [ ] Display "last seen" timestamp when offline

  - If offline, show "Last seen 5 minutes ago" below name
  - Format using `formatRelativeTime(recipient.lastSeen)`

- [ ] Handle app state changes (active/background/inactive)
  - Test on physical device (simulators behave differently)

### 3.2 User Profile

- [ ] Create Profile screen UI

  - Create `src/screens/ProfileScreen.tsx`
  - Layout: Avatar placeholder, name, email, preferred language
  - Edit button for name and language

- [ ] Display current user name and email

  - Fetch from auth store or Firestore user document

- [ ] Display preferred language

  - Show current selection

- [ ] Add edit display name functionality

  - Modal or inline edit with TextInput
  - Save button → call `updateUserProfile(userId, { name })`

- [ ] Add change preferred language functionality

  - Dropdown/picker with language options
  - Save → call `updateUserProfile(userId, { preferred_language })`

- [ ] Update user document in Firestore

  - Use `updateDoc(doc(db, 'users', userId), updates)`

- [ ] Add placeholder avatar icon

  - Use Ionicons "person-circle" or similar

- [ ] Add logout button
  - Call `signOut(auth)` → navigate to LoginScreen

### 3.3 Contact/User Selection

- [ ] Create user search/selection screen

  - Create `src/screens/NewChatScreen.tsx`
  - List all users

- [ ] Fetch all users from Firestore

  - Use `getAllUsers()` from userService
  - Filter out current user

- [ ] Display user list (name, email, online status)

  - FlatList with user items
  - Show green dot if online

- [ ] Search/filter users by name

  - TextInput at top for search query
  - Filter users array based on name match

- [ ] Create new direct chat on user selection

  - onPress user → call `createDirectChat(currentUserId, selectedUserId)`
  - Navigate to chat screen with new chatId

- [ ] Check if chat already exists (avoid duplicates)
  - Query chats where `participants` array contains both user IDs
  - If exists, navigate to existing chat

---

## Phase 4: Group Chat

### 4.1 Group Creation

- [ ] Create "New Group" screen UI

  - Create `src/screens/NewGroupScreen.tsx`
  - Step 1: Select participants (multi-select list)
  - Step 2: Enter group name

- [ ] Input field for group name

  - TextInput with placeholder "Group Name"

- [ ] Multi-select user list for participants

  - FlatList with checkboxes
  - Track selected users in state array

- [ ] Create group chat document in Firestore

  - Call `createGroupChat(groupName, selectedUserIds, currentUserId)`
  - Use `addDoc(collection(db, 'chats'), chatData)`

- [ ] Set creator as adminId

  - In chat document: `adminId: currentUserId`

- [ ] Initialize participants array

  - Include current user + selected users

- [ ] Navigate to group chat after creation
  - After creation, navigate to ChatScreen with new chatId

### 4.2 Group Chat Screen

- [ ] Display group name in header

  - Get from route params or chat document
  - Show in header title

- [ ] Show participant count in header

  - Subtitle: "3 participants"

- [ ] Setup real-time message listener for group

  - Same as one-on-one: `subscribeToMessages(chatId, callback)`

- [ ] Display messages with sender names

  - In MessageBubble, fetch sender name from users collection
  - Show above message text (except for own messages)

- [ ] Message status shows "delivered" when all received

  - Track delivery status per participant (advanced)
  - For MVP: show "delivered" once any participant receives

- [ ] Message status shows "read" when all read

  - Track read status per participant (advanced)
  - For MVP: show "read" once any participant reads

- [ ] Different UI for own messages vs others
  - Own messages: right-aligned, blue background
  - Others: left-aligned, gray background

### 4.3 Group Management (Admin)

- [ ] Create "Group Info" screen

  - Create `src/screens/GroupInfoScreen.tsx`
  - Accessible via header button in group chat

- [ ] Display participant list

  - FlatList of users in `chat.participants`
  - Fetch user details for each participant ID

- [ ] Show admin badge on creator

  - If `user.uid === chat.adminId`, show "Admin" label

- [ ] **Edit group name** (admin only)

  - Show edit button if current user is admin
  - Modal with TextInput for new name
  - Save → call `updateChat(chatId, { name: newName })`

- [ ] **Add members:** Multi-select from user list (admin only)

  - Button "Add Members" (visible only to admin)
  - Open user selection screen
  - On selection, update `participants` array: `updateChat(chatId, { participants: [...existing, ...newUsers] })`

- [ ] **Remove members:** Swipe/tap to remove (admin only)

  - Swipeable list item or long-press menu
  - Confirmation dialog: "Remove [name] from group?"
  - Remove from array: `updateChat(chatId, { participants: participants.filter(id => id !== removedId) })`

- [ ] Update participants array in Firestore

  - Use `updateDoc` with new participants array

- [ ] **Delete group:** Confirmation dialog (admin only)

  - Button "Delete Group" (red, at bottom)
  - Confirmation: "Are you sure? This cannot be undone."
  - Set `isDeleted: true` in chat document
  - Navigate back to chat list

- [ ] Set isDeleted: true in Firestore

  - Use `updateDoc(doc(db, 'chats', chatId), { isDeleted: true })`

- [ ] Show "This group was deleted" message for all members

  - In ChatScreen, check if `chat.isDeleted === true`
  - If true, disable input and show banner: "This group was deleted"

- [ ] Hide management buttons for non-admin users

  - Conditionally render based on `currentUserId === chat.adminId`

- [ ] **Prevent admin from leaving group (MVP constraint)**

  - In "Leave Group" button, check if `currentUserId === chat.adminId`
  - If true, show alert: "Admins cannot leave. Delete the group or transfer admin rights (Phase 2)."
  - Disable leave button for admin

- [ ] **Prevent admin from removing themselves**
  - When removing a member, check if `removedUserId === chat.adminId`
  - Show alert: "Admin cannot remove themselves."

### 4.4 Group Management (Members)

- [ ] **Leave group:** Button in Group Info screen

  - Button "Leave Group" (visible to all members)
  - Red text/color

- [ ] Confirmation dialog for leaving

  - "Are you sure you want to leave this group?"

- [ ] Remove self from participants array

  - Call `updateChat(chatId, { participants: participants.filter(id => id !== currentUserId) })`

- [ ] Navigate back to chat list

  - After leaving, navigate to ChatListScreen

- [ ] Show system message: "You left the group"
  - Optionally add system message to chat before leaving

### 4.5 Group Edge Cases

- [ ] Handle when last member leaves (auto-delete group?)

  - If `participants.length === 0`, set `isDeleted: true`

- [ ] Handle when admin leaves (what happens?)

  - Decision: Transfer admin to next member, or prevent admin from leaving
  - For MVP: Prevent admin from leaving (show error message)

- [ ] Prevent admin from removing themselves

  - Check if removed user is admin, show error

- [ ] Update lastMessage when members join/leave
  - Add system messages: "Alice added Bob" or "Charlie left"

---

## Phase 5: Push Notifications

### 5.1 FCM Setup

- [ ] Configure FCM in Firebase console

  - Already done in Phase 1
  - Ensure Cloud Messaging is enabled

- [ ] Setup expo-notifications in app

  - Install: `npx expo install expo-notifications`
  - Import and configure in App.tsx

- [ ] Request notification permissions

  - Use `Notifications.requestPermissionsAsync()`
  - Call on app launch (if not granted)

- [ ] Get device FCM token

  - Use `Notifications.getExpoPushTokenAsync()`
  - For Firebase: use `getToken()` from Firebase Messaging

- [ ] Store FCM token in user document

  - After getting token, call `updateUserProfile(userId, { fcmToken })`

- [ ] Update token on app launch
  - Check for token changes on each app launch
  - Update Firestore if changed

### 5.2 Cloud Functions

- [ ] Initialize Firebase Cloud Functions

  - Already done in Phase 1 (functions/ directory)

- [ ] Create onMessageCreate trigger

  - In `functions/src/index.ts`:

  ```typescript
  export const onMessageCreated = functions.firestore
    .document("messages/{messageId}")
    .onCreate(async (snap, context) => {
      const message = snap.data();
      // Send notification logic
    });
  ```

- [ ] Fetch recipient FCM tokens

  - Get chatId from message
  - Fetch chat document to get participants
  - Exclude sender from recipients
  - Fetch user documents for each recipient to get fcmTokens

- [ ] Send notification via FCM Admin SDK

  - Use `admin.messaging().sendMulticast()` or `send()`
  - Payload:

  ```javascript
  {
    notification: {
      title: senderName,
      body: messageText
    },
    data: {
      chatId: message.chatId,
      type: 'message'
    },
    tokens: recipientTokens
  }
  ```

- [ ] Deploy Cloud Function

  - Run: `firebase deploy --only functions`
  - Test by sending a message

- [ ] Add notification payload (title, body, data)

  - Customize notification based on chat type (direct vs group)

- [ ] **Badge count implementation**
  - Track total unread message count across all user's chats
  - Calculate: count all messages where `status != 'read'` and `senderId != currentUserId` across all user's chats
  - Call `Notifications.setBadgeCountAsync(totalUnreadCount)` after each message status change
  - Update badge in real-time as messages arrive and are marked read

### 5.3 Notification Handling

- [ ] Handle foreground notifications (show banner)

  - Use `Notifications.setNotificationHandler()` to control foreground behavior
  - Show banner even when app is open

- [ ] Handle background notifications (system tray)

  - System handles this automatically
  - Ensure proper payload format

- [ ] Navigate to chat on notification tap

  - Use `Notifications.addNotificationResponseReceivedListener()`
  - Extract chatId from notification data
  - Navigate to ChatScreen with chatId

- [ ] Update badge count

  - Track unread message count
  - Use `Notifications.setBadgeCountAsync(count)`

- [ ] Group notifications by chat
  - Use notification grouping/channeling for Android
  - iOS automatically groups by app

---

## Phase 6: Testing & Stability (Hours 23-24)

### 6.1 Core Functionality Tests

- [ ] **Test 1:** Two devices send/receive messages in real-time

  - Open app on 2 devices (or 1 device + emulator)
  - Send message from Device A → verify appears on Device B within 1 second
  - Send from B → verify on A

- [ ] **Test 2:** One device goes offline → messages queue → reconnect → sync

  - Device A: Enable airplane mode
  - Device B: Send messages to A
  - Device A: Disable airplane mode → verify messages appear

- [ ] **Test 3:** Force quit app → reopen → chat history intact

  - Force close app (swipe up on iOS, clear from recents on Android)
  - Reopen app → verify all chats and messages still there

- [ ] **Test 4:** Read receipts update correctly across devices

  - Device A sends message (should show ✓ sent)
  - Device B receives (A should see ✓✓ delivered)
  - Device B opens chat (A should see ✓✓ blue read)

- [ ] **Test 5:** Presence indicator toggles on app close/open

  - Device A: Close app or background it
  - Device B: Check A's status → should show offline + last seen
  - Device A: Reopen app
  - Device B: Should show green dot (online)

- [ ] **Test 6:** Group chat with 3+ participants works

  - Create group with 3 users
  - Each user sends message
  - Verify all receive all messages

- [ ] **Test 7:** Group creation, add/remove members, edit name

  - Create group, change name → verify updates for all
  - Admin adds member → verify new member sees chat
  - Admin removes member → verify removed member loses access

- [ ] **Test 8:** Admin deletes group → all members see deleted message

  - Admin taps "Delete Group"
  - All members' chat screens show "This group was deleted"
  - Chat disappears from chat list (or shows deleted state)

- [ ] **Test 9:** Member leaves group voluntarily

  - Non-admin member taps "Leave Group"
  - Member no longer sees group in chat list
  - Other members can still chat

- [ ] **Test 10:** Notifications fire (foreground + background)
  - Device A: App in foreground → send message from B → verify banner shows
  - Device A: App in background → send message from B → verify system notification
  - Tap notification → verify navigates to correct chat

### 6.2 Stress Testing

- [ ] **Rapid-fire test:** Send 20+ messages quickly without crashes

  - Write script or manually send 20+ messages in < 10 seconds
  - App should not crash, freeze, or lose messages
  - Check UI remains responsive during burst

- [ ] Test with poor network (throttled connection)

  - Use Chrome DevTools or network simulator
  - Throttle to "Slow 3G" or similar
  - Send messages → verify they eventually deliver
  - Check loading indicators appear

- [ ] Test with intermittent connectivity (airplane mode on/off)

  - Toggle airplane mode multiple times during chat session
  - Send messages during each state
  - Verify all messages sync correctly when back online

- [ ] Test with large message count (100+ messages in chat)

  - Create test data or send many messages
  - Verify FlatList scrolling remains smooth
  - Check memory usage doesn't spike

- [ ] Test with multiple group chats simultaneously
  - Create 3+ group chats
  - Send messages in each
  - Verify notifications and updates work for all

### 6.3 Bug Fixes & Polish

- [ ] Fix any crashes or freezes

  - Review crash logs from testing
  - Add error boundaries if needed
  - Fix identified issues

- [ ] Improve loading states (spinners, skeletons)

  - Add ActivityIndicator while chats load
  - Skeleton loaders for messages
  - Loading state for send button

- [ ] Add error messages for failed operations

  - If login fails: show specific error
  - If message send fails: show retry option
  - If network offline: show banner

- [ ] Optimize message list performance (virtualization)

  - FlatList already virtualizes
  - Use `windowSize` prop to optimize further
  - Memoize MessageBubble component with React.memo

- [ ] Fix keyboard issues (covers input, doesn't dismiss)

  - Use KeyboardAvoidingView around ChatScreen
  - Behavior: "padding" for iOS, "height" for Android
  - Enable keyboard dismiss on scroll

- [ ] Test on both iOS and Android
  - Run on iOS simulator
  - Run on Android emulator
  - Check platform-specific issues

### 6.4 Deployment (Optional)

- [ ] Test on local iOS simulator

  - Run: `npx expo run:ios`
  - Or use Expo Go

- [ ] Test on local Android emulator

  - Run: `npx expo run:android`
  - Or use Expo Go

- [ ] Deploy to Expo Go

  - Run: `eas build --profile development --platform all`
  - Or publish to Expo: `npx expo publish`
  - Share QR code for testing

- [ ] Test on physical device via Expo Go
  - Install Expo Go app
  - Scan QR code
  - Test real network conditions

---

## Phase 7: Documentation & Cleanup

### 7.1 Code Quality

- [ ] Add comments to complex logic

  - Comment Firebase queries
  - Explain optimistic UI logic
  - Document status update flow

- [ ] Remove console.logs and debug code

  - Search for console.log
  - Remove or replace with proper logging
  - Remove test data/hardcoded values

- [ ] Fix TypeScript any types

  - Search for `: any`
  - Add proper type annotations
  - Ensure type safety

- [ ] Organize imports

  - Group by: React, libraries, local
  - Remove unused imports
  - Use absolute imports if configured

- [ ] Clean up unused files/components
  - Remove boilerplate code
  - Delete unused components
  - Remove commented-out code

### 7.2 README

- [ ] Write setup instructions

  ```markdown
  # Unilang - Real-time Messaging App

  ## Setup

  1. Clone repository
  2. Install dependencies: `npm install`
  3. Setup Firebase project (see below)
  4. Run app: `npx expo start`
  ```

- [ ] List dependencies and versions

  - Document all npm packages used
  - Note Expo SDK version
  - List Firebase SDK version

- [ ] Add Firebase configuration steps

  ```markdown
  ## Firebase Setup

  1. Create project at firebase.google.com
  2. Enable Firestore, Auth, Cloud Messaging
  3. Add iOS/Android apps
  4. Download google-services.json (Android) and GoogleService-Info.plist (iOS)
  5. Copy Firebase config to src/services/firebase.ts
  6. Deploy Cloud Functions: `firebase deploy --only functions`
  ```

- [ ] Document environment variables

  - List required config values
  - Provide .env.example template
  - Explain where to find values

- [ ] Add troubleshooting section

  ```markdown
  ## Troubleshooting

  - **Messages not syncing:** Check Firestore security rules
  - **Notifications not working:** Verify FCM setup and Cloud Function deployment
  - **Auth errors:** Ensure Firebase Auth providers are enabled
  ```

---

## Critical Path (Must Complete for MVP)

These tasks MUST be done to pass MVP checkpoint:

### Tier 1: Blocking (App won't work without these)

1. ✅ Firebase setup + Firestore initialization
2. ✅ Authentication (email/password + Google)
3. ✅ Message send/receive with real-time sync
4. ✅ Firestore offline persistence enabled
5. ✅ Chat list with real-time updates
6. ✅ Basic message UI (send, display)

### Tier 2: Core MVP Features (Required for checkpoint)

7. ✅ Optimistic UI for messages
8. ✅ Message status indicators (sent/delivered/read)
9. ✅ Presence system (online/offline + last seen)
10. ✅ Group chat creation
11. ✅ Group management (add/remove/edit/delete/leave)
12. ✅ Push notifications (foreground minimum)

### Tier 3: Testing & Validation

13. ✅ All 10 core functionality tests passing
14. ✅ Rapid-fire stress test (20+ msgs/sec)
15. ✅ Offline/online sync verified

---

## Implementation Tips & Best Practices

### Real-Time Sync Strategy

```typescript
// Use onSnapshot for real-time updates
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
    setMessages(messages);
  }
);

// Always cleanup on unmount
return () => unsubscribe();
```

### Optimistic UI Pattern

```typescript
const sendMessage = async (text: string) => {
  // 1. Generate temporary ID
  const tempId = `temp_${Date.now()}`;

  // 2. Add to local state immediately
  const optimisticMessage = {
    id: tempId,
    text,
    status: "sending",
    timestamp: new Date().toISOString(),
    senderId: currentUserId,
    chatId,
  };
  setMessages((prev) => [...prev, optimisticMessage]);

  // 3. Send to Firestore
  try {
    const docRef = await addDoc(collection(db, "messages"), {
      text,
      chatId,
      senderId: currentUserId,
      timestamp: serverTimestamp(),
      status: "sent",
    });

    // 4. Real-time listener will update with real message
    // Optional: manually replace temp message
  } catch (error) {
    // Update optimistic message to failed state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === tempId ? { ...msg, status: "failed" } : msg
      )
    );
  }
};
```

### Firestore Query Best Practices

```typescript
// Always order by timestamp for consistent results
const messagesQuery = query(
  collection(db, "messages"),
  where("chatId", "==", chatId),
  orderBy("timestamp", "asc")
);

// For chat list, order by last message time
const chatsQuery = query(
  collection(db, "chats"),
  where("participants", "array-contains", userId),
  orderBy("updatedAt", "desc")
);

// Create composite indexes in Firestore if needed
```

### Error Handling Pattern

```typescript
try {
  await someFirestoreOperation();
} catch (error) {
  console.error("Operation failed:", error);

  // Show user-friendly error
  if (error.code === "permission-denied") {
    Alert.alert("Error", "You do not have permission to perform this action");
  } else if (error.code === "unavailable") {
    Alert.alert("Error", "Network error. Please check your connection.");
  } else {
    Alert.alert("Error", "Something went wrong. Please try again.");
  }
}
```

### Performance Optimization

```typescript
// Memoize expensive components
const MessageBubble = React.memo(
  ({ message }) => {
    // Component logic
  },
  (prevProps, nextProps) => {
    // Only re-render if message changed
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.status === nextProps.message.status
    );
  }
);

// Optimize FlatList
<FlatList
  data={messages}
  renderItem={renderMessage}
  keyExtractor={(item) => item.id}
  windowSize={10}
  maxToRenderPerBatch={20}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>;
```

### Security Rules Reminder

```javascript
// Don't forget to update Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any user but only write their own
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Only participants can read/write chats
    match /chats/{chatId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        request.auth.uid in resource.data.participants;
      allow delete: if request.auth != null &&
        request.auth.uid == resource.data.adminId;
    }

    // Messages readable by chat participants
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.senderId;
      allow update: if request.auth != null;
    }
  }
}
```

**Remember:** A working chat with basic features > feature-rich broken app
