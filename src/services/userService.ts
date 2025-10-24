import { db } from "./firebase";
import {
  collection,
  doc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { User } from "../types";
import { COLLECTIONS } from "../utils/constants";

/**
 * Update user status (online/offline)
 */
export const updateUserStatus = async (
  userId: string,
  status: "online" | "offline"
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      status,
      lastSeen: new Date().toISOString(),
    });

    console.log(`✅ User status updated to ${status}:`, userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    return { success: false, error };
  }
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), updates);

    console.log("✅ User profile updated:", userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating user profile:", error);
    return { success: false, error };
  }
};

/**
 * Subscribe to user presence changes in real-time
 */
export const subscribeToUserPresence = (
  userId: string,
  callback: (user: User | null) => void
): Unsubscribe => {
  const unsubscribe = onSnapshot(
    doc(db, COLLECTIONS.USERS, userId),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const user: User = {
          uid: docSnap.id,
          name: data.name || "User",
          email: data.email || "",
          preferred_language: data.preferred_language || "en",
          status: data.status || "offline",
          lastSeen: data.lastSeen,
          fcmToken: data.fcmToken,
          avatarUrl: data.avatarUrl,
          createdAt: data.createdAt,
        };
        callback(user);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error("❌ Error subscribing to user presence:", error);
    }
  );

  return unsubscribe;
};

/**
 * Get all users for user discovery/search
 */
export const getAllUsers = async (): Promise<{
  success: boolean;
  users?: User[];
  error?: any;
}> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));

    const users: User[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        uid: doc.id,
        name: data.name || "User",
        email: data.email || "",
        preferred_language: data.preferred_language || "en",
        status: data.status || "offline",
        lastSeen: data.lastSeen,
        fcmToken: data.fcmToken,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt,
      });
    });

    console.log("✅ All users fetched:", users.length);
    return { success: true, users };
  } catch (error) {
    console.error("❌ Error fetching all users:", error);
    return { success: false, error };
  }
};

/**
 * Update user's FCM token for push notifications
 */
export const updateUserFCMToken = async (
  userId: string,
  fcmToken: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      fcmToken,
    });

    console.log("✅ FCM token updated:", userId);
    return { success: true };
  } catch (error) {
    console.error("❌ Error updating FCM token:", error);
    return { success: false, error };
  }
};

/**
 * Get a single user by ID
 */
export const getUserById = async (
  userId: string
): Promise<{
  success: boolean;
  user?: User;
  error?: any;
}> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

    if (userDoc.exists()) {
      const data = userDoc.data();
      const user: User = {
        uid: userDoc.id,
        name: data.name || "User",
        email: data.email || "",
        preferred_language: data.preferred_language || "en",
        status: data.status || "offline",
        lastSeen: data.lastSeen,
        fcmToken: data.fcmToken,
        avatarUrl: data.avatarUrl,
        createdAt: data.createdAt,
      };
      return { success: true, user };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return { success: false, error };
  }
};
