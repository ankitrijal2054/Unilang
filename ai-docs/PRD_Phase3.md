# Unilang – Phase 3: AI Messaging Features PRD

**Author:** Ankit Rijal  
**Date:** October 24, 2025  
**Version:** v1.0 (FINALIZED)  
**Status:** ✅ APPROVED FOR IMPLEMENTATION

---

## 🎯 Executive Summary

**Goal:** Transform Unilang into an AI-powered multilingual messaging platform by integrating 5 core AI features + 1 advanced capability using N8N workflow automation.

**Target Persona:** International Communicator (multilingual users, distributed teams, travelers)

**Key Outcome:** Users can communicate seamlessly across language barriers with real-time translation, smart replies, and tone adjustment—all within the existing WhatsApp-inspired UI.

**Implementation Approach:** Incremental rollout over ~10-12 hours using N8N Cloud + OpenAI GPT-4o-mini

---

## 📋 Table of Contents

1. [Overview & Objectives](#1-overview--objectives)
2. [AI Features Specification](#2-ai-features-specification)
3. [Architecture & Tech Stack](#3-architecture--tech-stack)
4. [N8N Workflow Setup](#4-n8n-workflow-setup)
5. [Data Model Changes](#5-data-model-changes)
6. [UI/UX Specifications](#6-uiux-specifications)
7. [Implementation Plan](#7-implementation-plan)
8. [Error Handling & Edge Cases](#8-error-handling--edge-cases)
9. [Testing Strategy](#9-testing-strategy)
10. [Cost Estimates](#10-cost-estimates)

---

## 1. Overview & Objectives

### 1.1 Success Criteria

| Metric                        | Target       | Measurement                 |
| ----------------------------- | ------------ | --------------------------- |
| Translation accuracy          | >90% correct | Manual review of 20 samples |
| Response time (translation)   | <5s          | Average API latency         |
| Response time (smart replies) | <8s          | Average API latency         |
| Retry success rate            | >95%         | Firestore logs              |
| Cache hit rate                | >70%         | Client-side tracking        |
| User adoption (AI features)   | >80%         | Feature usage analytics     |

### 1.2 Core Objectives

- ✅ Enable **on-demand translation** without leaving chat
- ✅ Reduce language barriers with **automatic detection**
- ✅ Provide **context-aware smart replies** to speed up responses
- ✅ Allow **tone adjustment** before sending (formal/casual/neutral)
- ✅ Explain **cultural context** for slang/idioms

### 1.3 Out of Scope (Phase 4+)

- ❌ Auto-translate all messages (too expensive)
- ❌ Voice message translation
- ❌ Real-time translation while typing
- ❌ Multiple target languages per message
- ❌ Translation history/versioning

---

## 2. AI Features Specification

### Feature 1: Real-Time Translation (On-Tap) 🌐

**Description:** Translate incoming messages to user's preferred language with a single tap.

**User Flow:**

1. User receives message in foreign language (e.g., Spanish)
2. User's `preferredLanguage` = English → Translate button appears
3. User taps **"Translate"** button below message
4. Spinner shows for ~2-3s
5. Message expands to show:
   - **Line 1:** Translated text (English)
   - **Line 2:** Original text (faded, italic)
6. Translation cached in Firestore `message.translation` field

**Business Logic:**

```typescript
// Show translate button only if:
showTranslateButton =
  !isOwnMessage && // Not your own message
  senderPreferredLanguage !== receiverPreferredLanguage; // Different languages
```

**Data Cached:**

```json
{
  "translation": {
    "text": "How are you?",
    "targetLang": "en",
    "sourceLang": "es",
    "timestamp": "2025-10-24T10:30:00Z",
    "provider": "openai-gpt4o-mini"
  }
}
```

**Edge Cases:**

- If sender's language = receiver's language → Hide button entirely
- If translation fails → Show error toast + retry button
- If already translated → Show toggle (hide/show translation)

---

### Feature 2: Auto Language Detection 🔍

**Description:** Automatically detect source language (assume sender's `preferredLanguage`) and target language (receiver's `preferredLanguage`).

**Implementation:**

- **Phase 3:** Assume `sourceLang = sender.preferredLanguage` (no API call)
- **Phase 4 Upgrade:** Call N8N language detection endpoint for actual detection

**Why Phase 3 Approach:**

- ✅ Instant button visibility (no API delay)
- ✅ Saves API costs (1 fewer call per message)
- ✅ 90%+ accuracy (most users type in their preferred language)

**Fallback:** If translation quality is poor, user can tap **"Retry"** which calls detection endpoint.

---

### Feature 3: Cultural Context & Slang Explanation 💬

**Description:** Detect idioms, slang, cultural references in translated text and provide explanations.

**User Flow:**

1. User taps **"Translate"** on message with slang (e.g., "break a leg")
2. N8N detects slang and returns explanation
3. Small **info icon** (ℹ️) appears below translated text
4. User taps → Shows tooltip: _"'Break a leg' means 'good luck' in English theater culture"_
5. If explanation >2 lines → Opens modal instead of tooltip

**N8N Logic:**

```javascript
// In N8N OpenAI node prompt
"Translate to {{targetLang}}. If the text contains slang, idioms, or cultural references,
list them with explanations in this format:
{ term: 'phrase', meaning: 'explanation' }"
```

**UI Styling:**

- **Tooltip**: Small yellow badge with `colorPalette.warning + '20'` background
- **Icon**: `MaterialCommunityIcons.information-outline`
- **Modal**: Full-screen with title "Cultural Context"

---

### Feature 4: Formality Adjustment (Send-Side) 🎩

**Description:** Rewrite outgoing message to match selected tone before sending.

**User Flow:**

1. User types message: _"Hey, can u send me that file?"_
2. User taps **⚙️ Tune button** (left of attachment icon)
3. Menu appears with 3 options:
   - 🎩 **Formal** → "Hello, could you please send me that file?"
   - 😊 **Neutral** → "Hi, can you send me that file?"
   - 😎 **Casual** → "Hey, can you send that file?"
4. User selects **Formal**
5. Input text replaced with rewritten version (with spinner)
6. User can still edit before tapping Send

**Implementation:**

```typescript
const handleAdjustTone = async (tone: "formal" | "neutral" | "casual") => {
  setToneLoading(true);
  const rewrittenText = await callN8nToneAdjust(messageText, tone);
  setMessageText(rewrittenText);
  setToneLoading(false);
};
```

**N8N Workflow:**

- Endpoint: `https://your-n8n-instance.com/webhook/adjust-tone`
- Input: `{ text, tone }`
- Output: `{ rewrittenText }`

---

### Feature 5: Translation Toggle ⇄

**Description:** Tap translate button again to hide/show translated text.

**State Management:**

```typescript
// In message state
{
  id: "msg123",
  translation: { text: "...", ... },
  translationVisible: true // Toggle state
}
```

**Behavior:**

- First tap → Fetch translation, show stacked view, set `translationVisible = true`
- Second tap → Hide translation, show original only, set `translationVisible = false`
- Third tap → Show translation again (from cache, instant)
- State persists across app restarts (stored in Firestore)

---

### Feature 6: Smart Replies (Advanced) 🤖

**Description:** Generate 3 contextual reply suggestions based on conversation history.

**User Flow:**

1. User receives new message
2. **"💬 Smart Replies"** button appears below typing indicator
3. User taps button → API call with last 8 messages as context
4. After ~5s, 3 reply chips appear horizontally:
   - "Sounds good!"
   - "Sure, I'll check it out."
   - "Thanks for the update."
5. User taps chip → Text inserted into input box (not auto-sent)
6. Button auto-hides after 10 seconds or when user starts typing

**Context Sent to N8N:**

```json
{
  "chatId": "chat123",
  "messages": [
    { "sender": "John", "text": "Did you finish the report?" },
    { "sender": "You", "text": "Almost done, just need 10 more minutes" },
    { "sender": "John", "text": "Great! Send it when ready." }
    // ... last 8 messages
  ],
  "userPreferredLanguage": "en",
  "userTone": "casual" // Inferred from user's last 3 sent messages
}
```

**Output:**

```json
{
  "replies": ["Will do!", "Sending it now.", "Thanks for being patient!"]
}
```

**Tone Matching:** N8N analyzes user's recent messages to match their speaking style (formal vs casual).

---

## 3. Architecture & Tech Stack

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────┐
│  React Native (Expo) - Unilang Frontend         │
│  • MessageBubble component (translate UI)       │
│  • ChatScreen (smart replies, tone menu)        │
│  • aiService.ts (N8N API calls)                 │
└─────────────────────────────────────────────────┘
           ↓ HTTPS POST
┌─────────────────────────────────────────────────┐
│  N8N Cloud (Workflow Automation)                │
│  • Workflow 1: Translation + Slang Detection    │
│  • Workflow 2: Tone Adjustment                  │
│  • Workflow 3: Smart Replies Generation         │
└─────────────────────────────────────────────────┘
           ↓ API Call
┌─────────────────────────────────────────────────┐
│  OpenAI API (GPT-4o-mini)                       │
│  • Language translation                         │
│  • Context analysis                             │
│  • Reply generation                             │
└─────────────────────────────────────────────────┘
           ↓ Response
┌─────────────────────────────────────────────────┐
│  Firebase Firestore (Caching Layer)             │
│  • messages/{id}.translation                    │
│  • messages/{id}.translationVisible             │
└─────────────────────────────────────────────────┘
```

### 3.2 Technology Stack

| Layer                | Technology          | Purpose                                     |
| -------------------- | ------------------- | ------------------------------------------- |
| **Frontend**         | React Native + Expo | Mobile app UI                               |
| **AI Orchestration** | N8N Cloud           | Workflow automation + API routing           |
| **LLM Provider**     | OpenAI GPT-4o-mini  | Translation, tone adjustment, smart replies |
| **Caching**          | Firebase Firestore  | Store translations permanently              |
| **State Management** | Zustand             | Local translation visibility state          |
| **UI Components**    | React Native Paper  | Buttons, menus, modals                      |

### 3.3 Why N8N?

✅ **No backend code needed** – Visual workflow builder  
✅ **Built-in OpenAI integration** – Pre-built nodes  
✅ **Error handling** – Automatic retries, fallback paths  
✅ **Cost control** – Rate limiting, caching at workflow level  
✅ **Fast iteration** – Change prompts without redeploying app  
✅ **Monitoring** – Built-in execution logs and analytics

---

## 4. N8N Workflow Setup

### 4.1 N8N Cloud Setup (15 minutes)

**Step 1: Create N8N Cloud Account**

1. Go to https://n8n.io/cloud
2. Sign up (free trial or starter plan $20/month)
3. Create new workspace: "Unilang-AI"

**Step 2: Connect OpenAI**

1. In N8N → Credentials → Add New
2. Select "OpenAI"
3. Enter OpenAI API key
4. Test connection

**Step 3: Enable Webhooks**

1. Settings → Webhooks → Enable production URLs
2. Copy base webhook URL: `https://your-instance.app.n8n.cloud/webhook/`

---

### 4.2 Workflow 1: Translation + Slang Detection

**Endpoint:** `POST /webhook/translate`

**Nodes:**

```
[Webhook Trigger]
    ↓
[Function: Extract Input]
    ↓
[OpenAI: Translate]
    ↓
[Function: Parse Slang]
    ↓
[Respond to Webhook]
```

**Detailed Configuration:**

**Node 1: Webhook Trigger**

- Method: POST
- Path: `/translate`
- Authentication: None (add API key header in Phase 4)

**Node 2: Function - Extract Input**

```javascript
const text = $input.first().json.text;
const targetLang = $input.first().json.targetLang || "en";
const sourceLang = $input.first().json.sourceLang || "auto";

return {
  json: { text, targetLang, sourceLang },
};
```

**Node 3: OpenAI Node**

- Model: `gpt-4o-mini`
- Prompt:

```
You are a translation assistant. Translate the following text to {{$json.targetLang}}.

If the text contains slang, idioms, or cultural references:
1. Provide the translation
2. List each slang term with a brief explanation

Text: {{$json.text}}

Respond in JSON format:
{
  "translation": "translated text",
  "slang": [
    { "term": "phrase", "meaning": "explanation" }
  ]
}

If no slang, return empty array for slang.
```

**Node 4: Function - Parse Response**

```javascript
const response = JSON.parse($input.first().json.choices[0].message.content);

return {
  json: {
    translation: response.translation,
    slang: response.slang || [],
    sourceLang: $node["Extract Input"].json.sourceLang,
    targetLang: $node["Extract Input"].json.targetLang,
    timestamp: new Date().toISOString(),
  },
};
```

**Node 5: Respond to Webhook**

```javascript
return {
  json: $input.first().json,
};
```

**Expected Response:**

```json
{
  "translation": "¿Cómo estás?",
  "slang": [],
  "sourceLang": "en",
  "targetLang": "es",
  "timestamp": "2025-10-24T10:30:00Z"
}
```

---

### 4.3 Workflow 2: Tone Adjustment

**Endpoint:** `POST /webhook/adjust-tone`

**Nodes:**

```
[Webhook Trigger]
    ↓
[Function: Extract Input]
    ↓
[OpenAI: Rewrite]
    ↓
[Respond to Webhook]
```

**OpenAI Prompt:**

```
Rewrite the following message in a {{$json.tone}} tone while keeping the exact same meaning.

Tone options:
- formal: Professional, polite, no slang
- neutral: Clear and friendly
- casual: Relaxed, conversational

Original message: {{$json.text}}

Return only the rewritten text, no explanations.
```

**Example:**

```json
// Input
{ "text": "hey can u send that?", "tone": "formal" }

// Output
{ "rewrittenText": "Hello, could you please send that to me?" }
```

---

### 4.4 Workflow 3: Smart Replies

**Endpoint:** `POST /webhook/smart-replies`

**Nodes:**

```
[Webhook Trigger]
    ↓
[Function: Format Context]
    ↓
[OpenAI: Generate Replies]
    ↓
[Function: Parse Replies]
    ↓
[Respond to Webhook]
```

**OpenAI Prompt:**

```
You are a smart reply assistant. Based on the conversation history, suggest 3 short, natural replies the user could send.

Conversation history:
{{$json.messages}}

User's preferred language: {{$json.userPreferredLanguage}}
User's tone: {{$json.userTone}}

Guidelines:
- Keep replies under 10 words each
- Match the user's tone (formal/casual)
- Be contextually relevant
- Vary the replies (don't repeat)

Return JSON:
{
  "replies": ["Reply 1", "Reply 2", "Reply 3"]
}
```

**Example:**

```json
// Input
{
  "messages": [
    { "sender": "Alice", "text": "Can you review my PR?" },
    { "sender": "You", "text": "Sure, looking now" },
    { "sender": "Alice", "text": "Found any issues?" }
  ],
  "userPreferredLanguage": "en",
  "userTone": "casual"
}

// Output
{
  "replies": [
    "Looks good to me!",
    "Just a few minor comments.",
    "Need a bit more time."
  ]
}
```

---

### 4.5 Error Handling in N8N

**Add to each workflow:**

1. **HTTP Status Check Node** (after OpenAI):
   - If status !== 200 → Go to error path
2. **Error Path:**

   - Set HTTP response code: 500
   - Return: `{ "error": "Translation failed", "retry": true }`

3. **Timeout Node:**
   - Set workflow timeout: 10 seconds
   - On timeout → Return error response

---

## 5. Data Model Changes

### 5.1 Message Type Extension

**File:** `src/types/Message.ts`

```typescript
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
  type?: "user" | "system";
  messageType?: "text" | "image";
  localStatus?: "pending" | "sent";
  readBy?: string[];
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;

  // ✨ NEW: AI Translation fields
  translation?: {
    text: string; // Translated text
    sourceLang: string; // Detected/assumed source language
    targetLang: string; // User's preferred language
    timestamp: string; // When translation was created
    provider: string; // "openai-gpt4o-mini"
    slangExplanation?: string; // Optional cultural context
  };
  translationVisible?: boolean; // UI state: show/hide translation

  // Existing AI fields (deprecated - replace with translation)
  ai: {
    translated_text: string;
    detected_language: string;
    summary: string;
  };
}
```

**Migration:** Existing `ai` field will be replaced by `translation` field. Old messages keep `ai` for backward compatibility.

---

### 5.2 User Type (Already Exists)

**File:** `src/types/User.ts`

```typescript
export interface User {
  uid: string;
  name: string;
  email: string;
  preferred_language: string; // Used for translation target
  status: "online" | "offline";
  lastSeen: string;
  fcmToken?: string;
  avatarUrl?: string;
  createdAt: string;
}
```

**No changes needed** – `preferred_language` already exists from Phase 1.

---

### 5.3 Firestore Security Rules Update

**Add to `firestore.rules`:**

```javascript
match /messages/{messageId} {
  // Allow updating translation field for authenticated users
  allow update: if request.auth != null &&
                   request.resource.data.translation is map;
}
```

---

## 6. UI/UX Specifications

### 6.1 MessageBubble Component Updates

**File:** `src/components/MessageBubble.tsx`

**New Elements:**

1. **Translate Button** (below timestamp)

```tsx
{
  !isOwnMessage && showTranslateButton && (
    <TouchableOpacity
      onPress={() => handleTranslate(message.id)}
      style={styles.translateButton}
    >
      {translating ? (
        <ActivityIndicator size={12} color={colorPalette.primary} />
      ) : (
        <MaterialCommunityIcons
          name="translate"
          size={14}
          color={colorPalette.neutral[500]}
        />
      )}
      <Text style={styles.translateButtonText}>
        {message.translation ? "Hide" : "Translate"}
      </Text>
    </TouchableOpacity>
  );
}
```

2. **Stacked Translation View**

```tsx
{
  message.translation && message.translationVisible ? (
    <View>
      {/* Translated text */}
      <Text style={[textStyle, styles.translatedText]}>
        {message.translation.text}
      </Text>

      {/* Divider */}
      <View style={styles.translationDivider} />

      {/* Original text (faded) */}
      <View style={styles.originalTextContainer}>
        <Text style={styles.originalText}>{message.text}</Text>
      </View>

      {/* Retry button */}
      <TouchableOpacity
        onPress={() => handleRetryTranslation(message.id)}
        style={styles.retryButton}
      >
        <MaterialCommunityIcons name="refresh" size={12} />
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <Text style={textStyle}>{message.text}</Text>
  );
}
```

3. **Slang Tooltip**

```tsx
{
  message.translation?.slangExplanation && (
    <TouchableOpacity
      style={styles.slangTooltip}
      onPress={() => setShowSlangModal(true)}
    >
      <MaterialCommunityIcons
        name="information-outline"
        size={12}
        color={colorPalette.warning}
      />
      <Text style={styles.slangTooltipText}>Cultural context</Text>
    </TouchableOpacity>
  );
}
```

**New Styles:**

```tsx
translateButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 4,
  paddingVertical: 4,
  paddingHorizontal: 8,
  borderRadius: 8,
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
},
translateButtonText: {
  fontSize: 11,
  color: colorPalette.primary,
  fontWeight: '600',
},
translationDivider: {
  height: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  marginVertical: 8,
},
originalTextContainer: {
  opacity: 0.5,
},
originalText: {
  fontSize: 12,
  fontStyle: 'italic',
  lineHeight: 18,
},
retryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 6,
  alignSelf: 'flex-start',
},
retryText: {
  fontSize: 10,
  color: colorPalette.neutral[600],
},
slangTooltip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 6,
  padding: 6,
  backgroundColor: colorPalette.warning + '20',
  borderRadius: 6,
},
slangTooltipText: {
  fontSize: 11,
  color: colorPalette.warning,
  fontWeight: '600',
},
```

---

### 6.2 ChatScreen Updates

**File:** `src/screens/ChatsTab/ChatScreen.tsx`

**1. Add Tone Menu (Left of Attachment Button)**

```tsx
// State
const [toneMenuVisible, setToneMenuVisible] = useState(false);
const [adjustingTone, setAdjustingTone] = useState(false);

// In inputContainer
<View style={styles.inputContainer}>
  {/* Tone Menu */}
  <Menu
    visible={toneMenuVisible}
    onDismiss={() => setToneMenuVisible(false)}
    anchor={
      <IconButton
        icon={() => (
          <MaterialCommunityIcons
            name="tune-variant"
            size={24}
            color={colorPalette.neutral[600]}
          />
        )}
        onPress={() => setToneMenuVisible(true)}
        disabled={!messageText.trim() || adjustingTone}
      />
    }
  >
    <Menu.Item
      onPress={() => handleAdjustTone("formal")}
      title="🎩 Formal"
      leadingIcon="tuxedo"
    />
    <Menu.Item
      onPress={() => handleAdjustTone("neutral")}
      title="😊 Neutral"
      leadingIcon="emoticon-neutral"
    />
    <Menu.Item
      onPress={() => handleAdjustTone("casual")}
      title="😎 Casual"
      leadingIcon="emoticon-cool"
    />
  </Menu>

  <IconButton icon="paperclip" onPress={handlePickImage} />

  <TextInput
    value={messageText}
    onChangeText={handleTextInputChange}
    placeholder={adjustingTone ? "Adjusting tone..." : "Type a message..."}
    editable={!adjustingTone}
  />

  <IconButton icon="send" onPress={handleSendMessage} />
</View>;
```

**2. Add Smart Replies Section**

```tsx
// State
const [smartReplies, setSmartReplies] = useState<string[]>([]);
const [smartRepliesVisible, setSmartRepliesVisible] = useState(false);
const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);

// Below typing indicator, above input
{
  smartRepliesVisible && (
    <View style={styles.smartRepliesContainer}>
      <View style={styles.smartRepliesHeader}>
        <MaterialCommunityIcons
          name="robot-outline"
          size={16}
          color={colorPalette.primary}
        />
        <Text style={styles.smartRepliesLabel}>Smart Replies</Text>

        {/* Close button */}
        <TouchableOpacity
          onPress={() => setSmartRepliesVisible(false)}
          style={styles.smartRepliesClose}
        >
          <MaterialCommunityIcons
            name="close"
            size={16}
            color={colorPalette.neutral[500]}
          />
        </TouchableOpacity>
      </View>

      {loadingSmartReplies ? (
        <ActivityIndicator
          size="small"
          color={colorPalette.primary}
          style={{ marginVertical: 12 }}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.smartRepliesScroll}
        >
          {smartReplies.map((reply, index) => (
            <TouchableOpacity
              key={index}
              style={styles.smartReplyChip}
              onPress={() => handleSelectSmartReply(reply)}
            >
              <Text style={styles.smartReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
```

**New Styles:**

```tsx
smartRepliesContainer: {
  padding: 12,
  backgroundColor: colorPalette.surface,
  borderTopWidth: 1,
  borderTopColor: colorPalette.neutral[200],
},
smartRepliesHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginBottom: 8,
},
smartRepliesLabel: {
  flex: 1,
  fontSize: 13,
  fontWeight: '600',
  color: colorPalette.neutral[700],
},
smartRepliesClose: {
  padding: 4,
},
smartRepliesScroll: {
  gap: 8,
},
smartReplyChip: {
  paddingVertical: 10,
  paddingHorizontal: 16,
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: colorPalette.primary + '30',
},
smartReplyText: {
  fontSize: 14,
  color: colorPalette.primary,
  fontWeight: '500',
},
```

---

### 6.3 New Service: aiService.ts

**File:** `src/services/aiService.ts` (NEW)

```typescript
import { Message } from "../types";

const N8N_BASE_URL = "https://your-instance.app.n8n.cloud/webhook";

interface TranslationResponse {
  translation: string;
  slang: Array<{ term: string; meaning: string }>;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

interface ToneAdjustmentResponse {
  rewrittenText: string;
}

interface SmartRepliesResponse {
  replies: string[];
}

/**
 * Call N8N translation workflow
 */
export const translateMessage = async (
  text: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<TranslationResponse> => {
  try {
    const response = await fetch(`${N8N_BASE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLang, sourceLang }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
};

/**
 * Call N8N tone adjustment workflow
 */
export const adjustTone = async (
  text: string,
  tone: "formal" | "neutral" | "casual"
): Promise<string> => {
  try {
    const response = await fetch(`${N8N_BASE_URL}/adjust-tone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tone }),
    });

    if (!response.ok) {
      throw new Error(`Tone adjustment failed: ${response.status}`);
    }

    const data: ToneAdjustmentResponse = await response.json();
    return data.rewrittenText;
  } catch (error) {
    console.error("Tone adjustment error:", error);
    throw error;
  }
};

/**
 * Call N8N smart replies workflow
 */
export const generateSmartReplies = async (
  messages: Array<{ sender: string; text: string }>,
  userPreferredLanguage: string,
  userTone: "formal" | "casual" = "casual"
): Promise<string[]> => {
  try {
    const response = await fetch(`${N8N_BASE_URL}/smart-replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        userPreferredLanguage,
        userTone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Smart replies failed: ${response.status}`);
    }

    const data: SmartRepliesResponse = await response.json();
    return data.replies;
  } catch (error) {
    console.error("Smart replies error:", error);
    throw error;
  }
};

/**
 * Cache translation in Firestore
 */
export const cacheTranslation = async (
  messageId: string,
  translation: TranslationResponse
): Promise<void> => {
  const { updateDoc, doc } = await import("firebase/firestore");
  const { db } = await import("./firebase");

  try {
    await updateDoc(doc(db, "messages", messageId), {
      translation: {
        text: translation.translation,
        sourceLang: translation.sourceLang,
        targetLang: translation.targetLang,
        timestamp: translation.timestamp,
        provider: "openai-gpt4o-mini",
        slangExplanation:
          translation.slang.length > 0
            ? translation.slang.map((s) => `${s.term}: ${s.meaning}`).join("\n")
            : undefined,
      },
      translationVisible: true,
    });
  } catch (error) {
    console.error("Error caching translation:", error);
    throw error;
  }
};
```

---

## 7. Implementation Plan

### 7.1 Incremental Rollout Order

**Phase 3A: Translation Core (3-4 hours)**

1. ✅ Set up N8N Cloud + Workflow 1 (Translation)
2. ✅ Create `aiService.ts` with translation functions
3. ✅ Update Message type with translation fields
4. ✅ Add translate button to MessageBubble
5. ✅ Implement stacked translation view
6. ✅ Add Firestore caching logic
7. ✅ Add retry button
8. ✅ Test with 10 sample messages (Spanish ↔ English)

**Phase 3B: Smart Replies (2-3 hours)**

1. ✅ Set up N8N Workflow 3 (Smart Replies)
2. ✅ Add smart replies UI to ChatScreen
3. ✅ Implement context extraction (last 8 messages)
4. ✅ Add auto-hide logic (10s timeout, hide on typing)
5. ✅ Test reply selection flow

**Phase 3C: Formality Adjustment (1.5-2 hours)**

1. ✅ Set up N8N Workflow 2 (Tone Adjustment)
2. ✅ Add tone menu to ChatScreen input bar
3. ✅ Implement tone adjustment logic
4. ✅ Test all 3 tones (formal/neutral/casual)

**Phase 3D: Cultural Context (1-1.5 hours)**

1. ✅ Update Translation workflow to detect slang
2. ✅ Add slang tooltip to MessageBubble
3. ✅ Create SlangModal component (if explanation >2 lines)
4. ✅ Test with slang-heavy messages

**Phase 3E: Polish & Testing (2-3 hours)**

1. ✅ Add error handling (timeouts, retry logic)
2. ✅ Add loading states (spinners, skeleton screens)
3. ✅ Test offline behavior (show cached translations)
4. ✅ Test translation toggle persistence
5. ✅ End-to-end testing with 2 devices

**Total Estimate:** 10-13 hours

---

### 7.2 File Changes Checklist

**New Files (2)**

- [ ] `src/services/aiService.ts` (AI API calls)
- [ ] `src/components/SlangModal.tsx` (Cultural context modal)

**Updated Files (5)**

- [ ] `src/types/Message.ts` (Add translation fields)
- [ ] `src/components/MessageBubble.tsx` (Translate button + stacked view)
- [ ] `src/screens/ChatsTab/ChatScreen.tsx` (Tone menu + smart replies)
- [ ] `src/utils/constants.ts` (Add N8N_BASE_URL)
- [ ] `firestore.rules` (Allow translation field updates)

**N8N Workflows (3)**

- [ ] Workflow 1: Translation + Slang Detection
- [ ] Workflow 2: Tone Adjustment
- [ ] Workflow 3: Smart Replies

---

## 8. Error Handling & Edge Cases

### 8.1 Translation Errors

| Scenario                   | Behavior                 | User Feedback                        |
| -------------------------- | ------------------------ | ------------------------------------ |
| N8N timeout (>10s)         | Show error toast         | "Translation unavailable, try again" |
| Invalid response           | Log error, show retry    | "Translation failed, tap to retry"   |
| Network offline            | Disable translate button | Show cached translation if available |
| Sender = Receiver language | Hide translate button    | No action needed                     |
| Already translated         | Toggle visibility        | Show/hide instantly (no API call)    |

**Implementation:**

```typescript
const handleTranslate = async (messageId: string) => {
  try {
    setTranslating(true);

    // Check cache first
    if (message.translation) {
      toggleTranslationVisibility(messageId);
      return;
    }

    // Check network
    const online = await isOnline();
    if (!online) {
      Alert.alert("Offline", "Translation unavailable while offline");
      return;
    }

    // Call N8N with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 10000)
    );

    const translationPromise = translateMessage(
      message.text,
      user.preferred_language,
      senderPreferredLanguage
    );

    const result = await Promise.race([translationPromise, timeoutPromise]);

    await cacheTranslation(messageId, result);
  } catch (error) {
    if (error.message === "Timeout") {
      Alert.alert("Timeout", "Translation took too long. Please try again.");
    } else {
      Alert.alert("Error", "Translation failed. Please try again.");
    }
  } finally {
    setTranslating(false);
  }
};
```

---

### 8.2 Smart Replies Edge Cases

| Scenario                | Behavior                | User Feedback               |
| ----------------------- | ----------------------- | --------------------------- |
| No recent messages (<3) | Don't show button       | No feedback needed          |
| All messages from user  | Don't show button       | No context to reply to      |
| Generation fails        | Show error, hide button | "Smart replies unavailable" |
| Network offline         | Disable button          | Gray out button             |

---

### 8.3 Tone Adjustment Edge Cases

| Scenario                     | Behavior              | User Feedback              |
| ---------------------------- | --------------------- | -------------------------- |
| Empty input                  | Disable menu button   | No feedback                |
| Very short text (<5 chars)   | Disable menu button   | "Text too short to adjust" |
| Adjustment fails             | Restore original text | "Tone adjustment failed"   |
| User edits during adjustment | Cancel API call       | Restore edited text        |

---

## 9. Testing Strategy

### 9.1 Unit Tests

**File:** `src/services/__tests__/aiService.test.ts`

```typescript
describe("aiService", () => {
  test("translateMessage returns translation", async () => {
    const result = await translateMessage("Hello", "es", "en");
    expect(result.translation).toBe("Hola");
    expect(result.targetLang).toBe("es");
  });

  test("translateMessage handles timeout", async () => {
    // Mock slow response
    await expect(translateMessage("Hello", "es")).rejects.toThrow("Timeout");
  });

  test("generateSmartReplies returns 3 suggestions", async () => {
    const messages = [{ sender: "Alice", text: "How are you?" }];
    const replies = await generateSmartReplies(messages, "en");
    expect(replies).toHaveLength(3);
  });
});
```

---

### 9.2 Integration Tests

**Manual Testing Scenarios:**

1. **Translation Flow**

   - [ ] Receive Spanish message → Translate → See English + faded Spanish
   - [ ] Tap again → Hide translation → See only Spanish
   - [ ] Reopen chat → Translation still visible (persistence)
   - [ ] Tap retry → New translation appears

2. **Smart Replies Flow**

   - [ ] Receive message → Smart replies button appears
   - [ ] Tap button → 3 suggestions appear after ~5s
   - [ ] Tap suggestion → Text inserted into input
   - [ ] Start typing → Smart replies disappear

3. **Tone Adjustment Flow**

   - [ ] Type casual message → Select "Formal" → Input text changes
   - [ ] Edit formal text → Send → Message sent with edits

4. **Slang Detection Flow**

   - [ ] Receive "break a leg" → Translate → Info icon appears
   - [ ] Tap info icon → Tooltip shows explanation

5. **Error Scenarios**
   - [ ] Turn off WiFi → Tap translate → "Unavailable" message
   - [ ] Simulate N8N down → Retry 3 times → Error toast

---

### 9.3 E2E Testing (2 Devices)

**Device A (English)** ↔ **Device B (Spanish)**

1. A sends English → B translates to Spanish ✅
2. B sends Spanish → A translates to English ✅
3. A uses smart replies → Inserts suggested text ✅
4. B uses tone adjustment (formal) → A receives formal message ✅
5. Both close app, reopen → Translations still visible ✅

---

## 10. Cost Estimates

### 10.1 OpenAI API Costs (GPT-4o-mini)

**Pricing:**

- Input: $0.150 per 1M tokens
- Output: $0.600 per 1M tokens

**Usage Estimates (per user/month):**

| Feature            | Usage                      | Tokens | Cost/Month |
| ------------------ | -------------------------- | ------ | ---------- |
| Translation        | 100 calls × 200 tokens avg | 20,000 | $0.02      |
| Smart Replies      | 20 calls × 500 tokens avg  | 10,000 | $0.01      |
| Tone Adjustment    | 10 calls × 150 tokens avg  | 1,500  | $0.001     |
| **Total per user** |                            | 31,500 | **$0.03**  |

**10 users × $0.03 = $0.30/month** 💰

---

### 10.2 N8N Cloud Costs

**Starter Plan:** $20/month

- 2,500 workflow executions/month
- Unlimited workflows
- 99.9% uptime SLA

**Your usage:**

- 10 users × 130 AI calls/month = 1,300 executions
- Well under 2,500 limit ✅

---

### 10.3 Total Monthly Cost

| Service    | Cost             |
| ---------- | ---------------- |
| OpenAI API | $0.30            |
| N8N Cloud  | $20.00           |
| **Total**  | **$20.30/month** |

**Cost per user:** $2.03/month

---

## 11. Success Metrics & KPIs

### 11.1 Feature Adoption

- **Translation usage:** % of foreign messages translated
- **Smart reply acceptance:** % of suggestions actually sent
- **Tone adjustment usage:** % of messages adjusted before sending

### 11.2 Quality Metrics

- **Translation accuracy:** Manual review of 20 samples
- **Smart reply relevance:** User satisfaction survey
- **Response time:** 95th percentile latency

### 11.3 Technical Metrics

- **Cache hit rate:** % of translations served from cache
- **Error rate:** % of API calls that fail
- **Retry success rate:** % of retries that succeed

---

## 12. Future Enhancements (Phase 4)

1. **Auto-Translation Toggle:** Translate all messages automatically
2. **Multiple Target Languages:** Translate to any language (not just preferred)
3. **Translation History:** View all past translations of a message
4. **Voice Message Translation:** Transcribe + translate audio
5. **Real-Time Translation:** Translate as user types
6. **Custom Tone Profiles:** Save "work mode" vs "friends mode" tones
7. **Smart Reply Learning:** Personalize suggestions based on user's style
8. **Actual Language Detection API:** Replace assumption with real detection

---

## 13. Deployment Checklist

### Pre-Launch

- [ ] N8N workflows tested with 50+ sample inputs
- [ ] OpenAI API key secured (use environment variables)
- [ ] Firestore security rules updated
- [ ] Message type migration tested (old messages still work)
- [ ] Error handling tested (timeout, network errors)
- [ ] Cache persistence verified (app restart)
- [ ] UI matches existing frosted glass design

### Launch

- [ ] Deploy N8N workflows to production
- [ ] Update app with new code
- [ ] Test with 2 real devices
- [ ] Monitor OpenAI usage in first 24h
- [ ] Check N8N execution logs for errors

### Post-Launch

- [ ] Collect user feedback on translation quality
- [ ] Monitor costs (should stay <$25/month)
- [ ] Iterate on prompts if quality issues
- [ ] Add rate limiting if abuse detected

---

## 14. Appendix

### 14.1 N8N Workflow Export

**Full workflow JSON will be provided in implementation phase.**

### 14.2 OpenAI Prompt Templates

**Translation Prompt:**

```
You are a professional translator. Translate the following text from {{sourceLang}} to {{targetLang}}.

Guidelines:
- Maintain the original meaning and tone
- Use natural, native-level language
- Preserve formatting (line breaks, punctuation)
- If the text contains slang, idioms, or cultural references, note them

Text to translate:
{{text}}

Return JSON:
{
  "translation": "translated text here",
  "slang": [
    { "term": "phrase", "meaning": "brief explanation" }
  ]
}

If no slang detected, return empty array for slang.
```

**Tone Adjustment Prompt:**

```
Rewrite the following message in a {{tone}} tone while preserving the exact meaning.

Tone definitions:
- formal: Professional, polite, no contractions, no slang
- neutral: Clear, friendly, standard grammar
- casual: Relaxed, conversational, contractions OK

Original message:
{{text}}

Return only the rewritten text. Do not include explanations or labels.
```

**Smart Replies Prompt:**

```
You are a smart reply assistant. Based on the conversation history below, generate 3 short, natural reply options.

Conversation:
{{#each messages}}
{{this.sender}}: {{this.text}}
{{/each}}

User's language: {{userPreferredLanguage}}
User's tone: {{userTone}}

Requirements:
- Each reply should be under 10 words
- Match the user's tone (formal/casual)
- Be contextually appropriate
- Provide variety (different sentiment/direction)

Return JSON:
{
  "replies": ["Reply 1", "Reply 2", "Reply 3"]
}
```

---

## 15. Summary

**Phase 3 delivers:**

- ✅ 5 core AI features + 1 advanced feature
- ✅ N8N-powered workflow automation
- ✅ Seamless integration with existing UI
- ✅ Cost-effective (<$25/month for 10 users)
- ✅ 10-13 hour implementation timeline
- ✅ Incremental rollout (Translation → Smart Replies → Formality → Slang)

**Key Decisions:**

- **Language detection:** Assume sender's `preferredLanguage` (Phase 3), upgrade to API detection (Phase 4)
- **Translation caching:** Permanent storage in Firestore, instant on reopen
- **Smart replies:** Last 8 messages as context, match user's tone
- **Error handling:** 10s timeout, retry button, graceful degradation
- **Cost control:** N8N Cloud ($20/mo) + OpenAI ($0.30/mo) = $20.30/mo total

**Next Steps:**

1. Set up N8N Cloud account
2. Create 3 workflows (Translation, Tone, Smart Replies)
3. Begin Phase 3A implementation (Translation Core)
4. Test with 2 devices (English ↔ Spanish)
5. Iterate based on quality feedback

---

**Status:** ✅ **PRD FINALIZED & READY FOR IMPLEMENTATION**  
**Approved by:** Ankit Rijal  
**Date:** October 24, 2025
