# Unilang - Active Context

## Current Phase

**Phase: Phase 2 Day 4 COMPLETE ✅**

- ✅ Phase 1-5: Core MVP (Foundation, Auth, Messaging, Presence, Notifications)
- ✅ Phase 6: UI Overhaul (Complete - All 10 screens modernized)
- ✅ Phase 2 Day 1 COMPLETE: Storage Setup, Pending Indicators, Offline UX
- ✅ Phase 2 Day 2 COMPLETE: Typing Indicators, Comprehensive Unit Tests
- ✅ Phase 2 Day 3 COMPLETE: Read Receipts with "Seen" & Avatar Display
- ✅ **Phase 2 Day 4 COMPLETE:** Image Messaging ✅, Delete Chat ✅, Profile Pictures ✅
- ⏳ **Next:** Message Pagination (load 20, max 500)

**Time Checkpoint:** ~41 hours total (24h MVP + 3h Day 1 + 2.5h Day 2 + 3h Day 3 + 3.5h Day 4 image messaging + 2.5h profile pictures + 2.5h other = 41h used), ~7 hours Phase 2 remaining

---

## Phase 2 Day 4 Complete (Session 11 - Oct 23, 2025)

### Profile Picture Feature - ALL 7 PHASES COMPLETE ✅

**Phase 1: Data Model (15 min)**

- Added `avatarUrl?: string` field to User type
- All 115 tests passing ✅

**Phase 2: Backend Services (15 min)**

- Updated `subscribeToUserPresence()`, `getAllUsers()`, `getUserById()` to include avatarUrl
- Storage service ready with `uploadProfilePicture()` (compresses to 200x200px)

**Phase 3: Avatar Picker Modal (45 min)**

- Created `AvatarPickerModal.tsx` component (168 lines)
- Two options: Take Photo (camera) or Choose from Library
- Loading states, permission handling, error handling
- Integrated with ProfileScreen

**Phase 4: Profile Screen Integration (30 min)**

- Made avatar clickable with camera icon overlay
- Shows real profile picture or placeholder icon
- Handles upload to Firebase Storage
- Updates user in Firestore and auth store
- Success/error alerts

**Phase 5: Chat List Display (30 min)**

- Updated `ChatListItem` to accept and display `otherUserAvatarUrl`
- Updated `ChatListScreen` → `ChatItemWrapper` to fetch other user's avatar
- Passes avatar through `SwipeableChatItem` wrapper
- Fallback to generic icon if no avatar

**Phase 6: Message Bubble Display (45 min)**

- Updated `MessageBubble` to accept `senderAvatarUrl` prop
- Updated `ChatScreen` to fetch and pass sender avatars for group chats
- Shows `Avatar.Image` with fallback to `Avatar.Text` (initials)
- Sender avatars display next to group messages

**Phase 7: Contacts Screens (30 min)**

- Updated `ContactsListScreen` → `UserItem` to show real avatars
- Updated `ContactCardScreen` to display prominent avatar on profile
- Maintains online indicator and status display

**Bug Fix: Read Receipt Avatars (15 min)**

- Fixed `ReadReceiptBadge.tsx` to show real profile pictures in "Seen by" section
- Was showing text avatars (initials), now shows real images with fallback

**Files Created (1 total)**

1. ✅ `src/components/AvatarPickerModal.tsx` (168 lines) - Image picker modal

**Files Updated (10 total)**

1. ✅ `src/types/User.ts` - Added `avatarUrl` field
2. ✅ `src/services/userService.ts` - Include avatarUrl in all user queries
3. ✅ `src/screens/ProfileTab/ProfileScreen.tsx` - Avatar upload & display
4. ✅ `src/components/ChatListItem.tsx` - Display user avatars in chat list
5. ✅ `src/screens/ChatsTab/ChatListScreen.tsx` - Fetch & pass other user avatar
6. ✅ `src/components/SwipeableChatItem.tsx` - Pass through avatarUrl prop
7. ✅ `src/components/MessageBubble.tsx` - Display sender avatars in groups
8. ✅ `src/screens/ChatsTab/ChatScreen.tsx` - Fetch sender avatars
9. ✅ `src/screens/ContactsTab/ContactsListScreen.tsx` - Show avatars in contacts
10. ✅ `src/screens/ContactsTab/ContactCardScreen.tsx` - Display avatar on card
11. ✅ `src/components/ReadReceiptBadge.tsx` - Show real avatars in "Seen by"

**Firebase Storage Rules Updated**

- Lenient rules for testing: `allow write: if request.auth != null;`
- Allows authenticated users to upload profile pictures
- Can be tightened before production

**Technical Details**

- Images compressed to 200x200px for profile pictures (85% JPEG quality)
- Stored in Firebase Storage at: `/avatars/{userId}.jpg`
- Cached for 24 hours
- Optional field - old users without avatars still work
- All displays have fallback logic (icons/initials if no URL)

**Avatar Display Throughout App**
✅ Profile Settings (upload/change)
✅ Chat List (direct chat avatars)
✅ Messages (group message sender avatars)
✅ Contacts (user discovery list)
✅ Contact Profile Cards (prominent avatar)
✅ Read Receipts (seen by section)

---

---

## Phase 3 Planning Complete (Session 12 - Oct 24, 2025)

### AI Messaging Features - PRD & Tasklist Finalized ✅

**Phase 3 Overview:**

- AI-powered multilingual messaging using N8N workflow automation
- Target: International Communicator persona
- Timeline: 10-13 hours implementation
- Tech Stack: N8N Cloud + OpenAI GPT-4o-mini

**6 AI Features Planned:**

1. ✅ Real-time translation (on-tap) with caching
2. ✅ Auto language detection (assume sender's preferredLanguage)
3. ✅ Cultural context & slang explanation (tooltip/modal)
4. ✅ Formality adjustment (formal/neutral/casual tone)
5. ✅ Translation toggle (show/hide persistent state)
6. ✅ Smart replies (3 context-aware suggestions from last 8 messages)

**Key Decisions Made:**

- **Language Detection:** Assume sender's `preferredLanguage` (Phase 3), upgrade to API detection (Phase 4)
- **Translation Caching:** Permanent in Firestore `message.translation` field, instant on reopen
- **Retry Logic:** Fresh API call on retry (not just toggle)
- **Formality:** Send adjusted text as-is (no auto-translation back)
- **Smart Replies:** Generate in user's preferred language, match their tone
- **Hide Translate Button:** If sender/receiver have same preferred language
- **Group Chat:** Each user translates to their own preferred language (Phase 4 enhancement)
- **Cost:** ~$20.30/month (N8N $20 + OpenAI $0.30 for 10 users)

**Documents Created:**

1. ✅ `ai-docs/PRD_Phase3.md` (Full specification - 15 sections, 1000+ lines)
2. ✅ `ai-docs/Tasklist_Phase3.md` (Implementation guide - 5 phases, detailed steps)

**Implementation Order:**

1. Phase 3A: Translation Core (3-4h)
2. Phase 3B: Smart Replies (2-3h)
3. Phase 3C: Formality Adjustment (1.5-2h)
4. Phase 3D: Cultural Context (1-1.5h)
5. Phase 3E: Polish & Testing (2-3h)

**Architecture:**

- React Native → N8N Webhooks → OpenAI API → Firestore Cache
- 3 N8N workflows: Translation, Tone Adjustment, Smart Replies
- New service: `aiService.ts` for API calls
- UI updates: MessageBubble (translate button), ChatScreen (tone menu + smart replies)

**UI Integration:**

- Translate button: Below timestamp on received messages (frosted blue)
- Stacked view: Translated text + faded original + retry button
- Slang tooltip: Yellow badge with info icon (modal if >2 lines)
- Tone menu: ⚙️ button with 3 options (formal/neutral/casual)
- Smart replies: 3 horizontal chips below typing indicator (auto-hide 10s)

**Data Model Changes:**

- Message type extended with `translation` and `translationVisible` fields
- No changes to User type (uses existing `preferred_language`)

**Next Steps:**

1. Complete Phase 2 Day 5: Message Pagination (~2-3h remaining)
2. Set up N8N Cloud + OpenAI API
3. Begin Phase 3A: Translation Core implementation

---

**Last Updated:** October 24, 2025 (Session 12 - Phase 3 Planning Complete)
**Status:** Phase 2 Day 4 100% COMPLETE, Phase 3 PRD & Tasklist FINALIZED ✅
**Next:** Complete Message Pagination (Phase 2 Day 5) → Start Phase 3A (Translation Core)
