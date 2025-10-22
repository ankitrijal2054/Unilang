# 🧹 Unilang – Phase 2 PRD

**Title:** Core Feature Completion (Offline UX + Rich Chat + Media + Deletion)
**Version:** v2.0 **Date:** Oct 2025
**Status:** ✅ APPROVED FOR IMPLEMENTATION

---

## 1. Overview

**Goal:**
Advance Unilang from MVP reliability to production readiness by improving offline visibility, interactivity, scalability, and user control — including typing indicators, read receipts, message pagination, image support, and controlled chat deletion.

**Outcome:**
A WhatsApp-class chat experience with pending/sync states, live typing indicators, individual read receipts, rich media support, and safe per-user chat deletion.

**Focus:** Simplicity + reliability over scale

---

## 2. Objectives

| Objective        | KPI / Metric              | Target                       |
| ---------------- | ------------------------- | ---------------------------- |
| Offline clarity  | Pending → Sent transition | < 1 s                        |
| Live interaction | Typing & read updates     | < 500 ms                     |
| Message history  | Pagination load time      | < 2 s                        |
| Media uploads    | Image upload completion   | < 3 s avg                    |
| User control     | Delete chat functionality | Per-user, reversible history |
| Code quality     | Test coverage             | ≥ 110 tests                  |
| Stability        | No crashes under stress   | 20+ msgs/sec                 |

---

## 3. Core Features & Detailed Specs

### 3.1 Pending / Syncing Indicator ⏳

**Behavior:**

- Detect offline via `NetInfo.fetch()` → set `localStatus: "pending"` on messages
- Show **gray clock icon** + "Syncing..." toast when offline
- Auto-update to `sent` on reconnect (no explicit action needed)

**UI:**

- Message bubble: Gray color + clock icon (vs. normal + checkmark)
- Toast notification: "You're offline. Messages will sync when online."

**Implementation Details:**

- Check network status on app resume
- Add `localStatus` field to message (temporary, local-only)
- Sync triggers automatically on `NetInfo` change

**Time Estimate:** 1.5 hours

---

### 3.2 Typing Indicators 🔤

**Behavior:**

- Collection: `/typingStatus/{chatId}/{userId}`
- Document fields:
  ```javascript
  {
    isTyping: boolean,
    expiresAt: timestamp,  // Auto-expire after 5 seconds
    lastUpdated: timestamp
  }
  ```
- Debounced updates every 2 seconds (avoid excessive writes)
- Auto-expire via Firestore TTL (5 second lifespan)

**UI:**

- Direct chat: "John is typing..."
- Group chat: "John and Sarah are typing..." (up to 2 names)
- Group chat 3+: "3 people are typing..."
- Shows below message list, above input

**Implementation Details:**

- Debounce typing events (500ms window)
- Set `expiresAt = now() + 5 seconds` on each keypress
- Listen to `typingStatus` collection for target chat
- Clean up listeners on unmount
- Handle TTL field expiration server-side

**Time Estimate:** 1.5 hours

---

### 3.3 Who-Read Receipts 👀

**Behavior:**

- Extend message doc with `readBy: [uid1, uid2, ...]`
- Trigger: User opens chat → batch update all unread messages with current `uid`
- Message status flow: `sent` → `delivered` → `read`

**UI - Direct Chat:**

- Show avatars + timestamp
- Example: "Read 5:30 PM" with user avatar

**UI - Group Chat:**

- Show up to 3 avatars + "+N more" badge
- On hover/tap: Show full list ("Read by: John, Sarah, Mike")
- Timestamp: When last person read

**Implementation Details:**

```javascript
// When ChatScreen mounts or returns to focus:
async function markMessagesAsRead(chatId, userId) {
  const unreadMessages = getUnreadMessages(chatId);
  const batch = writeBatch(db);

  unreadMessages.forEach((msg) => {
    batch.update(doc(db, "messages", msg.id), {
      readBy: arrayUnion(userId),
      status: "read",
    });
  });

  await batch.commit();
}
```

**Time Estimate:** 2 hours

---

### 3.4 Rate Limiting 🚦

**Behavior:**

- Limit: **5 messages per second per chat** (client-side)
- Scope: Per-chat (not global)
- Enforcement: Server-side check in Cloud Function (warn but don't block)

**UI:**

- User sends 6th message within 1 second → Toast: "Slow down! Please wait a moment."
- Send button: Disabled for 2 seconds
- Message: Still queues locally for sending after cooldown

**Implementation Details:**

```javascript
// Client-side rate limiter
const lastSendTime = chatStore.getLastSendTime(chatId);
const timeSinceLastSend = Date.now() - lastSendTime;

if (timeSinceLastSend < 200) {
  // 200ms = 5 msgs/sec
  showToast("Slow down! Please wait a moment.");
  disableSendButton(2000); // Re-enable after 2 seconds
  return;
}
```

**Time Estimate:** 1 hour

---

### 3.5 Message Pagination 📜

**Behavior:**

- Load messages in batches of **20** (limit)
- Max history: **500 messages per chat**
- Infinite scroll: Load earlier messages as user scrolls up
- Query: `orderBy("timestamp", "desc").limit(20)`

**UI:**

- "Load Earlier Messages" button at top of list
- Loading spinner while fetching
- Auto-load when user scrolls within 3 items of top (on scroll)

**Implementation Details:**

```javascript
// Initial load
const query = collection(db, "chats", chatId, "messages")
  .orderBy("timestamp", "desc")
  .limit(20);

// Load earlier (pagination)
const nextQuery = collection(db, "chats", chatId, "messages")
  .orderBy("timestamp", "desc")
  .startAfter(oldestMessage.timestamp)
  .limit(20);
```

**Performance:** Queries are indexed by `timestamp` (already set up in Phase 1)

**Time Estimate:** 2 hours

---

### 3.6 Profile Picture Upload 🖼️

**Behavior:**

- ImagePicker → compress to 200x200px, 85% JPEG quality
- Upload to Firebase Storage: `/avatars/{uid}.jpg`
- Save URL in user doc: `profilePictureUrl`
- Display in: Profile screen + Chat list (small avatar)
- Cached on device for fast reload

**UI:**

- Profile screen: Tap avatar → ImagePicker
- Loading state: Spinner overlay during upload
- Progress: "Uploading... 45%"
- Success: Refresh avatar immediately

**Implementation Details:**

```javascript
const storage = getStorage();
const compressedImage = await compressImage(image, 200, 200, 85);
const uploadTask = uploadBytes(
  ref(storage, `avatars/${userId}.jpg`),
  compressedImage
);
const url = await getDownloadURL(uploadTask.ref);
await updateDoc(doc(db, "users", userId), { profilePictureUrl: url });
```

**Time Estimate:** 2.5 hours

---

### 3.7 Image Attachments in Messages 📸

**Behavior:**

- 📎 Button in message input → ImagePicker
- Compress to **max 800px width**, 85% JPEG quality
- Upload to Firebase Storage: `/messages/{chatId}/{messageId}.jpg`
- Message type: `type: "image"` (vs. `type: "text"`)
- Display: Inline preview (max 300px width) + tap to zoom modal

**UI:**

- Send button area: Add 📎 attachment button
- Selected image: Thumbnail preview (100x100px) below input
- Uploading: Progress bar "Sending image... 67%"
- Sent: Full preview inline in message bubble
- Tap image: Open fullscreen zoom modal

**Implementation Details:**

```javascript
const messageDoc = {
  chatId,
  senderId,
  type: "image", // NEW field
  imageUrl: downloadURL,
  imageWidth: 800,
  imageHeight: 600,
  timestamp: serverTimestamp(),
  status: "sent",
};

// When rendering:
if (message.type === "image") {
  <Image source={{ uri: message.imageUrl }} style={{ width: 300 }} />;
}
```

**Storage:** Firebase Storage (enables at setup)  
**Limit:** Max 10 MB per image (enforced by Cloud Function)

**Time Estimate:** 3 hours

---

### 3.8 Delete Chat 🗑️

**Behavior:**

**User Flow:**

1. Long-press chat → "Delete Chat" option
2. Confirmation modal: "Delete chat for you only. Others can still see it."
3. Tap confirm → Chat hidden immediately (local)
4. Sync to server: Add `uid` to `deletedBy` array

**Deletion Logic:**

- Each chat doc adds field: `deletedBy: [uid1, uid2, ...]` (array)
- When user deletes: Append their `uid` to `deletedBy`
- When `deletedBy.length === participants.length`: Cloud Function auto-purges entire chat + all messages
- Message deletion: Messages are removed for that user's view only (other users still see them)

**UI:**

- Confirmation modal with 2 buttons: "Delete" / "Cancel"
- After delete: Chat disappears from chat list
- If offline: Chat still hides locally; syncs on reconnect
- **No undo window** (permanent delete)

**Firestore Rules:**

```javascript
// Only participants can update deletedBy
match /chats/{chatId} {
  allow update: if request.auth.uid in resource.data.participants &&
    request.resource.data.deletedBy is list;
}
```

**Cloud Function (server-side):**

```javascript
// Triggered when deletedBy array updated
if (chatData.deletedBy.length === chatData.participants.length) {
  // Delete all messages
  const messages = await db
    .collection("messages")
    .where("chatId", "==", chatId)
    .get();

  const batch = db.batch();
  messages.forEach((msg) => batch.delete(msg.ref));

  // Delete chat doc
  batch.delete(chatDoc.ref);
  await batch.commit();
}
```

**Time Estimate:** 3.5 hours (2 hrs client + 1.5 hrs Cloud Function)

---

## 4. Technical Implementation

| Layer             | Tool / Module                                      | Details                                                                        |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Frontend**      | React Native + Expo + React Native Paper           | UI updates, image picker, progress indicators                                  |
| **State**         | Zustand Stores                                     | Track pending status, deleted chats, typing users                              |
| **Backend**       | Firebase Firestore + Storage + Cloud Functions     | New collections: `typingStatus`; new fields: `readBy`, `deletedBy`, `imageUrl` |
| **Security**      | Firestore + Storage Rules                          | Auth-enforced delete permissions; 10 MB image limit                            |
| **Testing**       | Jest + manual E2E                                  | Verify sync, uploads, deletions, typing                                        |
| **Image Library** | `react-native-image-picker` or `expo-image-picker` | Image selection + compression                                                  |

---

## 5. Firestore Schema Changes

**Message Collection Updates:**

```javascript
{
  // Existing fields
  id, chatId, senderId, text, timestamp, status, ai,

  // NEW fields
  type: "text" | "image",           // Message type
  imageUrl: "https://...",          // Image URL (if type: "image")
  imageWidth: 800,                  // For layout
  imageHeight: 600,                 // For layout
  readBy: ["uid1", "uid2"],         // Array of read users
  localStatus: "pending" | "sent"   // Client-only, temp field
}
```

**Chat Collection Updates:**

```javascript
{
  // Existing fields
  id, type, name, participants, adminId, isDeleted, lastMessage, updatedAt, createdAt,

  // NEW fields
  deletedBy: ["uid1"],              // Users who deleted this chat
  profilePictureUrl: "https://..."  // ADDED to users doc, not chat
}
```

**User Collection Updates:**

```javascript
{
  // Existing fields
  uid, name, email, preferred_language, status, lastSeen, fcmToken, createdAt,

  // NEW fields
  profilePictureUrl: "https://..."  // Avatar URL
}
```

**New Collection - Typing Status:**

```javascript
// Collection: typingStatus/{chatId}/{userId}
{
  isTyping: true,
  expiresAt: timestamp,             // Auto-expire after 5 seconds
  lastUpdated: timestamp
}
```

---

## 6. Implementation Order & Checklist

**Phase 2 Sprint - 5 Days (17 hours total)**

### **Day 1 (3 hours):**

- [ ] Setup Firebase Storage + Firestore indexes
- [ ] Implement pending/syncing indicator (network detection)
- [ ] Implement rate limiting (client-side)

### **Day 2 (3.5 hours):**

- [ ] Implement typing indicators (debounced, TTL)
- [ ] Add UI for "Person is typing..." banner
- [ ] Test typing with 3+ users

### **Day 3 (3.5 hours):**

- [ ] Implement read receipts (`readBy` array)
- [ ] Add read receipt UI (avatars + count)
- [ ] Batch update messages on chat open

### **Day 4 (4 hours):**

- [ ] Implement message pagination (load 20 at a time)
- [ ] Add "Load Earlier" button + infinite scroll
- [ ] Profile picture upload (ImagePicker + Storage)

### **Day 5 (3 hours):**

- [ ] Image attachments in messages (type: "image")
- [ ] Upload progress indicator
- [ ] Delete chat feature (client + Cloud Function)
- [ ] Integration testing + bug fixes

---

## 7. Testing Plan

| Test                  | Scenario                             | Expected Result                                             |
| --------------------- | ------------------------------------ | ----------------------------------------------------------- |
| **Offline → Online**  | Send 5 msgs while offline, reconnect | All messages sync within 1 s                                |
| **Typing Indicators** | 3 users typing simultaneously        | "3 people are typing..." shows < 500 ms                     |
| **Read Receipts**     | User A sends, User B opens chat      | "Read by" shows User B's avatar < 500 ms                    |
| **Rate Limit**        | Rapid send (6 msgs in 1 sec)         | 5th msg sends, 6th shows toast + button disabled            |
| **Pagination**        | Load 500 msg history                 | 20 msgs load initially, "Load Earlier" works smoothly       |
| **Profile Upload**    | Upload 200x200 avatar                | Appears in chat list + profile < 3 s                        |
| **Image Message**     | Send image attachment                | Preview shows inline, zoom works on tap                     |
| **Delete Chat**       | User A deletes, User B sees it       | Hidden for A only; B still sees; auto-purge after B deletes |
| **Stress Test**       | 20+ msgs/sec                         | No crashes, all messages appear                             |
| **Battery/Network**   | Poor connection + app backgrounding  | Sync works correctly, no data loss                          |

---

## 8. Success Criteria (Exit Gate)

- ✅ All 8 features functional on iOS + Android
- ✅ Offline → Online sync completes < 1 s
- ✅ Typing/read updates show < 500 ms
- ✅ Image uploads complete < 3 s average
- ✅ Pagination loads 20 messages smoothly
- ✅ Chat deletion works correctly (per-user, auto-purge when all delete)
- ✅ Rate limiting prevents spam (5 msg/s limit)
- ✅ No quota violations (10 users, ~500 msgs/chat)
- ✅ All tests pass (≥ 110 total, up from 103)
- ✅ No crashes under stress testing
- ✅ Battery/network resilience verified on physical devices

---

## 9. Timeline Summary

| Day       | Focus                      | Hours        | Deliverable                  |
| --------- | -------------------------- | ------------ | ---------------------------- |
| 1         | Setup + Pending/Rate Limit | 3            | Network indicators working   |
| 2         | Typing Indicators          | 3.5          | Live typing UI complete      |
| 3         | Read Receipts              | 3.5          | Who-read feature working     |
| 4         | Pagination + Profiles      | 4            | History scrolling + avatars  |
| 5         | Images + Delete            | 3            | Full media support + cleanup |
| **TOTAL** |                            | **17 hours** | **Production-ready Phase 2** |

---

## 10. Out of Scope (Phase 3+)

- AI translation / language detection
- Message reactions or replies
- Message editing with version history
- Voice/audio messages
- Dark mode support
- Message search functionality
- Advanced group features (admin transfer, role-based)
- End-to-end encryption

---

## 11. Notes for Implementation

- **Image compression** is critical for fast uploads; use `react-native-image-resizer`
- **Firestore indexes** are auto-created; monitor console during testing
- **Rate limiting** can be adjusted based on testing (5 msg/s is conservative for 10 users)
- **TTL field** for typing status requires Firestore TTL policy (free feature)
- **Cloud Function** for chat auto-deletion runs after all users delete
- **Test on real devices** for accurate network/battery simulation

---

**Status:** ✅ **FINALIZED & APPROVED**  
**Next Step:** Create implementation tasks and start Day 1
