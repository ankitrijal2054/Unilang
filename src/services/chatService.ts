import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Chat } from "../types";
import { COLLECTIONS } from "../utils/constants";

/**
 * Create a direct chat between two users
 */
export const createDirectChat = async (
  userId1: string,
  userId2: string
): Promise<{ success: boolean; chatId?: string; error?: any }> => {
  try {
    // Check if chat already exists
    const existingChatsQuery = query(
      collection(db, COLLECTIONS.CHATS),
      where("type", "==", "direct"),
      where("participants", "array-contains", userId1)
    );

    const snapshot = await getDocs(existingChatsQuery);

    for (const docSnap of snapshot.docs) {
      const chat = docSnap.data();
      if (
        chat.participants.length === 2 &&
        chat.participants.includes(userId2)
      ) {
        // Chat already exists
        console.log("✅ Direct chat already exists:", docSnap.id);
        return { success: true, chatId: docSnap.id };
      }
    }

    // Create new direct chat
    const newChatData = {
      type: "direct" as const,
      name: null,
      participants: [userId1, userId2],
      adminId: null,
      isDeleted: false,
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId1,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.CHATS), newChatData);

    console.log("✅ Direct chat created:", docRef.id);
    return { success: true, chatId: docRef.id };
  } catch (error) {
    console.error("❌ Error creating direct chat:", error);
    return { success: false, error };
  }
};

/**
 * Create a group chat
 */
export const createGroupChat = async (
  name: string,
  participants: string[],
  adminId: string
): Promise<{ success: boolean; chatId?: string; error?: any }> => {
  try {
    const newChatData = {
      type: "group" as const,
      name,
      participants: [...participants, adminId],
      adminId,
      isDeleted: false,
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.CHATS), newChatData);

    console.log("✅ Group chat created:", docRef.id);
    return { success: true, chatId: docRef.id };
  } catch (error) {
    console.error("❌ Error creating group chat:", error);
    return { success: false, error };
  }
};

/**
 * Subscribe to user's chats in real-time
 */
export const subscribeToUserChats = (
  userId: string,
  callback: (chats: Chat[]) => void
): Unsubscribe => {
  const chatsQuery = query(
    collection(db, COLLECTIONS.CHATS),
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  const unsubscribe = onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();

        // Filter out chats deleted by this user
        const deletedBy = data.deletedBy || [];
        if (deletedBy.includes(userId)) {
          return; // Skip this chat
        }

        chats.push({
          id: doc.id,
          type: data.type,
          name: data.name,
          participants: data.participants,
          adminId: data.adminId,
          isDeleted: data.isDeleted || false,
          deletedBy: data.deletedBy,
          deletionTimestamps: data.deletionTimestamps,
          lastMessage: data.lastMessage || "",
          lastMessageTime: data.lastMessageTime || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          createdBy: data.createdBy,
          createdAt: data.createdAt,
        });
      });
      callback(chats);
    },
    (error) => {
      console.error("❌ Error subscribing to user chats:", error);
    }
  );

  return unsubscribe;
};

/**
 * Update chat information
 */
export const updateChat = async (
  chatId: string,
  updates: Partial<Chat>
): Promise<{ success: boolean; error?: any }> => {
  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), updateData);

    console.log("✅ Chat updated:", chatId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating chat:", error);
    return { success: false, error };
  }
};

/**
 * Update chat's last message info
 */
export const updateChatLastMessage = async (
  chatId: string,
  lastMessage: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
      lastMessage,
      lastMessageTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log("✅ Chat last message updated:", chatId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating chat last message:", error);
    return { success: false, error };
  }
};

/**
 * Delete chat for a specific user (soft delete)
 * Adds user to deletedBy array and stores deletion timestamp
 */
export const deleteChat = async (
  chatId: string,
  userId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
      deletedBy: arrayUnion(userId),
      [`deletionTimestamps.${userId}`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Chat deleted for user ${userId}:`, chatId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting chat:", error);
    return { success: false, error };
  }
};

/**
 * Remove user from deletedBy array (restores chat for user)
 * Called when a new message is sent to a previously deleted chat
 */
export const restoreChatForUser = async (
  chatId: string,
  userId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.CHATS, chatId), {
      deletedBy: arrayRemove(userId),
      // Note: We keep deletionTimestamps to filter old messages
      updatedAt: serverTimestamp(),
    });

    console.log(`✅ Chat restored for user ${userId}:`, chatId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error restoring chat:", error);
    return { success: false, error };
  }
};
