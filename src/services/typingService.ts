import { db, auth } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
  deleteDoc,
  getDoc,
  CollectionReference,
  QueryConstraint,
} from "firebase/firestore";
import { COLLECTIONS } from "../utils/constants";

interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
  expiresAt: number;
  lastUpdated: string;
}

// Debounce timer for typing events
const debounceTimers: { [chatId: string]: ReturnType<typeof setTimeout> } = {};
const typingStateRef: { [key: string]: boolean } = {};

/**
 * Set typing status for current user in a chat
 * Includes debounce to avoid excessive Firestore writes
 */
export const setTyping = async (
  chatId: string,
  isTyping: boolean
): Promise<void> => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    console.warn("⚠️ Cannot set typing status: user not authenticated");
    return;
  }

  const typingStateKey = `${chatId}_${userId}`;

  // Skip if state hasn't changed
  if (typingStateRef[typingStateKey] === isTyping) {
    return;
  }

  // Clear existing debounce timer
  if (debounceTimers[typingStateKey]) {
    clearTimeout(debounceTimers[typingStateKey]);
  }

  // Debounce the actual Firestore write
  debounceTimers[typingStateKey] = setTimeout(
    async () => {
      try {
        // Fetch user name from Firestore (not from auth.displayName)
        const userDocRef = doc(db, COLLECTIONS.USERS, userId);
        const userDocSnap = await getDoc(userDocRef);
        const userName = userDocSnap.data()?.name || "Unknown";

        const typingStatusRef = doc(
          db,
          COLLECTIONS.TYPING_STATUS,
          chatId,
          "users",
          userId
        );

        if (isTyping) {
          // Set typing status with TTL expiry (5 seconds)
          const expiresAt = Date.now() + 5000;
          await setDoc(
            typingStatusRef,
            {
              userId,
              userName,
              isTyping: true,
              expiresAt,
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );
          console.log(`✅ User typing started in chat ${chatId}`);
        } else {
          // Delete typing status when user stops typing
          await deleteDoc(typingStatusRef);
          console.log(`✅ User typing stopped in chat ${chatId}`);
        }

        typingStateRef[typingStateKey] = isTyping;
      } catch (error) {
        console.error("❌ Error setting typing status:", error);
      }
    },
    isTyping ? 500 : 100
  ); // Shorter delay for stop typing
};

/**
 * Subscribe to typing status for a chat (real-time)
 * Returns only active typings (excludes self, filters expired)
 */
export const subscribeToTypingStatus = (
  chatId: string,
  callback: (typingUsers: TypingStatus[]) => void
): Unsubscribe => {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    console.warn("⚠️ Cannot subscribe to typing: user not authenticated");
    return () => {};
  }

  try {
    const typingStatusRef = collection(
      db,
      COLLECTIONS.TYPING_STATUS,
      chatId,
      "users"
    );

    const unsubscribe = onSnapshot(typingStatusRef, (snapshot) => {
      const typingUsers: TypingStatus[] = [];
      const now = Date.now();

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Filter: Only include active typings from other users
        if (
          data.userId !== userId && // Exclude self
          data.isTyping === true && // Only active typings
          data.expiresAt > now // Not expired
        ) {
          typingUsers.push({
            userId: data.userId,
            userName: data.userName || "Unknown",
            isTyping: data.isTyping,
            expiresAt: data.expiresAt,
            lastUpdated:
              data.lastUpdated?.toDate?.().toISOString() ||
              new Date().toISOString(),
          });
        }
      });

      // Sort by timestamp (most recent first)
      typingUsers.sort((a, b) => b.expiresAt - a.expiresAt);

      callback(typingUsers);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error subscribing to typing status:", error);
    return () => {};
  }
};

/**
 * Clear typing status for current user in a chat
 * Used on component unmount
 */
export const clearTyping = async (chatId: string): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const typingStatusRef = doc(
      db,
      COLLECTIONS.TYPING_STATUS,
      chatId,
      "users",
      userId
    );
    await deleteDoc(typingStatusRef);
    console.log(`✅ Typing status cleared for chat ${chatId}`);
  } catch (error) {
    console.error("❌ Error clearing typing status:", error);
  }
};
