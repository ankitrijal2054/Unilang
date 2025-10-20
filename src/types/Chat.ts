export interface Chat {
  id: string;
  type: "direct" | "group";
  name?: string;
  participants: string[];
  adminId?: string;
  isDeleted: boolean;
  lastMessage: string;
  lastMessageTime: string;
  updatedAt: string;
  createdBy: string;
  createdAt: string;
}
