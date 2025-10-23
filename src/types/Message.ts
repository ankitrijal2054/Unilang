export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
  type?: "user" | "system"; // "system" for admin/group notifications
  messageType?: "text" | "image"; // Content type: text or image message
  localStatus?: "pending" | "sent"; // Client-only: pending if offline, sent if online
  readBy?: string[]; // Array of user IDs who have read this message
  // Image-specific fields (only present when messageType === "image")
  imageUrl?: string; // Firebase Storage download URL
  imageWidth?: number; // Original width in pixels
  imageHeight?: number; // Original height in pixels
  // AI Translation fields (Phase 3)
  translation?: {
    text: string; // Translated message text
    sourceLang: string; // Original language code (e.g., "es")
    targetLang: string; // Target language code (e.g., "en")
    timestamp: string; // When translation was generated
    provider: string; // "openai-gpt4o-mini" or similar
    slangExplanation?: string; // Cultural context explanation for slang/idioms
  };
  translationVisible?: boolean; // Whether translation is currently shown (toggle state)
  // Legacy AI field (kept for backward compatibility)
  ai?: {
    translated_text: string;
    detected_language: string;
    summary: string;
  };
}
