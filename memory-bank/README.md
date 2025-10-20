# Memory Bank - Unilang Project Reference

This directory contains all project documentation that persists across development sessions.

## 📚 Memory Bank Files

### 1. `projectbrief.md` - START HERE

**Foundation document that shapes everything else**

Contains:

- Project vision and goals
- MVP scope and must-have features
- Technical stack (non-negotiable decisions)
- Key constraints (24 hours, solo dev, reliability focus)
- Success criteria at MVP gate (all 10 must pass)
- High-level architecture diagram
- Key decisions with rationale

**Read this first** when picking up work.

---

### 2. `productContext.md` - Why does this exist?

**User-focused product documentation**

Contains:

- Problem statement (why Unilang is needed)
- How it works (user perspective)
- User experience goals (reliability, speed, simplicity)
- User personas (Maya, Dev Team, Support Rep)
- Success metrics we measure
- Phase 2+ roadmap
- Design principles
- Out of scope items

**Reference when** deciding UX/features.

---

### 3. `systemPatterns.md` - How does it work?

**Technical patterns and architecture decisions**

Contains:

- System architecture overview
- 5 key technical decisions (why Firestore, Zustand, etc.)
- 3 data flow patterns (messaging, offline, presence)
- Component architecture + screens hierarchy
- Message status flow (simple 4-state model)
- Error handling patterns
- Performance patterns (memoization, batch updates)
- State management structure
- Security patterns (Firestore rules)
- Navigation patterns
- Key invariants (must always be true)
- Performance targets

**Reference when** implementing features or debugging.

---

### 4. `techContext.md` - What tools do we use?

**Technical stack details and setup**

Contains:

- Detailed tech stack (why each choice)
- Development environment setup (prerequisites)
- Complete project structure
- All npm dependencies listed
- Firebase configuration steps
- Deployment commands
- Testing strategy
- Performance optimization tips
- Security considerations
- Known limitations
- Technical debt tracker

**Reference when** setting up environment or troubleshooting.

---

### 5. `activeContext.md` - What's happening right now?

**Current work focus and active decisions**

Contains:

- Current phase (what we're doing NOW)
- Recent decisions (why we made them)
- Documentation changes made (what was updated)
- Critical path items (must complete before MVP)
- Known constraints and assumptions
- Implementation priorities
- Risk assessment
- Next steps (what to do after current phase)
- Decision log
- Current status (docs done, code not started, etc.)

**Read this** to understand current focus and what's next.

---

### 6. `progress.md` - How far are we?

**Current build status and what's left**

Contains:

- Quick stats (% complete, hours spent/remaining)
- What's working ✅ (planning complete, decisions locked)
- What's left to build 🏗️ (all phases broken down)
- Implementation checkpoints (4 major checkpoints with success criteria)
- Known issues & blockers
- Potential issues + workarounds
- Performance metrics (targets vs current)
- Complete testing checklist
- Build artifacts
- Known limitations (MVP scope)
- Success criteria (10 must pass)
- Timeline tracking

**Reference when** tracking progress or planning your session.

---

## 🚀 How to Use This Memory Bank

### Starting a New Development Session

1. **Read `projectbrief.md`** (5 min)

   - Refresh on vision and scope

2. **Read `activeContext.md`** (5 min)

   - Understand current focus
   - Check what's next

3. **Check `progress.md`** (3 min)

   - See what's done/remaining
   - Find implementation checkpoints

4. **Reference others as needed:**
   - `systemPatterns.md` - Understanding how things connect
   - `techContext.md` - Setting up environment
   - `productContext.md` - UX/feature decisions

### When Implementing a Feature

1. Check `systemPatterns.md` for relevant patterns
2. Verify success criteria in `progress.md`
3. Reference `Architecture.md` in parent folder for full detail
4. Check `Tasklist_MVP.md` in parent folder for step-by-step

### When Debugging an Issue

1. Check `systemPatterns.md` for the pattern
2. Review `progress.md` for known issues/workarounds
3. Check `techContext.md` for setup/configuration
4. Reference `Architecture.md` for data flows

### When Making a Decision

1. Check `projectbrief.md` for constraints
2. Review `activeContext.md` decision log
3. Check `systemPatterns.md` for existing patterns
4. Decide and document in `activeContext.md`

---

## 📋 Key Facts to Remember

### Timeline

- **Total MVP time:** 24 hours (aggressive)
- **Current status:** Planning done, coding starting
- **Hours spent:** ~2 (planning)
- **Hours remaining:** ~22

### Critical Path

1. Firebase setup (1 hr)
2. Auth system (4 hrs)
3. Real-time messaging (6 hrs) ⭐ HARDEST PART
4. Groups + presence (4 hrs)
5. Notifications (2 hrs)
6. Testing (2 hrs)

### Must Pass at MVP Gate

✅ Two devices sync in real-time  
✅ Offline → online sync works  
✅ Chat history survives restart  
✅ Read receipts work  
✅ Presence updates  
✅ Group chat works  
✅ Admin can manage groups  
✅ Notifications work  
✅ No crashes at 20+ msgs/sec  
✅ Works on poor network

### Simplified Decisions (to save time)

- ✅ Simple message status (any participant = delivered/read)
- ✅ Admin can't leave groups (prevents accidents)
- ✅ Deleted groups stay in list (UX clarity)
- ✅ 10 languages support
- ✅ 2 composite indexes (upfront)
- ✅ Stricter security rules

---

## 🔄 Session Workflow

**Every time you start work:**

```
1. Open this README
2. Read the file descriptions
3. Open activeContext.md
4. Check "Current Phase" and "Next Steps"
5. Start with next item in checklist
6. As you complete tasks, update progress.md
7. If making decisions, update activeContext.md
```

---

## 📊 Directory Structure in Unilang/

```
Unilang/
├── memory-bank/                    ← You are here
│   ├── README.md                   (this file)
│   ├── projectbrief.md             (vision + scope)
│   ├── productContext.md           (user focus)
│   ├── systemPatterns.md           (technical patterns)
│   ├── techContext.md              (tools + setup)
│   ├── activeContext.md            (current focus)
│   └── progress.md                 (build status)
├── PRD_MVP.md                      (product requirements)
├── Tasklist_MVP.md                 (step-by-step tasks)
├── Architecture.md                 (system design)
└── src/                            (code - to be created)
```

---

## 🎯 Quick Reference Commands

**To find something quickly:**

| Need           | File                 | Section                       |
| -------------- | -------------------- | ----------------------------- |
| Vision         | `projectbrief.md`    | Overview                      |
| User stories   | `productContext.md`  | User Personas                 |
| Tech decisions | `systemPatterns.md`  | Key Technical Decisions       |
| Setup steps    | `techContext.md`     | Development Environment Setup |
| What's next    | `activeContext.md`   | Next Steps                    |
| Progress       | `progress.md`        | Quick Stats                   |
| All tasks      | `../Tasklist_MVP.md` | Full list                     |
| Design         | `../Architecture.md` | System diagram                |

---

## 💡 Pro Tips

1. **Keep this updated** - Update `activeContext.md` after each work session
2. **Update progress.md** - Check off completed tasks
3. **Add new decisions** - Document decisions in `activeContext.md` decision log
4. **Reference, don't reread** - If a section hasn't changed, skim it
5. **Use this as source of truth** - Don't check old chat logs; use memory bank

---

## 📝 Important Dates

- **Session 1:** October 20, 2025 (planning complete)
- **Session 2:** TBD (Phase 1 - Firebase + Expo)
- **Session 3:** TBD (Phase 2 - Auth screens)
- **...continuing...**
- **MVP Complete:** Target within 24 hours

---

## ✨ How This Helps

After a memory reset:

- ✅ Don't start from scratch
- ✅ Understand all previous decisions instantly
- ✅ Stay focused on critical path
- ✅ Remember what's already decided
- ✅ Avoid re-discussing same issues
- ✅ Maintain momentum across sessions

---

**Last Updated:** October 20, 2025  
**Maintained by:** Cursor (AI) + You (Developer)

---

Think of this memory bank as your **development assistant that remembers everything** so you don't have to.
