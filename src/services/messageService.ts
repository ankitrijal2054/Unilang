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
} from "firebase/firestore";
import { Message } from "../types";
import { COLLECTIONS } from "../utils/constants";

/**
 * Send a message to a chat
 */
export const sendMessage = async (
  chatId: string,
  text: string,
  senderId: string
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    const messageData = {
      chatId,
      senderId,
      text,
      timestamp: serverTimestamp(),
      status: "sent" as const,
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

    console.log("✅ Message sent:", docRef.id);
    return { success: true, messageId: docRef.id };
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return { success: false, error };
  }
};

/**
 * Subscribe to real-time messages for a chat
 */
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void
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
        messages.push({
          id: doc.id,
          chatId: data.chatId,
          senderId: data.senderId,
          text: data.text,
          timestamp:
            data.timestamp?.toDate?.().toISOString() ||
            new Date().toISOString(),
          status: data.status,
          type: data.type || "user", // Map type field (default to "user")
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
    // For MVP: Just update status to "read" for all messages in chat
    // Simple query without composite index requirement
    const messagesQuery = query(
      collection(db, COLLECTIONS.MESSAGES),
      where("chatId", "==", chatId)
    );

    // Get all messages for this chat
    const snapshot = await getDocs(messagesQuery);

    if (snapshot.empty) {
      return { success: true };
    }

    // Batch update only messages that aren't already read
    const batch = writeBatch(db);
    let updateCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      // Only update if not already read
      if (data.status !== "read") {
        batch.update(doc.ref, { status: "read" });
        updateCount++;
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ ${updateCount} messages marked as read`);
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
