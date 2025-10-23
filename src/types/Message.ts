export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
  type?: "user" | "system"; // "system" for admin/group notifications
  localStatus?: "pending" | "sent"; // Client-only: pending if offline, sent if online
  readBy?: string[]; // Array of user IDs who have read this message
  ai: {
    translated_text: string;
    detected_language: string;
    summary: string;
  };
}
