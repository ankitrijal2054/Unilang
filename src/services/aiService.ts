import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { N8N_WEBHOOKS, AI_TIMEOUTS } from "../utils/constants";

/**
 * AI Service - Phase 3
 * Handles all AI-powered features: translation, tone adjustment, smart replies
 */

// ================== TYPE DEFINITIONS ==================

export interface TranslationResponse {
  translation: string;
  sourceLang: string;
  targetLang: string;
  slang?: Array<{ term: string; meaning: string }>;
}

export interface SmartReply {
  text: string;
  tone: "formal" | "neutral" | "casual";
}

export interface ToneAdjustmentResponse {
  adjustedText: string;
  tone: "formal" | "neutral" | "casual";
}

// ================== UTILITY FUNCTIONS ==================

/**
 * Call API with timeout protection
 */
const callWithTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  const timeoutPromise = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), timeoutMs)
  );
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Handle API errors with user-friendly messages
 */
const handleApiError = (error: any, context: string): never => {
  console.error(`[aiService] ${context} error:`, error);

  if (error.message === "Request timeout") {
    throw new Error("Request took too long. Please try again.");
  }

  if (error.message === "Network request failed") {
    throw new Error("Network error. Check your connection.");
  }

  throw new Error(`${context} failed. Please try again.`);
};

// ================== TRANSLATION ==================

/**
 * Translate message text to target language
 * @param text Original message text
 * @param targetLang Target language code (e.g., "en", "es")
 * @param sourceLang Source language code (optional, will be detected)
 * @returns Translation result with optional slang explanation
 */
export const translateMessage = async (
  text: string,
  targetLang: string,
  sourceLang: string = "auto"
): Promise<TranslationResponse> => {
  try {
    const response = await callWithTimeout(
      fetch(N8N_WEBHOOKS.TRANSLATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang,
        }),
      }),
      AI_TIMEOUTS.TRANSLATION
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Parse N8N response
    return {
      translation: data.translation || data.text,
      sourceLang: data.sourceLang || sourceLang,
      targetLang: data.targetLang || targetLang,
      slang: data.slang || undefined,
    };
  } catch (error) {
    return handleApiError(error, "Translation");
  }
};

/**
 * Cache translation result in Firestore
 * @param messageId Message document ID
 * @param translationData Translation result from N8N
 */
export const cacheTranslation = async (
  messageId: string,
  translationData: TranslationResponse
): Promise<void> => {
  try {
    const messageRef = doc(db, "messages", messageId);

    // Format slang explanation if present
    let slangExplanation: string | undefined;
    if (translationData.slang && translationData.slang.length > 0) {
      slangExplanation = translationData.slang
        .map((item) => `"${item.term}": ${item.meaning}`)
        .join("\n");
    }

    await updateDoc(messageRef, {
      translation: {
        text: translationData.translation,
        sourceLang: translationData.sourceLang,
        targetLang: translationData.targetLang,
        timestamp: new Date().toISOString(),
        provider: "openai-gpt4o-mini",
        slangExplanation: slangExplanation || null,
      },
      translationVisible: true, // Show translation by default
    });
  } catch (error) {
    console.error("[aiService] Failed to cache translation:", error);
    throw new Error("Failed to save translation");
  }
};

/**
 * Toggle translation visibility
 * @param messageId Message document ID
 * @param visible Whether translation should be visible
 */
export const toggleTranslationVisibility = async (
  messageId: string,
  visible: boolean
): Promise<void> => {
  try {
    const messageRef = doc(db, "messages", messageId);
    await updateDoc(messageRef, {
      translationVisible: visible,
    });
  } catch (error) {
    console.error("[aiService] Failed to toggle translation:", error);
    throw error;
  }
};

// ================== TONE ADJUSTMENT ==================

/**
 * Adjust message tone (formal/neutral/casual)
 * @param text Original message text
 * @param tone Target tone
 * @returns Adjusted message text
 */
export const adjustTone = async (
  text: string,
  tone: "formal" | "neutral" | "casual"
): Promise<string> => {
  try {
    const response = await callWithTimeout(
      fetch(N8N_WEBHOOKS.ADJUST_TONE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          tone,
        }),
      }),
      AI_TIMEOUTS.TONE_ADJUSTMENT
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.adjustedText || data.text || text;
  } catch (error) {
    return handleApiError(error, "Tone adjustment");
  }
};

// ================== SMART REPLIES ==================

/**
 * Generate smart reply suggestions based on conversation context
 * @param conversationHistory Last 8 messages (max)
 * @param userLanguage User's preferred language
 * @returns Array of 3 smart reply suggestions
 */
export const generateSmartReplies = async (
  conversationHistory: Array<{ sender: string; text: string }>,
  userLanguage: string = "en"
): Promise<string[]> => {
  try {
    // Take only last 8 messages
    const recentMessages = conversationHistory.slice(-8);

    const response = await callWithTimeout(
      fetch(N8N_WEBHOOKS.SMART_REPLIES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: recentMessages,
          language: userLanguage,
        }),
      }),
      AI_TIMEOUTS.SMART_REPLIES
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const replies = data.replies || data.suggestions || [];

    // Ensure we return exactly 3 replies
    return replies.slice(0, 3);
  } catch (error) {
    return handleApiError(error, "Smart replies");
  }
};

// ================== LANGUAGE DETECTION ==================

/**
 * Detect language of text (fallback if N8N doesn't provide)
 * For MVP, we assume sender's preferred language
 * Phase 4 can add dedicated language detection API
 */
export const detectLanguage = (text: string): string => {
  // Simple heuristic: check for common patterns
  // This is a placeholder - real detection happens in N8N
  if (/[а-яА-Я]/.test(text)) return "ru";
  if (/[一-龥]/.test(text)) return "zh-CN";
  if (/[ぁ-んァ-ン]/.test(text)) return "ja";
  if (/[가-힣]/.test(text)) return "ko";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";

  // Default to English for Latin scripts
  return "en";
};

// ================== EXPORTS ==================

export default {
  translateMessage,
  cacheTranslation,
  toggleTranslationVisibility,
  adjustTone,
  generateSmartReplies,
  detectLanguage,
};
