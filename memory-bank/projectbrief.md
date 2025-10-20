# Unilang - Project Brief

## Project Name

**Unilang** - A WhatsApp-inspired real-time messaging app with multilingual AI features

## Vision

Build a reliable, cross-platform messaging platform that allows users to chat seamlessly across languages with built-in AI translation and summarization features.

## MVP Scope (Phase 1: 24-Hour Checkpoint)

**Core Objective:** Prove the messaging infrastructure works reliably before adding AI features.

**Success Metric:** Messages sync reliably in real-time with offline support.

### MVP Must-Have Features

1. **Authentication:** Email/password signup, login, and Google Sign-In
2. **One-on-One Chat:** Real-time messaging with optimistic UI updates
3. **Group Chat:** 3+ participants with admin controls
4. **Message Status:** ✓ sent, ✓✓ delivered, ✓✓ read (simple approach)
5. **User Presence:** Online/offline indicators with last seen timestamps
6. **Offline Support:** Messages queue and sync automatically
7. **Push Notifications:** FCM with foreground + background support
8. **User Discovery:** Search and add users, prevent duplicate chats

### MVP Does NOT Include (Phase 2+)

- AI translation/summarization
- Media attachments (images, files)
- Typing indicators, message editing
- Dark mode, avatars
- Advanced group features (admin transfer)

## Technical Stack (Non-Negotiable)

- **Frontend:** React Native + Expo (cross-platform mobile)
- **UI:** React Native Paper (Material Design)
- **State:** Zustand (lightweight management)
- **Database:** Firebase Firestore (real-time sync)
- **Auth:** Firebase Auth
- **Push:** Firebase Cloud Messaging (FCM)
- **Backend Logic:** Firebase Cloud Functions
- **Language:** TypeScript (type safety)

## Key Constraints

- **Timeline:** 24 hours to MVP checkpoint
- **Platforms:** iOS & Android (via Expo)
- **Users:** Will start small (<100), scale later
- **Network:** Must work reliably on poor connections
- **Reliability:** Perfect sync > feature-rich broken app

## Success Criteria at MVP Gate

### Must Pass All Tests

1. Two devices send/receive in real-time (<500ms)
2. Offline→online sync works perfectly
3. Chat history survives force-quit
4. Read receipts update across all participants
5. Presence toggles on app open/close
6. Group chat works with 3+ participants
7. Admin can add/remove/edit/delete groups
8. Notifications fire (foreground minimum)
9. Rapid-fire: 20+ messages/sec without crashes
10. Poor network: Works on throttled connection

## User Base & Growth

- **MVP Users:** Developers/testers for Unilang team
- **Target Users (Phase 2+):** Multilingual communities needing real-time translation
- **Scaling:** Firebase Firestore handles 1000+ concurrent users

## Budget & Resources

- **Development:** You (solo developer) - 24 hours
- **Infrastructure:** Firebase (free tier sufficient for MVP)
- **Tools:** Expo (free), VS Code, Terminal

## Phase Timeline

| Phase             | Duration | Focus                                       | Status  |
| ----------------- | -------- | ------------------------------------------- | ------- |
| **MVP (Phase 1)** | 24 hours | Core messaging infrastructure               | Current |
| **Phase 2**       | TBD      | AI translation, media, advanced features    | Planned |
| **Phase 3+**      | TBD      | Analytics, advanced group features, scaling | Future  |

## High-Level Architecture

```
React Native (Expo) Frontend
        ↓
  Zustand State Management
        ↓
Firebase Backend:
  - Firestore (database + real-time sync)
  - Auth (users)
  - Cloud Functions (notifications trigger)
  - FCM (push notifications)
        ↓
  Local Firestore Persistence
  (offline queue + caching)
```

## Key Decisions Made

1. **Why simple message status model?** Reduces complexity; Phase 2 can upgrade to per-participant tracking
2. **Why prevent admin from leaving?** Prevents accidental loss of group control in MVP
3. **Why deleted groups stay in list?** Users can reference history; consistent with major apps
4. **Why composite indexes?** Array-contains + orderBy queries require indexes for performance
5. **Why no media in MVP?** Focus on messaging reliability first; media adds complexity
6. **Why Firestore?** Built-in offline, real-time sync, no backend server needed
7. **Why Zustand?** Lightweight; Redux overkill for MVP scope

## Definitions

- **Optimistic UI:** Show message immediately; sync in background
- **Real-time Sync:** Using Firestore onSnapshot for instant updates
- **Presence:** Online/offline status with last seen timestamp
- **Message Status:** Sent → Delivered → Read (simple: any participant)
- **Composite Index:** Database index for multi-field queries (e.g., participants + updatedAt)

## Notes

- This is NOT a competitive product launch; it's infrastructure validation
- Focus is 100% on reliability and synchronization
- Polish and features come after MVP gate
- All decisions documented for reproducibility across sessions
