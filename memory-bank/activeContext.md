# Unilang - Active Context

## Current Phase

**Phase: Planning Complete → Ready for Bootstrap**

- ✅ PRD_MVP.md - Finalized with all decisions
- ✅ Tasklist_MVP.md - Ready for implementation
- ✅ Architecture.md - Enhanced with full detail
- ✅ Memory Bank - Initialized (you are here)
- ⏭️ Next: Bootstrap Expo project

## Recent Decisions (This Session)

### 1. Message Status System (Simplified)

- **Decision:** Simple 4-state model (sending → sent → delivered → read)
- **Why:** Any participant reaching state = entire chat reaches state
- **Benefit:** ~60% less code vs per-participant tracking
- **Trade-off:** Less granular (Phase 2 can enhance)

### 2. Admin Group Constraints

- **Decision:** Admin cannot leave or remove self from group
- **Why:** Prevents accidental loss of group control
- **Benefit:** Simpler logic, prevents admin orphaning
- **Trade-off:** Admin must delete group first (acceptable for MVP)

### 3. Deleted Group Behavior

- **Decision:** Group stays in chat list (grayed out) with disabled input
- **Why:** Users can reference chat history; consistent with WhatsApp
- **Benefit:** UX clarity, no surprise disappearances
- **Alternative rejected:** Complete removal (confusing for users)

### 4. Firestore Security Rules (Stricter)

- **Decision:** Only participants read chats, only sender creates messages
- **Why:** Prevent unauthorized access to private conversations
- **Benefit:** Database-level security (no client bypass)
- **Status:** Rules documented in Architecture.md

### 5. Composite Indexes (Proactive Creation)

- **Decision:** Create 2 indexes upfront before testing
- **Why:** Prevent query errors during development
- **Indexes:**
  1. `chats`: participants (Arrays) + updatedAt (DESC)
  2. `messages`: chatId (ASC) + timestamp (ASC)
- **Timing:** Create during Firebase setup phase

### 6. Language Support (10 Languages)

- **Decision:** Support en, es, fr, de, zh-CN, pt, ru, ja, ko, ar
- **Why:** Cover major language families
- **Benefit:** Realistic testing for Phase 2 AI features
- **User selection:** During signup via Picker component

## Documentation Changes Made

### PRD_MVP.md

- Added detailed 24-hour implementation roadmap
- Section 11: Message Status System explanation
- Section 12: Admin & Group Management constraints
- Section 13: 10 supported languages list
- Section 14: Composite Indexes & Security Rules detail
- Section 15: Error Handling & User Feedback patterns

### Tasklist_MVP.md

- Added composite index creation task (Phase 1.2)
- Language picker with 10 language codes
- Admin constraint implementation tasks
- Badge count calculation details

### Architecture.md

- Complete rewrite with 17 sections:
  - Overview & Design Principles
  - Technology Stack table
  - Data Models (Users, Chats, Messages)
  - Firestore Indexes & Security detail
  - Data Flow Diagrams (4 patterns)
  - Component Architecture
  - Optimization Strategies
  - Error Handling patterns

## Critical Path Items

**Must complete before MVP gate:**

Tier 1 (Blocking):

1. ✅ Firebase setup + Firestore
2. ✅ Auth (email/password + Google)
3. ⏭️ Message sync real-time
4. ⏭️ Offline persistence
5. ⏭️ Chat list UI

Tier 2 (Core): 6. ⏭️ Optimistic UI 7. ⏭️ Message status indicators 8. ⏭️ Presence system 9. ⏭️ Group chat 10. ⏭️ Push notifications

Tier 3 (Validation): 11. ⏭️ All 10 core tests passing 12. ⏭️ Stress test (20+ msgs/sec) 13. ⏭️ Offline/online sync verified

## Known Constraints

- **Time:** 24 hours to MVP
- **Team:** You (solo developer)
- **Network:** Must work on poor connections
- **Users:** MVP handles <100 concurrent
- **Platforms:** iOS + Android (via Expo)
- **Reliability:** Perfect sync > features

## Assumptions

1. **Firebase free tier sufficient** for MVP testing (<100 users)
2. **Physical devices available** for final testing
3. **Network throttling tools** (Chrome DevTools) accessible
4. **Google OAuth configured** before implementation
5. **Xcode/Android Studio** installed (or Expo Go suffices)

## Open Questions / To Clarify

None remaining - all questions answered in user session.

## Implementation Priorities

**Start with (Hours 0-4):**

1. Firebase project creation
2. Create composite indexes
3. Enable Auth + Firestore + FCM
4. Expo project bootstrap
5. Install all dependencies

**Then (Hours 4-8):**

1. Auth service layer
2. Zustand stores
3. Login/Signup screens
4. Navigation setup

**Critical bottleneck (Hours 12-18):**

- Real-time messaging sync
- This is where most bugs occur
- Need robust testing here

## Risk Assessment

### High Risk (Need attention)

- **Composite index delays:** If indexes take >10 mins, delays testing by 10 mins
- **Firestore offline persistence:** If misconfigured, offline won't work
- **Real-time sync bugs:** Hardest part to debug
- **Network conditions:** Need real device + throttling for accurate testing

### Medium Risk

- **Group chat complexity:** Edge cases around member removal
- **Admin constraints:** Need clear error messages
- **Notification timing:** Might need retry logic

### Low Risk

- **UI components:** React Native Paper handles most styling
- **Auth flow:** Firebase handles session management
- **Language support:** Just a picker with hardcoded values

## Next Steps (After Bootstrap)

1. **Firebase Setup** (1 hour)

   - Create Firebase project
   - Create composite indexes
   - Configure Auth providers
   - Deploy security rules

2. **Project Bootstrap** (0.5 hours)

   - Create Expo app with TypeScript
   - Install all dependencies
   - Setup folder structure
   - Configure app.json

3. **Services Layer** (2 hours)

   - Firebase initialization
   - Auth service (signup, login, logout)
   - Zustand stores
   - Firestore generic CRUD

4. **Auth UI** (1.5 hours)

   - Login screen
   - Signup screen (with language picker)
   - Auth navigation stack
   - Error handling

5. **Basic Navigation** (1 hour)
   - Root navigator
   - Tab navigator
   - Conditional rendering based on auth

**Checkpoint after ~6 hours:** Auth fully working, can login with test accounts

6. **Chat Infrastructure** (4 hours)

   - Chat service layer
   - Message service layer
   - User service layer
   - Real-time listeners setup

7. **Chat UI & Real-Time Sync** (4 hours)
   - Chat list screen
   - Chat screen
   - Message bubbles
   - Optimistic UI

**Checkpoint after ~14 hours:** Can send/receive messages in real-time

8. **Features** (8 hours)

   - Presence system
   - Group chat (create, add, remove, delete)
   - Read receipts
   - Notifications

9. **Testing & Polish** (2 hours)
   - Run all tests
   - Bug fixes
   - Performance optimization

## Decision Log

| Date       | Decision                    | Rationale              | Status      |
| ---------- | --------------------------- | ---------------------- | ----------- |
| 2025-10-20 | Simple message status       | Reduces complexity     | ✅ Approved |
| 2025-10-20 | Prevent admin leaving       | Prevents accidents     | ✅ Approved |
| 2025-10-20 | Deleted groups stay         | UX consistency         | ✅ Approved |
| 2025-10-20 | Stricter security rules     | Better protection      | ✅ Approved |
| 2025-10-20 | Composite indexes proactive | Avoid query errors     | ✅ Approved |
| 2025-10-20 | 10 languages MVP            | Realistic Phase 2 prep | ✅ Approved |

## Current Status Summary

**Documentation:** ✅ 100% Complete

- PRD finalized with all details
- Tasklist ready for execution
- Architecture fully documented
- Memory bank initialized

**Code:** ⏳ Not Started

- No project bootstrap yet
- No dependencies installed
- No code written

**Ready to start:** ✅ Yes

- All decisions documented
- All plans finalized
- All questions answered

**Estimated time to MVP:** 24 hours (aggressive but achievable)

---

**Last Updated:** October 20, 2025  
**Next Review:** After project bootstrap (Hour 1)
