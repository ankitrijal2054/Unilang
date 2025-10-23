export interface Chat {
  id: string;
  type: "direct" | "group";
  name?: string;
  participants: string[];
  adminId?: string;
  isDeleted: boolean; // Legacy field (deprecated)
  deletedBy?: string[]; // Array of user IDs who deleted this chat
  deletionTimestamps?: { [userId: string]: string }; // Timestamp when each user deleted
  lastMessage: string;
  lastMessageTime: string;
  updatedAt: string;
  createdBy: string;
  createdAt: string;
}
