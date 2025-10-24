// Supported languages for MVP
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español (Spanish)" },
  { code: "fr", name: "Français (French)" },
  { code: "de", name: "Deutsch (German)" },
  { code: "zh-CN", name: "中文 (Simplified Chinese)" },
  { code: "pt", name: "Português (Portuguese)" },
  { code: "ru", name: "Русский (Russian)" },
  { code: "ja", name: "日本語 (Japanese)" },
  { code: "ko", name: "한국어 (Korean)" },
  { code: "ar", name: "العربية (Arabic)" },
] as const;

// Message status display constants
export const MESSAGE_STATUS = {
  SENDING: "sending",
  SENT: "sent",
  DELIVERED: "delivered",
  READ: "read",
} as const;

// Chat type constants
export const CHAT_TYPE = {
  DIRECT: "direct",
  GROUP: "group",
} as const;

// User status constants
export const USER_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
} as const;

// Default language
export const DEFAULT_LANGUAGE = "en";

// Firestore collections
export const COLLECTIONS = {
  USERS: "users",
  CHATS: "chats",
  MESSAGES: "messages",
  TYPING_STATUS: "typingStatus",
} as const;

// N8N Webhook URLs for AI features (Phase 3)
// TODO: Replace with your actual N8N instance URLs after setup
export const N8N_WEBHOOKS = {
  TRANSLATE: "https://ankit2054.app.n8n.cloud/webhook/translate",
  ADJUST_TONE: "https://your-instance.app.n8n.cloud/webhook/adjust-tone",
  SMART_REPLIES: "https://ankit2054.app.n8n.cloud/webhook/smart-replies",
} as const;

// AI feature timeouts (milliseconds)
export const AI_TIMEOUTS = {
  TRANSLATION: 10000, // 10 seconds
  TONE_ADJUSTMENT: 10000,
  SMART_REPLIES: 10000,
} as const;
