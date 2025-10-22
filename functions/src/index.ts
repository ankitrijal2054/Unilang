/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, set the maximum number of containers
setGlobalOptions({ maxInstances: 10 });

/**
 * Cloud Function triggered on new message creation
 * Sends push notification to all recipients (non-senders) in the chat
 */
export const sendNotificationOnNewMessage = onDocumentCreated(
  "messages/{messageId}",
  async (event) => {
    try {
      const messageId = event.params.messageId;
      const messageData = event.data?.data();

      if (!messageData) {
        logger.warn("Message data not found for ID:", messageId);
        return;
      }

      const { chatId, senderId, text, type } = messageData;

      // Don't send notifications for system messages
      if (type === "system") {
        logger.log("Skipping notification for system message:", messageId);
        return;
      }

      logger.log("Processing notification for message:", messageId, {
        chatId,
        senderId,
      });

      // Fetch the chat document to get all participants
      const chatDoc = await db.collection("chats").doc(chatId).get();
      if (!chatDoc.exists) {
        logger.warn("Chat document not found:", chatId);
        return;
      }

      const chatData = chatDoc.data();
      const participants: string[] = chatData?.participants || [];
      const chatName = chatData?.name || "Chat";
      const chatType = chatData?.type || "direct";

      logger.log("Chat participants:", participants, "Sender:", senderId);

      // Get recipient list (exclude sender)
      const recipients = participants.filter((uid) => uid !== senderId);

      if (recipients.length === 0) {
        logger.log("No recipients to notify");
        return;
      }

      // Fetch sender user info
      const senderDoc = await db.collection("users").doc(senderId).get();
      const senderName =
        senderDoc.data()?.name || senderDoc.data()?.email || "User";

      // Fetch recipient user documents with FCM tokens
      const recipientPromises = recipients.map((uid) =>
        db.collection("users").doc(uid).get()
      );
      const recipientDocs = await Promise.all(recipientPromises);

      // Collect valid FCM tokens
      const fcmTokens: string[] = [];
      recipientDocs.forEach((doc) => {
        if (doc.exists && doc.data()?.fcmToken) {
          fcmTokens.push(doc.data()!.fcmToken);
        }
      });

      if (fcmTokens.length === 0) {
        logger.log("No FCM tokens found for recipients");
        return;
      }

      logger.log("Found FCM tokens:", fcmTokens.length);

      // Prepare notification payload
      const notificationTitle =
        chatType === "direct" ? senderName : `${senderName} in ${chatName}`;
      const notificationBody = text.substring(0, 100); // Truncate to 100 chars

      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          chatId: chatId,
          messageId: messageId,
          senderName: senderName,
          senderId: senderId,
          chatType: chatType,
          timestamp: new Date().toISOString(),
        },
      };

      // Send to all recipients
      logger.log("Sending notification to", fcmTokens.length, "devices");
      const response = await messaging.sendMulticast({
        ...message,
        tokens: fcmTokens,
      } as any);

      logger.log("Notification sent successfully", {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      // Log failed tokens for cleanup (optional)
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            logger.warn("Failed to send to token:", fcmTokens[idx], resp.error);
          }
        });
      }
    } catch (error) {
      logger.error("Error sending notification:", error);
      throw error;
    }
  }
);

/**
 * Helper function to calculate badge count for a user
 * (Can be called from client when needed)
 */
export const calculateUnreadCount = async (userId: string): Promise<number> => {
  try {
    // Get all chats for this user
    const chatsSnapshot = await db
      .collection("chats")
      .where("participants", "array-contains", userId)
      .get();

    let totalUnread = 0;

    // For each chat, count unread messages
    for (const chatDoc of chatsSnapshot.docs) {
      const messagesSnapshot = await db
        .collection("messages")
        .where("chatId", "==", chatDoc.id)
        .where("status", "!=", "read")
        .where("senderId", "!=", userId)
        .get();

      totalUnread += messagesSnapshot.size;
    }

    return totalUnread;
  } catch (error) {
    logger.error("Error calculating unread count:", error);
    return 0;
  }
};
