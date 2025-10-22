# Unilang Phase 2 - Implementation Tasklist

**Version:** v2.0 (APPROVED)  
**Status:** READY TO START

---

## SETUP TASKS

- [ ] Enable Firebase Cloud Storage
  - Go to Firebase Console → Build → Storage
  - Create new bucket (default location)
  - Download google-services.json (Android) + GoogleService-Info.plist (iOS)
- [ ] Install new dependencies

  ```bash
  npm install react-native-image-picker expo-image-picker react-native-image-resizer
  npm install @react-native-firebase/storage
  ```

- [ ] Add image compression library

  ```bash
  npm install react-native-image-resizer
  ```

- [ ] Update Firestore security rules (add Storage rules)
- [ ] Create Firestore TTL policy for typingStatus collection
- [ ] Create composite index for messages (chatId + timestamp) if not exists

---

## 1: Setup + Pending/Syncing + Rate Limiting (3 hours)

### Task 1.1: Setup Firebase Storage & Create New Collections (0.5h)

- [ ] Enable Cloud Storage in Firebase Console
- [ ] Test Storage upload/download in service layer
- [ ] Create `typingStatus` collection structure
- [ ] Verify Firestore TTL policy is enabled

**Code File:** `src/services/storageService.ts` (NEW)

### Task 1.2: Implement Pending/Syncing Indicator (1h)

- [ ] Add `localStatus: "pending" | "sent"` field to message types
- [ ] Implement NetInfo listener in app initialization
- [ ] Add pending status detection in messageService
- [ ] Update MessageBubble to show clock icon for pending messages
- [ ] Add "Syncing..." toast notification
- [ ] Test: Send message offline, verify gray clock icon + toast

**Code Files:**

- `src/types/Message.ts` (update)
- `src/services/messageService.ts` (update)
- `src/components/MessageBubble.tsx` (update)
- `src/utils/formatters.ts` (update icon helpers)

**Test Case:** Send 5 messages while offline → reconnect → verify all sync within 1s

### Task 1.3: Implement Rate Limiting

- [ ] Add rate limiting logic to chatStore
- [ ] Track last send time per chat
- [ ] Add client-side check (5 msgs/sec = 200ms minimum)
- [ ] Add toast & button disable on rate limit hit
- [ ] Disable send button for 2 seconds when limit exceeded
- [ ] Queue messages locally (still send after cooldown)

**Code Files:**

- `src/store/chatStore.ts` (update - add rate limit tracking)
- `src/screens/ChatsTab/ChatScreen.tsx` (update - add button disable logic)
- `src/utils/constants.ts` (add RATE_LIMIT_MS = 200)

**Test Case:** Send 6 messages in 1 second → verify 5th goes through, 6th shows toast + disabled button

---

## 2: Typing Indicators

### Task 2.1: Create Typing Status Service

- [ ] Create `src/services/typingService.ts`
- [ ] Implement `setTyping(chatId, userId, isTyping: boolean)`
- [ ] Implement `subscribeToTypingStatus(chatId, callback)`
- [ ] Add debounce logic (2 second batching)
- [ ] Set expiresAt = now() + 5000ms on each update
- [ ] Handle cleanup/unsubscribe

**Code File:** `src/services/typingService.ts` (NEW)

```typescript
// Example signature
export const setTyping = async (chatId: string, isTyping: boolean) => {
  const userId = auth.currentUser?.uid;
  await setDoc(
    doc(db, `typingStatus/${chatId}/${userId}`),
    {
      isTyping,
      expiresAt: serverTimestamp() + 5000,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
};
```

### Task 2.2: Add Typing Indicator UI to ChatScreen

- [ ] Add typing indicator banner below message list
- [ ] Show "UserA is typing..."
- [ ] Show "UserA and UserB are typing..."
- [ ] Show "3 people are typing..." for 3+
- [ ] Subscribe to typing status on mount
- [ ] Update in real-time as users type

**Code Files:**

- `src/screens/ChatsTab/ChatScreen.tsx` (update - add typing banner)
- `src/components/TypingIndicator.tsx` (NEW)

**Test Case:** 3 users typing simultaneously → verify banner updates < 500ms for each

### Task 2.3: Add Typing Event Detection

- [ ] On TextInput onChange → debounced call to setTyping(true)
- [ ] On input cleared → call setTyping(false)
- [ ] Debounce timing: 500ms window

**Code Files:**

- `src/screens/ChatsTab/ChatScreen.tsx` (update - add typing trigger)

**Test Case:** Type in input → "User is typing..." appears within 500ms

---

## 3: Who-Read Receipts

### Task 3.1: Extend Message Schema for readBy (0.5h)

- [ ] Add `readBy: string[]` to Message type
- [ ] Initialize as empty array when message created
- [ ] Update Firestore schema documentation

**Code Files:**

- `src/types/Message.ts` (update - add readBy field)
- `src/services/messageService.ts` (update - initialize readBy)

### Task 3.2: Implement Mark as Read Logic (1h)

- [ ] Create `markMessagesAsRead(chatId, userId)` in messageService
- [ ] On ChatScreen mount/focus → call markMessagesAsRead
- [ ] Use batch update to add userId to readBy array
- [ ] Avoid duplicate reads (check if already in array)
- [ ] Update message status to "read"

**Code Files:**

- `src/services/messageService.ts` (update - add markMessagesAsRead)
- `src/screens/ChatsTab/ChatScreen.tsx` (update - call on mount)

```typescript
// Example
const markMessagesAsRead = async (chatId: string, userId: string) => {
  const messages = await getUnreadMessages(chatId);
  const batch = writeBatch(db);

  messages.forEach((msg) => {
    batch.update(doc(db, "messages", msg.id), {
      readBy: arrayUnion(userId),
      status: "read",
    });
  });

  await batch.commit();
};
```

### Task 3.3: Add Read Receipt UI - Direct Chat

- [ ] Create `ReadReceiptBadge` component
- [ ] Show user avatar (small, 24px)
- [ ] Show "Read 5:30 PM" text
- [ ] Display on last message in bubble (direct chats)
- [ ] Handle case where multiple users (show up to 2)

**Code Files:**

- `src/components/ReadReceiptBadge.tsx` (NEW)
- `src/components/MessageBubble.tsx` (update - add badge)

### Task 3.4: Add Read Receipt UI - Group Chat

- [ ] Extend ReadReceiptBadge for groups
- [ ] Show up to 3 avatars in a row
- [ ] Add "+N more" badge if more than 3 read
- [ ] On tap: Show modal with full list
- [ ] Show timestamp of last read

**Code Files:**

- `src/components/ReadReceiptBadge.tsx` (update - group support)
- `src/components/ReadReceiptModal.tsx` (NEW - show full list)

**Test Case:** User A sends message → User B opens chat → "Read by" badge appears < 500ms

---

## 4: Message Pagination + Profile Upload

### Task 4.1: Implement Message Pagination (2h)

- [ ] Add pagination logic to messageService
- [ ] Initial load: `limit(20).orderBy("timestamp", "desc")`
- [ ] Next page: `startAfter(oldestMessage).limit(20)`
- [ ] Track `lastVisibleMessage` in chatStore

**Code Files:**

- `src/services/messageService.ts` (update - add pagination)
- `src/store/chatStore.ts` (update - track pagination state)

```typescript
// Example
export const loadMoreMessages = async (chatId: string) => {
  const lastMsg = chatStore.getLastVisibleMessage(chatId);
  const query = collection(db, `chats/${chatId}/messages`)
    .orderBy("timestamp", "desc")
    .startAfter(lastMsg.timestamp)
    .limit(20);

  const docs = await getDocs(query);
  return docs.docs.map((d) => d.data());
};
```

### Task 4.2: Add "Load Earlier Messages" Button

- [ ] Add button at top of message list
- [ ] Show spinner while loading
- [ ] Append loaded messages to top
- [ ] Hide button when reach 500-message limit or end of history
- [ ] Test smooth scroll performance

**Code Files:**

- `src/screens/ChatsTab/ChatScreen.tsx` (update - add button + logic)

**Test Case:** Scroll to top → Load Earlier button appears → tap → 20 messages load smoothly

### Task 4.3: Implement Profile Picture Upload

- [ ] Add ImagePicker to Profile screen
- [ ] Compress image to 200x200px, 85% JPEG quality
- [ ] Upload to Storage: `/avatars/{userId}.jpg`
- [ ] Save URL to user doc: `profilePictureUrl`
- [ ] Show progress during upload
- [ ] Update profile UI after successful upload

**Code Files:**

- `src/services/storageService.ts` (add uploadProfilePicture)
- `src/screens/ProfileTab/ProfileScreen.tsx` (update - add image picker)
- `src/components/AvatarUpload.tsx` (NEW - upload component)

**Test Case:** Select image → compress + upload → verify appears in profile + chat list < 3s

---

## 5: Image Attachments + Delete Chat

### Task 5.1: Add Image Attachment Message Type

- [ ] Add `type: "text" | "image"` to Message type
- [ ] Add `imageUrl`, `imageWidth`, `imageHeight` fields
- [ ] Create message with type: "image" on upload
- [ ] Compress image to 800px width, 85% JPEG quality
- [ ] Upload to Storage: `/messages/{chatId}/{messageId}.jpg`

**Code Files:**

- `src/types/Message.ts` (update - add type + image fields)
- `src/services/messageService.ts` (update - add sendImageMessage)
- `src/services/storageService.ts` (update - add uploadMessageImage)

### Task 5.2: Add Image Preview in ChatScreen

- [ ] Add 📎 attachment button next to send button
- [ ] Show selected image thumbnail (100x100px) below input
- [ ] Display inline image preview in message bubble (300px width)
- [ ] Add progress bar during upload
- [ ] On tap image: Open fullscreen modal with zoom capability

**Code Files:**

- `src/screens/ChatsTab/ChatScreen.tsx` (update - add 📎 button + preview)
- `src/components/ImageMessage.tsx` (NEW - inline preview)
- `src/components/ImageZoomModal.tsx` (NEW - fullscreen view)

**Test Case:** Tap 📎 → Select image → Shows thumbnail → Upload shows progress → Image appears inline

### Task 5.3: Implement Delete Chat Feature

- [ ] Add long-press handler on chat item → show "Delete Chat" option
- [ ] Show confirmation modal: "Delete chat for you only"
- [ ] On confirm: Add userId to `deletedBy` array
- [ ] Hide chat locally immediately
- [ ] Hide chat from chat list query (filter out where userId in deletedBy)

**Code Files:**

- `src/services/chatService.ts` (update - add deleteChat method)
- `src/screens/ChatsTab/ChatListScreen.tsx` (update - add long-press, filter deleted)
- `src/components/DeleteChatModal.tsx` (NEW)

### Task 5.4: Add Cloud Function for Auto-Purge

- [ ] Create Cloud Function triggered on chat update
- [ ] Check if `deletedBy.length === participants.length`
- [ ] If true: Delete chat doc + all message docs
- [ ] Log deletion event

**Code Files:**

- `functions/src/triggers/onChatDelete.ts` (NEW)
- Deploy: `firebase deploy --only functions`

**Test Case:** User A deletes → hidden for A. User B deletes → both chat + messages auto-deleted

---

## INTEGRATION & TESTING (Ongoing)

### Daily Testing Checklist

**Day 1:**

- [ ] Offline → Online sync works < 1s
- [ ] Rate limit triggered at 6th message in 1s
- [ ] Button disabled for 2 seconds

**Day 2:**

- [ ] Typing indicators show < 500ms
- [ ] Banner updates correctly for 1, 2, 3+ users
- [ ] Typing expires after 5 seconds of no input

**Day 3:**

- [ ] Read receipts appear < 500ms
- [ ] Avatar badges show correctly in direct/group
- [ ] "Read by X more" modal works

**Day 4:**

- [ ] Load Earlier button appears
- [ ] 20 messages load smoothly
- [ ] Profile picture uploads < 3s
- [ ] Avatar cached for fast reload

**Day 5:**

- [ ] Image message sends with progress indicator
- [ ] Inline preview displays correctly
- [ ] Zoom modal opens on tap
- [ ] Delete chat hides for user only
- [ ] Cloud Function auto-purges after all delete

### Unit Tests to Add

- [ ] 5 tests for typingService (set, subscribe, expire)
- [ ] 4 tests for readBy logic (mark as read, batch update)
- [ ] 3 tests for rate limiting
- [ ] 3 tests for pagination
- [ ] 4 tests for image upload
- [ ] 3 tests for delete chat
- [ ] 3 tests for storage operations

**Target:** 25+ new unit tests (total ≥ 128)

---

## DEPLOYMENT CHECKLIST

- [ ] All 25+ unit tests passing
- [ ] Manual E2E test on iOS simulator
- [ ] Manual E2E test on Android emulator
- [ ] Test on physical device (network variations)
- [ ] Verify Firebase quota usage (should be <20% free tier)
- [ ] Cloud Storage rules updated
- [ ] Cloud Function deployed
- [ ] Memory bank updated with Phase 2 completion
- [ ] README updated with new features

---

## NOTES

- Use `expo-image-picker` for consistent cross-platform behavior
- Image compression must happen before upload (critical for speed)
- Test on real devices for network/battery variations
- Monitor Firebase console for quota warnings
- Keep messages collection lean (no unnecessary fields)
- All new features require corresponding unit tests

**Status:** ✅ Ready to start Day 1
