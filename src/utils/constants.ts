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
} as const;
