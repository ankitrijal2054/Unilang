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
  ai: {
    translated_text: string;
    detected_language: string;
    summary: string;
  };
}
