# Unilang - Active Context

## Current Phase

**Phase: Phase 2 Planning COMPLETE ✅ → Ready for Implementation 🚀**

- ✅ Phase 1-5: Core MVP (Foundation, Auth, Messaging, Presence, Notifications)
- ✅ Phase 6: UI Overhaul (Complete - All 10 screens modernized)
- ✅ Phase 2 PRD: Finalized (v2.0 - All 8 features spec'd, 17 hours planned)
- ⏭️ **Phase 2 Implementation: NEXT** (Pending/Sync, Typing, Read Receipts, Pagination, Images, Delete Chat, etc.)

**Time Checkpoint:** 24 hours MVP complete + 1 hour Phase 2 planning = 25 hours total. Phase 2 implementation starting now (~17 hours estimated).

---

## Phase 2 Planning Complete (Session 6 - Oct 22, 2025)

### What Was Done This Session

**Phase 2 PRD Finalized (v2.0):**

- 8 core features with detailed specs (no AI features)
- Exact UI/UX behavior defined for each feature
- Firestore schema changes documented
- Code examples and implementation patterns provided
- Success criteria locked in

**Phase 2 Implementation Tasklist Created (v2.0):**

- 5-day breakdown (17 hours total)
- Specific code files to create/update (11 new, 6 updated)
- Hour-by-hour estimates with test cases
- 25+ new unit tests required (total ≥ 128)
- Daily testing checklist included

**Documentation Created:**

- ai-docs/PRD_Phase2.md (523 lines, production-ready)
- ai-docs/Tasklist_Phase2.md (411 lines, task-by-task)
- PHASE2_KICKOFF.md (quick reference guide)

**Key Decisions Locked In:**

- Typing: Auto-expire TTL (5 sec), no manual cleanup
- Read Receipts: Screen open trigger, show 3 avatars + "+N more"
- Pagination: 20 msg loads, 500 msg max per chat
- Images: JPEG only, profile 200x200px, messages 800px, 85% quality
- Delete Chat: `deletedBy` array + Cloud Function auto-purge
- Rate Limit: Per-chat client-side, 5 msg/sec, button disable 2s
- Architecture: Storage, typing service, image service, delete function

### Phase 2 Features (8 Total)

| #   | Feature                   | Time | Day | Status           |
| --- | ------------------------- | ---- | --- | ---------------- |
| 1️⃣  | Pending/Syncing Indicator | 1.5h | 1   | ⏳ Ready to code |
| 2️⃣  | Typing Indicators         | 1.5h | 2   | ⏳ Ready to code |
| 3️⃣  | Who-Read Receipts         | 2h   | 3   | ⏳ Ready to code |
| 4️⃣  | Rate Limiting             | 1h   | 1   | ⏳ Ready to code |
| 5️⃣  | Message Pagination        | 2h   | 4   | ⏳ Ready to code |
| 6️⃣  | Profile Picture Upload    | 2.5h | 4   | ⏳ Ready to code |
| 7️⃣  | Image Attachments         | 3h   | 5   | ⏳ Ready to code |
| 8️⃣  | Delete Chat               | 3.5h | 5   | ⏳ Ready to code |

**TOTAL:** 17 hours over 5 days

---

## Phase 6 UI Overhaul: COMPLETE ✅

All 10 screens modernized with frosted glass headers, Material icons, and consistent design system.

**Status:** ✅ 100% Complete

- 10/10 screens modernized
- All 103 tests still passing
- Bottom navigation height increased (70px)
- Color palette: src/utils/theme.ts created
- Formatters: formatLastSeen utility added

### Key Design Decisions Implemented

- **Frosted Glass Headers (70px):** LinearGradient + BlurView, consistent across all screens
- **Modern Icons:** Material Community Icons (no emoji), 20-24px, proper spacing
- **Text Inputs:** Mode "outlined", background rgba(248,250,252,0.8), borderRadius 12
- **Avatars:** Circular (100x100px), Facebook style, clean aesthetics
- **Checkboxes:** Custom circular checkboxes with Material icons

---

## Recommended Next Session Tasks

### Before Day 1 Implementation:

1. Enable Firebase Cloud Storage (2 minutes)
2. Install new dependencies (`npm install...`)
3. Create Firestore TTL policy

### Day 1 (3 hours):

- [ ] Setup Firebase Storage + create typingStatus collection
- [ ] Implement pending/syncing indicator (network detection)
- [ ] Implement rate limiting (client-side, 5 msg/sec)
- [ ] Test: Offline → online sync, rate limiting

### Day 2 (3.5 hours):

- [ ] Typing service (TTL-based, debounced)
- [ ] Typing indicator UI banner
- [ ] Test: 3 users typing < 500ms

### Day 3 (3.5 hours):

- [ ] Read receipts schema (readBy array)
- [ ] Mark as read logic (batch update on chat open)
- [ ] Read receipt UI (avatars + count)
- [ ] Test: Badges appear < 500ms

### Day 4 (4 hours):

- [ ] Message pagination (20-msg loads)
- [ ] Load Earlier button + infinite scroll
- [ ] Profile picture upload (ImagePicker + compress + Storage)
- [ ] Test: Smooth scrolling, avatars cached

### Day 5 (3 hours):

- [ ] Image attachment message type
- [ ] Image preview UI (📎 button + thumbnail + zoom modal)
- [ ] Delete chat feature (long-press + modal + deletedBy)
- [ ] Cloud Function auto-purge
- [ ] Test: E2E on all features

---

**Last Updated:** October 22, 2025 (Session 6, Phase 2 Planning Complete)
**Next Phase:** Phase 2 Implementation - Start Day 1
**Status:** All planning complete, 100% ready for coding
