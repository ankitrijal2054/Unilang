# Unilang Phase 3 - AI Features Implementation Tasklist

**Version:** v1.0 (APPROVED)  
**Status:** READY TO START  
**Estimated Time:** 10-13 hours  
**Implementation Order:** Incremental (Translation → Smart Replies → Formality → Slang)

---

## SETUP TASKS (1-1.5 hours)

### Task 0.1: N8N Cloud Setup (30 min)

- [ ] Create N8N Cloud account at https://n8n.io/cloud
- [ ] Select Starter plan ($20/month) or free trial
- [ ] Create workspace: "Unilang-AI"
- [ ] Enable production webhooks
- [ ] Copy webhook base URL: `https://your-instance.app.n8n.cloud/webhook/`

**Documentation:** Save webhook URL in `.env` file

### Task 0.2: OpenAI API Setup (15 min)

- [ ] Get OpenAI API key from https://platform.openai.com/api-keys
- [ ] Add to N8N credentials:
  - N8N → Credentials → Add New → OpenAI
  - Paste API key
  - Test connection
- [ ] Set billing alert at $10/month (safety limit)

### Task 0.3: Update Project Dependencies (15 min)

```bash
# No new npm packages needed!
# All existing dependencies support AI features
```

- [ ] Update `.env` or `constants.ts` with N8N webhook URL
- [ ] Verify Firebase Firestore rules allow `translation` field updates

**Code File:** `src/utils/constants.ts`

```typescript
export const N8N_WEBHOOKS = {
  TRANSLATE: "https://your-instance.app.n8n.cloud/webhook/translate",
  ADJUST_TONE: "https://your-instance.app.n8n.cloud/webhook/adjust-tone",
  SMART_REPLIES: "https://your-instance.app.n8n.cloud/webhook/smart-replies",
};
```

---

## PHASE 3A: TRANSLATION CORE (3-4 hours)

### Task 1.1: Create N8N Translation Workflow (45 min)

- [ ] In N8N, create new workflow: "Unilang - Translation + Slang"
- [ ] Add nodes in order:
  1. **Webhook Trigger** (POST, path: `/translate`)
  2. **Function Node** - Extract Input
  3. **OpenAI Node** - Translate + Detect Slang
  4. **Function Node** - Parse Response
  5. **Respond to Webhook** - Return JSON

**Node 3 - OpenAI Configuration:**

- Model: `gpt-4o-mini`
- Prompt (see PRD Section 4.2)
- Temperature: 0.3
- Max tokens: 500

**Testing:**

- [ ] Use N8N's "Test Workflow" with sample input:
  ```json
  {
    "text": "How's it going?",
    "targetLang": "es",
    "sourceLang": "en"
  }
  ```
- [ ] Verify response format matches expected structure
- [ ] Test with slang: "break a leg" → Should return slang array
- [ ] Save & activate workflow

### Task 1.2: Create aiService.ts (30 min)

- [ ] Create new file: `src/services/aiService.ts`
- [ ] Implement `translateMessage()` function
- [ ] Implement `cacheTranslation()` function
- [ ] Add timeout logic (10 seconds)
- [ ] Add error handling (try-catch with specific error messages)

**Code File:** `src/services/aiService.ts` (NEW)

**Implementation Notes:**

- Use `fetch()` with timeout using `Promise.race()`
- Return typed response matching `TranslationResponse` interface
- Log errors to console for debugging

**Test Case:** Call `translateMessage('Hello', 'es', 'en')` → Should return translation

### Task 1.3: Update Message Type (15 min)

- [ ] Update `src/types/Message.ts`
- [ ] Add `translation` field (optional)
- [ ] Add `translationVisible` field (optional boolean)
- [ ] Keep existing `ai` field for backward compatibility

**Code File:** `src/types/Message.ts`

```typescript
translation?: {
  text: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
  provider: string;
  slangExplanation?: string;
};
translationVisible?: boolean;
```

**Test:** TypeScript compilation should succeed with no errors

### Task 1.4: Add Translate Button to MessageBubble (1 hour)

- [ ] Update `src/components/MessageBubble.tsx`
- [ ] Add translate button below timestamp (only for received messages)
- [ ] Add loading state (spinner when translating)
- [ ] Add logic to determine if button should show:
  ```typescript
  const showTranslateButton =
    !isOwnMessage && senderPreferredLang !== receiverPreferredLang;
  ```
- [ ] Connect button to `handleTranslate()` function (defined in parent)

**UI Elements:**

- Button: Frosted blue background (`rgba(59, 130, 246, 0.1)`)
- Icon: `translate` from MaterialCommunityIcons
- Text: "Translate" or "Hide" (if already translated)

**Props to Add:**

```typescript
interface MessageBubbleProps {
  // ... existing props
  onTranslate?: (messageId: string) => void;
  senderPreferredLang?: string;
  receiverPreferredLang?: string;
  isTranslating?: boolean;
}
```

### Task 1.5: Implement Stacked Translation View (45 min)

- [ ] In MessageBubble, add conditional rendering for translated messages
- [ ] Show translated text on top (normal style)
- [ ] Show divider line
- [ ] Show original text below (faded, italic, 0.5 opacity)
- [ ] Add "Retry" button (small, bottom-right)

**Styles to Add:**

- `translationDivider`: 1px gray line
- `originalTextContainer`: opacity 0.5 wrapper
- `originalText`: fontSize 12, italic
- `retryButton`: Small touchable with refresh icon

**Test:**

- [ ] Translate a message → Should show stacked view
- [ ] Tap again → Should toggle to original only
- [ ] Reopen chat → Translation should still be visible (persistence)

### Task 1.6: Connect Translation to ChatScreen (1 hour)

- [ ] Update `src/screens/ChatsTab/ChatScreen.tsx`
- [ ] Add `handleTranslate()` function
- [ ] Fetch sender's `preferredLanguage` from Firestore
- [ ] Call `aiService.translateMessage()`
- [ ] Update Firestore with cached translation
- [ ] Handle errors (show Alert or Snackbar)

**Implementation:**

```typescript
const handleTranslate = async (messageId: string) => {
  try {
    setTranslatingMessageId(messageId);

    const message = messages.find((m) => m.id === messageId);

    // Check cache
    if (message.translation) {
      // Just toggle visibility
      await updateDoc(doc(db, "messages", messageId), {
        translationVisible: !message.translationVisible,
      });
      return;
    }

    // Get sender's language
    const sender = await getUserById(message.senderId);
    const sourceLang = sender.user?.preferred_language || "en";

    // Call N8N
    const result = await translateMessage(
      message.text,
      user.preferred_language,
      sourceLang
    );

    // Cache in Firestore
    await cacheTranslation(messageId, result);
  } catch (error) {
    Alert.alert(
      "Translation Error",
      "Could not translate message. Please try again."
    );
  } finally {
    setTranslatingMessageId(null);
  }
};
```

**Test Cases:**

- [ ] Translate Spanish → English
- [ ] Translate English → French
- [ ] Toggle translation visibility
- [ ] Retry failed translation

---

## PHASE 3B: SMART REPLIES (2-3 hours)

### Task 2.1: Create N8N Smart Replies Workflow (45 min)

- [ ] Create new workflow: "Unilang - Smart Replies"
- [ ] Add nodes:
  1. **Webhook Trigger** (POST, path: `/smart-replies`)
  2. **Function Node** - Format Context
  3. **OpenAI Node** - Generate Replies
  4. **Function Node** - Parse Replies Array
  5. **Respond to Webhook**

**OpenAI Prompt:** (see PRD Section 4.4)

- Temperature: 0.7 (more creative)
- Max tokens: 100

**Testing:**

- [ ] Send sample conversation with 8 messages
- [ ] Verify returns 3 distinct replies
- [ ] Test with formal vs casual tone
- [ ] Save & activate

### Task 2.2: Add Smart Replies UI to ChatScreen (1.5 hours)

- [ ] Add state: `smartReplies`, `smartRepliesVisible`, `loadingSmartReplies`
- [ ] Add Smart Replies section below TypingIndicator
- [ ] Show button: "💬 Smart Replies"
- [ ] On button tap: Call N8N with last 8 messages
- [ ] Display 3 reply chips horizontally (ScrollView)
- [ ] Add close button (X icon)

**UI Structure:**

```tsx
<View style={styles.smartRepliesContainer}>
  <View style={styles.smartRepliesHeader}>
    <Icon name="robot-outline" />
    <Text>Smart Replies</Text>
    <TouchableOpacity onPress={hideSmartReplies}>
      <Icon name="close" />
    </TouchableOpacity>
  </View>

  <ScrollView horizontal>
    {smartReplies.map((reply) => (
      <TouchableOpacity
        style={styles.smartReplyChip}
        onPress={() => insertReply(reply)}
      >
        <Text>{reply}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
```

**Styles:**

- Frosted blue chips: `backgroundColor: 'rgba(59, 130, 246, 0.1)'`
- Border: 1px primary color at 30% opacity
- Border radius: 20px (pill shape)

### Task 2.3: Implement Smart Reply Logic (45 min)

- [ ] Add `generateSmartReplies()` to aiService.ts
- [ ] Extract last 8 messages from current chat
- [ ] Format as array: `[{ sender, text }, ...]`
- [ ] Infer user tone from their last 3 messages (formal vs casual)
- [ ] Call N8N smart-replies endpoint
- [ ] Handle errors gracefully

**Auto-Hide Logic:**

```typescript
useEffect(() => {
  if (smartRepliesVisible) {
    const timer = setTimeout(() => {
      setSmartRepliesVisible(false);
    }, 10000); // Hide after 10 seconds

    return () => clearTimeout(timer);
  }
}, [smartRepliesVisible]);

// Also hide when user starts typing
useEffect(() => {
  if (messageText.length > 0) {
    setSmartRepliesVisible(false);
  }
}, [messageText]);
```

**Test Cases:**

- [ ] Receive message → Smart replies button appears
- [ ] Tap button → 3 suggestions load in ~5s
- [ ] Tap suggestion → Text inserted into input
- [ ] Start typing → Smart replies disappear
- [ ] Wait 10s → Smart replies auto-hide

---

## PHASE 3C: FORMALITY ADJUSTMENT (1.5-2 hours)

### Task 3.1: Create N8N Tone Adjustment Workflow (30 min)

- [ ] Create workflow: "Unilang - Tone Adjustment"
- [ ] Add nodes:
  1. **Webhook Trigger** (POST, path: `/adjust-tone`)
  2. **Function Node** - Extract text + tone
  3. **OpenAI Node** - Rewrite Message
  4. **Respond to Webhook**

**OpenAI Prompt:** (see PRD Section 4.3)

- Temperature: 0.5
- Max tokens: 200

**Testing:**

- [ ] Test formal: "hey can u send that?" → "Hello, could you please send that to me?"
- [ ] Test casual: "Hello sir, may I request..." → "Hey, can I get...?"
- [ ] Test neutral: Balance between both

### Task 3.2: Add Tone Menu to Input Bar (1 hour)

- [ ] Import `Menu` from react-native-paper
- [ ] Add tone menu button (left of attachment button)
- [ ] Icon: `tune-variant` from MaterialCommunityIcons
- [ ] Menu items:
  - 🎩 Formal
  - 😊 Neutral
  - 😎 Casual
- [ ] Disable menu when input is empty

**UI Layout:**

```tsx
<View style={styles.inputContainer}>
  {/* Tone Menu */}
  <Menu
    visible={toneMenuVisible}
    onDismiss={() => setToneMenuVisible(false)}
    anchor={
      <IconButton
        icon="tune-variant"
        onPress={() => setToneMenuVisible(true)}
        disabled={!messageText.trim()}
      />
    }
  >
    <Menu.Item onPress={() => adjustTone("formal")} title="🎩 Formal" />
    <Menu.Item onPress={() => adjustTone("neutral")} title="😊 Neutral" />
    <Menu.Item onPress={() => adjustTone("casual")} title="😎 Casual" />
  </Menu>

  {/* ... rest of input bar ... */}
</View>
```

### Task 3.3: Implement Tone Adjustment Handler (30 min)

- [ ] Add `adjustTone()` to aiService.ts
- [ ] Add handler in ChatScreen:

  ```typescript
  const handleAdjustTone = async (tone: "formal" | "neutral" | "casual") => {
    setAdjustingTone(true);
    setToneMenuVisible(false);

    try {
      const rewrittenText = await adjustTone(messageText, tone);
      setMessageText(rewrittenText);
    } catch (error) {
      Alert.alert("Error", "Could not adjust tone. Please try again.");
    } finally {
      setAdjustingTone(false);
    }
  };
  ```

- [ ] Show loading state in input placeholder: "Adjusting tone..."
- [ ] Disable input while adjusting

**Test Cases:**

- [ ] Type casual message → Select formal → Input updates
- [ ] Edit rewritten text → Still editable before sending
- [ ] Send adjusted message → Recipient sees formal version

---

## PHASE 3D: CULTURAL CONTEXT (1-1.5 hours)

### Task 4.1: Update Translation Workflow (30 min)

- [ ] Open existing Translation workflow in N8N
- [ ] Update OpenAI prompt to detect slang (already in PRD prompt)
- [ ] Update response parsing to extract `slang` array
- [ ] Test with slang examples:
  - "break a leg"
  - "piece of cake"
  - "hit the hay"
- [ ] Verify slang explanations are returned

**Response Format:**

```json
{
  "translation": "translated text",
  "slang": [{ "term": "break a leg", "meaning": "good luck (theater culture)" }]
}
```

### Task 4.2: Add Slang Tooltip to MessageBubble (30 min)

- [ ] In MessageBubble, add conditional rendering below translation:
  ```tsx
  {
    message.translation?.slangExplanation && (
      <TouchableOpacity style={styles.slangTooltip} onPress={openSlangModal}>
        <Icon name="information-outline" size={12} />
        <Text style={styles.slangText}>Cultural context</Text>
      </TouchableOpacity>
    );
  }
  ```
- [ ] Style tooltip with warning color background (yellow tint)
- [ ] If explanation >2 lines → Open modal instead of inline

**Styles:**

```typescript
slangTooltip: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginTop: 6,
  padding: 6,
  backgroundColor: colorPalette.warning + '20',
  borderRadius: 6,
},
```

### Task 4.3: Create SlangModal Component (30 min)

- [ ] Create `src/components/SlangModal.tsx`
- [ ] Modal with:
  - Title: "Cultural Context"
  - Full slang explanation (scrollable)
  - Close button
- [ ] Use React Native Paper's Modal component
- [ ] Match frosted glass theme

**Component Structure:**

```tsx
export const SlangModal = ({ visible, onClose, explanation }) => (
  <Modal visible={visible} onDismiss={onClose}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Cultural Context</Text>
      <ScrollView>
        <Text style={styles.modalText}>{explanation}</Text>
      </ScrollView>
      <Button onPress={onClose}>Close</Button>
    </View>
  </Modal>
);
```

**Test:**

- [ ] Translate "break a leg" → Tooltip appears
- [ ] Tap tooltip → Modal opens with full explanation
- [ ] Close modal → Returns to chat

---

## PHASE 3E: POLISH & TESTING (2-3 hours)

### Task 5.1: Error Handling & Timeouts (1 hour)

- [ ] Add 10-second timeout to all N8N calls
- [ ] Implement retry logic for failed translations
- [ ] Add offline detection (disable AI features when offline)
- [ ] Show appropriate error messages:
  - "Translation unavailable while offline"
  - "Translation took too long. Please try again."
  - "Smart replies unavailable. Try again later."

**Timeout Implementation:**

```typescript
const callWithTimeout = async (promise: Promise<any>, timeoutMs: number) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
};
```

### Task 5.2: Loading States & Spinners (30 min)

- [ ] Add loading spinners for:
  - Translation (in translate button)
  - Smart replies (in button + chip area)
  - Tone adjustment (in input placeholder)
- [ ] Disable UI elements while loading:
  - Disable translate button while fetching
  - Disable tone menu while adjusting
  - Disable input while adjusting tone
- [ ] Show progress indicators (ActivityIndicator)

### Task 5.3: Translation Persistence Testing (30 min)

- [ ] Test translation toggle state persists:
  1. Translate message → Close app
  2. Reopen app → Translation should still be visible
  3. Toggle off → Close app
  4. Reopen → Translation hidden
- [ ] Verify Firestore `translationVisible` field updates correctly
- [ ] Test with multiple messages (some translated, some not)

### Task 5.4: E2E Testing (2 Devices) (1 hour)

**Setup:**

- Device A: English user
- Device B: Spanish user

**Test Scenarios:**

1. **Translation Flow**

   - [ ] B sends Spanish message
   - [ ] A receives → Translate button appears
   - [ ] A taps → Translation shows in ~3s
   - [ ] A toggles → Translation hides
   - [ ] A closes app → Reopens → Translation still cached

2. **Smart Replies Flow**

   - [ ] B sends question: "¿Cómo estás?"
   - [ ] A translates → Taps smart replies
   - [ ] A sees 3 suggestions in English
   - [ ] A taps one → Sends reply
   - [ ] B receives English message

3. **Tone Adjustment Flow**

   - [ ] A types casual: "hey wassup"
   - [ ] A selects Formal tone
   - [ ] A sends → B receives: "Hello, how are you?"

4. **Error Scenarios**

   - [ ] Turn off WiFi on Device A
   - [ ] Try to translate → Shows offline error
   - [ ] Cached translations still visible
   - [ ] Reconnect → Translation works again

5. **Stress Testing**
   - [ ] Translate 10 messages rapidly
   - [ ] Generate smart replies 5 times in a row
   - [ ] Adjust tone 3 times back-to-back
   - [ ] Verify no crashes, all features work

---

## TESTING CHECKLIST

### Unit Tests (Optional - Time Permitting)

**File:** `src/services/__tests__/aiService.test.ts`

- [ ] Test `translateMessage()` returns correct format
- [ ] Test timeout handling (mock slow response)
- [ ] Test error handling (mock failed API call)
- [ ] Test `generateSmartReplies()` with valid context
- [ ] Test `adjustTone()` with all 3 tones

### Integration Tests

**Manual Testing:**

- [ ] Translation: 10 messages (various languages)

  - English → Spanish ✅
  - Spanish → English ✅
  - French → English ✅
  - English → German ✅

- [ ] Smart Replies: 5 conversations

  - Casual conversation ✅
  - Formal conversation ✅
  - Short messages ✅
  - Long messages ✅

- [ ] Tone Adjustment: 5 messages

  - Casual → Formal ✅
  - Formal → Casual ✅
  - Neutral → Formal ✅
  - Short text ✅
  - Long text ✅

- [ ] Slang Detection: 3 messages
  - "break a leg" ✅
  - "piece of cake" ✅
  - "hit the hay" ✅

### Edge Cases

- [ ] Empty message → Translate button disabled
- [ ] Same language → Translate button hidden
- [ ] Network offline → Features disabled
- [ ] API timeout → Retry button appears
- [ ] Very long message (1000+ chars) → Still translates
- [ ] Emoji-only message → Translates correctly

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] All N8N workflows activated
- [ ] Webhook URLs saved in `constants.ts`
- [ ] OpenAI API key secured (environment variable)
- [ ] Firestore rules allow `translation` field updates
- [ ] Code linted (no TypeScript errors)
- [ ] All 115+ existing tests still passing

### Deployment

- [ ] Build app with new code
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Deploy to TestFlight (iOS) or internal testing (Android)
- [ ] Test with real devices

### Post-Deployment

- [ ] Monitor N8N execution logs (first 24h)
- [ ] Check OpenAI usage dashboard (should be <$1 in first day)
- [ ] Collect user feedback
- [ ] Iterate on prompts if quality issues

---

## COST MONITORING

### Daily Checks (First Week)

- [ ] OpenAI API usage: Should be <$0.10/day
- [ ] N8N executions: Should be <100/day for 10 users
- [ ] No timeout errors in N8N logs

### Weekly Review

- [ ] Calculate cost per user
- [ ] Review translation quality (spot check 10 translations)
- [ ] Review smart reply acceptance rate
- [ ] Adjust prompts if needed

---

## ROLLBACK PLAN

**If major issues occur:**

1. **Disable AI features:**

   - Comment out translate button rendering
   - Comment out smart replies section
   - Comment out tone menu

2. **Deactivate N8N workflows** (stop charging)

3. **Fix issues in isolation** (test locally)

4. **Re-enable gradually:**
   - Start with translation only
   - Add smart replies after 2 days
   - Add tone adjustment last

---

## FILE CHANGES SUMMARY

### New Files (2)

1. ✅ `src/services/aiService.ts` (AI API calls)
2. ✅ `src/components/SlangModal.tsx` (Cultural context modal)

### Updated Files (5)

1. ✅ `src/types/Message.ts` (Add translation fields)
2. ✅ `src/components/MessageBubble.tsx` (Translate button + stacked view + slang tooltip)
3. ✅ `src/screens/ChatsTab/ChatScreen.tsx` (Tone menu + smart replies + translation handler)
4. ✅ `src/utils/constants.ts` (Add N8N webhook URLs)
5. ✅ `firestore.rules` (Allow translation field updates)

### N8N Workflows (3)

1. ✅ Workflow: "Unilang - Translation + Slang Detection"
2. ✅ Workflow: "Unilang - Tone Adjustment"
3. ✅ Workflow: "Unilang - Smart Replies"

---

## NOTES

- **AI agents will accelerate development** – Use Cursor/Copilot for boilerplate
- **Test prompts in N8N first** before integrating with app
- **Start simple** – Get translation working perfectly before adding features
- **Monitor costs closely** – Set OpenAI billing alert at $10
- **Iterate on prompts** – Quality improves with refinement
- **Cache aggressively** – Saves money and improves speed

---

**Status:** ✅ **READY TO START PHASE 3A (Translation Core)**  
**Next Step:** Set up N8N Cloud account + Create first workflow  
**Estimated Completion:** 10-13 hours from start
