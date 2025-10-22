import * as Notifications from "expo-notifications";
import { updateUserFCMToken } from "./userService";

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      console.log("✅ Notification permissions granted");
      return true;
    } else {
      console.warn("⚠️ Notification permissions not granted");
      return false;
    }
  } catch (error) {
    console.error("❌ Error requesting notification permissions:", error);
    return false;
  }
};

/**
 * Get device FCM token and store it in Firestore
 */
export const registerForPushNotifications = async (
  userId: string
): Promise<string | null> => {
  try {
    // Get Expo push token
    const expoPushToken = await Notifications.getExpoPushTokenAsync();
    console.log("✅ Expo push token obtained:", expoPushToken.data);

    // Store token in Firestore
    const result = await updateUserFCMToken(userId, expoPushToken.data);
    if (result.success) {
      console.log("✅ FCM token stored in Firestore");
      return expoPushToken.data;
    } else {
      console.error("❌ Failed to store FCM token:", result.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error registering for push notifications:", error);
    return null;
  }
};

/**
 * Configure foreground notification behavior
 */
export const setupNotificationHandler = (): void => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  console.log("✅ Notification handler configured");
};

/**
 * Setup listeners for notification events
 * Returns object with unsubscribe functions
 */
export const setupNotificationListeners = (
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
): {
  unsubscribeNotification: () => void;
  unsubscribeResponse: () => void;
} => {
  // Handle notification received while app is in foreground
  const unsubscribeNotification = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("📬 Notification received (foreground):", notification);
      onNotificationReceived(notification);
    }
  );

  // Handle user tapping on notification or notification action
  const unsubscribeResponse =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("📲 Notification response received:", response);
      onNotificationResponse(response);
    });

  return {
    unsubscribeNotification: () => unsubscribeNotification.remove(),
    unsubscribeResponse: () => unsubscribeResponse.remove(),
  };
};

/**
 * Update app badge count for unread messages
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
    console.log("✅ Badge count updated:", count);
  } catch (error) {
    console.error("❌ Error updating badge count:", error);
  }
};
