export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sending" | "sent" | "delivered" | "read";
  type?: "user" | "system"; // "system" for admin/group notifications
  ai: {
    translated_text: string;
    detected_language: string;
    summary: string;
  };
}
