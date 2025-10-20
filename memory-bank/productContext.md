# Unilang - Product Context

## Problem Statement

**Current situation:** Messaging apps with real-time sync (WhatsApp, Messenger, Telegram) work great but don't bridge language barriers. Multilingual communities struggle to communicate across different languages in real-time.

**The gap:** No messaging app combines:

1. Reliable real-time sync
2. Automatic language translation
3. Cross-platform simplicity (mobile-first)

## Why Unilang?

**Long-term mission:** Enable seamless communication across languages.

**MVP focus:** Prove the _infrastructure_ (reliable real-time sync) works before adding AI translation in Phase 2.

Think of it like:

- **MVP:** Build the strongest foundation (WhatsApp-level reliability)
- **Phase 2:** Add AI magic (translation + summarization)

## How It Works (MVP)

### For Users

1. **Sign Up**

   - Email/password OR Google Sign-In
   - Choose preferred language (10 options)
   - Ready to chat in 2 minutes

2. **Find Someone**

   - Search by name or email
   - See who's online with green dot
   - Start chatting (no friend requests!)
   - Telegram-style open messaging

3. **Chat**

   - Messages appear instantly
   - See when someone reads your message (blue checkmark)
   - See last seen time when offline
   - Works perfectly offline; syncs when online

4. **Group Chat**

   - Add 3+ people at once
   - Admin can manage the group
   - Leave anytime (except admin)
   - See who's in the group

5. **Notifications**
   - Get notified of new messages
   - Works even when app is closed
   - Badge count shows unread messages

### For Developers

MVP is a reference implementation that proves:

- Real-time sync works reliably
- Offline support is robust
- Message delivery is guaranteed
- Group chat scales properly

Phase 2 builds AI features on this proven foundation.

## User Experience Goals

### Reliability ⭐⭐⭐⭐⭐

- Messages NEVER get lost
- Sync works on poor networks
- Works perfectly offline
- Survives app crash/restart

### Speed

- Messages appear instantly (optimistic UI)
- No loading spinners when sending
- Chat list loads in <1 second
- Smooth scrolling with 100+ messages

### Simplicity

- No confusing settings
- Clear visual indicators (✓ sent, ✓✓ read)
- Intuitive group management
- One-tap messaging

### Inclusivity

- 10 major languages supported
- Large text (accessibility)
- Simple UI (no clutter)
- Works on slow networks

## Core Differentiators (Phase 2+)

What makes Unilang different from WhatsApp/Messenger:

1. **Built-in translation** - Chat across languages without switching apps
2. **AI summarization** - Long conversations auto-summarized
3. **Language detection** - Automatically detect what language someone typed
4. **Community focus** - Designed for multilingual teams/groups
5. **Privacy-first** - Opt-in AI (Phase 2); local-first architecture

_In MVP, we just focus on 1 & 2: Reliable infrastructure._

## User Personas

### Persona 1: Maya (Multilingual Traveler)

- Travels frequently between countries
- Chats with friends in different languages
- Needs reliable messaging that works offline (spotty internet)
- Pain point: Switches between 3 messaging apps
- Solution: Unilang does it all in one

### Persona 2: Dev Team (International)

- 8-person distributed engineering team
- Speaks 5 different languages
- Needs group chat that works reliably
- Pain point: Misunderstandings due to language barriers
- Solution: Real-time translation in Phase 2

### Persona 3: Support Rep (Customer Service)

- Handles support tickets for global customers
- Customers speak different languages
- Needs to understand quickly
- Pain point: Context switches between apps + translators
- Solution: One app, built-in translation

## Success Metrics (MVP)

**What we measure at MVP gate:**

1. **Reliability**

   - Zero message loss over 100 messages sent
   - Offline→online sync 100% accurate
   - No crashes in 2-hour stress test

2. **Performance**

   - Real-time delivery <500ms average
   - Chat list loads <1 second
   - No UI lag at 20+ messages/second

3. **User Experience**

   - Can send first message within 2 minutes of signup
   - Can create group chat in <30 seconds
   - Can search and add user in <10 seconds

4. **Technical**
   - Works on iOS 14+ and Android 10+
   - Works on 3G network (simulated throttle)
   - Handles 100+ concurrent users

## Phase 2+ Roadmap (Conceptual)

**After MVP is proven reliable:**

1. **Phase 2 (Month 1):** AI Translation

   - Automatic language detection
   - Real-time translation on receive
   - Manual translation prompt

2. **Phase 3 (Month 2):** Advanced Features

   - Admin transfer
   - Message reactions
   - Voice messages

3. **Phase 4 (Month 3+):** Scaling
   - Web client
   - Desktop apps
   - API for third-party integrations

## Design Principles

1. **Reliability First** - Features come after rock-solid sync
2. **Offline First** - Always assume network might fail
3. **Simplicity** - Every feature must have clear purpose
4. **Speed** - Instant feedback (no loading spinners)
5. **Accessibility** - Works for everyone, everywhere
6. **Privacy** - User data never left unencrypted

## Out of Scope (MVP)

These DON'T happen in first 24 hours:

- Media sharing (images, files)
- Voice/video calls
- Typing indicators
- Message editing/deletion
- User profiles (name only, no avatar)
- Dark mode
- Web version
- Database migrations (start fresh each time)

All deferred to Phase 2+ when core is proven.

## Success Story (MVP Completion)

_"We built a messaging app that works as reliably as WhatsApp, handles offline perfectly, and scaled to 100 users in 24 hours. Now we know the infrastructure works and can safely add AI translation in Phase 2."_
