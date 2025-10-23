import { db } from "./firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  getDocs,
  writeBatch,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { Message } from "../types";
import { COLLECTIONS } from "../utils/constants";
import { isOnline } from "../utils/networkUtils";
import { uploadMessageImage } from "./storageService";
import { restoreChatForUser } from "./chatService";

/**
 * Send a message to a chat
 */
export const sendMessage = async (
  chatId: string,
  text: string,
  senderId: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: any;
  isOnline?: boolean;
}> => {
  try {
    // Check if device is online
    const online = await isOnline();

    const messageData = {
      chatId,
      senderId,
      text,
      timestamp: serverTimestamp(),
      status: "sent" as const,
      messageType: "text" as const,
      ai: {
        translated_text: "",
        detected_language: "",
        summary: "",
      },
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.MESSAGES),
      messageData
    );

    // Restore chat for any participants who deleted it
    try {
      const chatDoc = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
      const chatData = chatDoc.data();
      if (chatData?.deletedBy && chatData.deletedBy.length > 0) {
        // Restore for all users who deleted it
        for (const userId of chatData.deletedBy) {
          await restoreChatForUser(chatId, userId);
        }
        console.log(
          `✅ Chat restored for ${chatData.deletedBy.length} user(s)`
        );
      }
    } catch (restoreError) {
      console.error("⚠️ Error restoring chat:", restoreError);
      // Don't fail the message send if restore fails
    }

    console.log(`✅ Message sent:`, docRef.id, `[Online: ${online}]`);
    return { success: true, messageId: docRef.id, isOnline: online };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return { success: false, error };
  }
};

/**
 * Send an image message to a chat
 */
export const sendImageMessage = async (
  chatId: string,
  imageUri: string,
  senderId: string,
  caption?: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: any;
  isOnline?: boolean;
}> => {
  try {
    // Check if device is online
    const online = await isOnline();

    // Create a temporary message document to get the messageId
    const tempMessageData = {
      chatId,
      senderId,
      text: caption || "📷 Image",
      timestamp: serverTimestamp(),
      status: "sending" as const,
      messageType: "image" as const,
      ai: {
        translated_text: "",
        detected_language: "",
        summary: "",
      },
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.MESSAGES),
      tempMessageData
    );

    console.log(`⏳ Uploading image for message:`, docRef.id);

    // Upload image to Storage
    const { url, width, height } = await uploadMessageImage(
      imageUri,
      chatId,
      docRef.id
    );

    // Update message with image URL and dimensions
    await updateDoc(doc(db, COLLECTIONS.MESSAGES, docRef.id), {
      imageUrl: url,
      imageWidth: width,
      imageHeight: height,
      status: "sent",
    });

    // Restore chat for any participants who deleted it
    try {
      const chatDoc = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
      const chatData = chatDoc.data();
      if (chatData?.deletedBy && chatData.deletedBy.length > 0) {
        // Restore for all users who deleted it
        for (const userId of chatData.deletedBy) {
          await restoreChatForUser(chatId, userId);
        }
        console.log(
          `✅ Chat restored for ${chatData.deletedBy.length} user(s)`
        );
      }
    } catch (restoreError) {
      console.error("⚠️ Error restoring chat:", restoreError);
      // Don't fail the message send if restore fails
    }

    console.log(
      `✅ Image message sent:`,
      docRef.id,
      `[Online: ${online}]`,
      `[${width}x${height}]`
    );
    return { success: true, messageId: docRef.id, isOnline: online };
  } catch (error) {
    console.error("❌ Error sending image message:", error);
    return { success: false, error };
  }
};

/**
 * Subscribe to real-time messages for a chat
 * @param deletionTimestamp - If provided, only messages after this timestamp are returned
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
  deletionTimestamp?: string
): Unsubscribe => {
  const messagesQuery = query(
    collection(db, COLLECTIONS.MESSAGES),
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  );

  const unsubscribe = onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const messageTimestamp =
          data.timestamp?.toDate?.().toISOString() || new Date().toISOString();

        // Filter out messages before deletion timestamp
        if (deletionTimestamp && messageTimestamp <= deletionTimestamp) {
          return; // Skip this message
        }

        messages.push({
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          text: data.text,
          timestamp: messageTimestamp,
          status: data.status,
          type: data.type || "user", // Map type field (default to "user")
          messageType: data.messageType || "text", // Content type (text or image)
          readBy: data.readBy || [], // Include readBy array for read receipts
          // Image-specific fields
          imageUrl: data.imageUrl,
          imageWidth: data.imageWidth,
          imageHeight: data.imageHeight,
          ai: data.ai || {
            translated_text: "",
            detected_language: "",
            summary: "",
          },
        });
      });
      callback(messages);
    },
    (error) => {
      console.error("❌ Error subscribing to messages:", error);
    }
  );

  return unsubscribe;
};

/**
 * Update message status (sent/delivered/read)
 */
export const updateMessageStatus = async (
  messageId: string,
  status: "sending" | "sent" | "delivered" | "read"
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.MESSAGES, messageId), {
      status,
    });

    console.log(`✅ Message status updated to ${status}:`, messageId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating message status:", error);
    return { success: false, error };
  }
};

/**
 * Mark all unread messages in a chat as read
 */
export const markMessagesAsRead = async (
  chatId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    // Get all messages for this chat
    const messagesQuery = query(
      collection(db, COLLECTIONS.MESSAGES),
      where("chatId", "==", chatId)
    );

    const snapshot = await getDocs(messagesQuery);

    if (snapshot.empty) {
      return { success: true };
    }

    // Batch update messages to add currentUserId to readBy array
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Don't add sender to their own readBy, and skip if already in readBy
      if (data.senderId !== currentUserId) {
        const readBy = data.readBy || [];
        if (!readBy.includes(currentUserId)) {
          batch.update(doc.ref, {
            status: "read",
            readBy: arrayUnion(currentUserId),
          });
          updateCount++;
        }
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(
        `✅ ${updateCount} messages marked as read by ${currentUserId}`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return { success: false, error };
  }
};

/**
 * Create a system message for group chat activities
 * Used for admin actions like adding/removing members or user leaving
 */
export const createSystemMessage = async (
  chatId: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    const messageData = {
      chatId,
      senderId: "system",
      text,
      timestamp: serverTimestamp(),
      status: "read" as const,
      type: "system" as const,
      ai: {
        translated_text: "",
        detected_language: "",
        summary: "",
      },
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.MESSAGES),
      messageData
    );

    console.log("✅ System message created:", docRef.id);
    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error("❌ Error creating system message:", error);
    return { success: false, error };
  }
};

/**
 * Calculate total unread message count across all user's chats
 */
export const calculateUnreadCount = async (
  userId: string
): Promise<{ success: boolean; count?: number; error?: any }> => {
  try {
    // Get all chats for this user
    const chatsQuery = query(
      collection(db, COLLECTIONS.CHATS),
      where("participants", "array-contains", userId)
    );
    const chatsSnapshot = await getDocs(chatsQuery);

    let totalUnread = 0;

    // For each chat, count unread messages
    for (const chatDoc of chatsSnapshot.docs) {
      // Query messages for this chat (avoid composite index requirement)
      // Filter status client-side instead
      const messagesQuery = query(
        collection(db, COLLECTIONS.MESSAGES),
        where("chatId", "==", chatDoc.id)
      );

      const messagesSnapshot = await getDocs(messagesQuery);

      // Filter for unread messages from other users (client-side)
      const unreadFromOthers = messagesSnapshot.docs.filter((doc) => {
        const data = doc.data();
        return data.status !== "read" && data.senderId !== userId;
      });

      totalUnread += unreadFromOthers.length;
    }

    console.log("✅ Unread count calculated:", totalUnread);
    return { success: true, count: totalUnread };
  } catch (error) {
    console.error("❌ Error calculating unread count:", error);
    return { success: false, error };
  }
};

/**
 * Subscribe to unread message count changes for a user
 */
export const subscribeToUnreadCount = (
  userId: string,
  callback: (count: number) => void
): Unsubscribe => {
  try {
    // Get all chats for this user
    const chatsQuery = query(
      collection(db, COLLECTIONS.CHATS),
      where("participants", "array-contains", userId)
    );

    // Subscribe to messages collection and update count when messages change
    const unsubscribe = onSnapshot(
      query(
        collection(db, COLLECTIONS.MESSAGES),
        where("status", "!=", "read")
      ),
      async (snapshot) => {
        try {
          // Recalculate unread count
          const result = await calculateUnreadCount(userId);
          if (result.success && result.count !== undefined) {
            callback(result.count);
          }
        } catch (error) {
          console.error("❌ Error in unread count subscription:", error);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error subscribing to unread count:", error);
    return () => {};
  }
};
