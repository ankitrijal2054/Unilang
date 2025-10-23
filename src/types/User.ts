export interface User {
  uid: string;
  name: string;
  email: string;
  preferred_language: string;
  status: "online" | "offline";
  lastSeen: string;
  fcmToken?: string;
  avatarUrl?: string; // Firebase Storage URL for profile picture
  createdAt: string;
}
