import * as Notifications from "expo-notifications";
import { updateUserFCMToken } from "./userService";
import { Platform } from "react-native";

// Import React Native Firebase for messaging
let messaging: any = null;
if (Platform.OS !== 'web') {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (e) {
    console.warn('React Native Firebase Messaging not available');
  }
}

/**
 * Request notification permissions from the user
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      console.log("✅ Notification permissions granted");
      
      // Also request FCM authorization for iOS
      if (Platform.OS === 'ios' && messaging) {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        console.log(`iOS FCM Authorization status: ${enabled ? 'enabled' : 'disabled'}`);
      }
      
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
    // Request permissions first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn("⚠️ Notification permission not granted");
      return null;
    }

    // Get FCM token for Android/iOS using React Native Firebase
    let fcmToken: string | null = null;
    
    if (Platform.OS === 'web') {
      console.error("Web FCM not yet implemented");
      return null;
    } else {
      // For native (iOS/Android), use React Native Firebase
      if (messaging) {
        try {
          // Check if already authorized (iOS)
          if (Platform.OS === 'ios') {
            const authStatus = await messaging().requestPermission();
            if (authStatus !== messaging.AuthorizationStatus.AUTHORIZED && 
                authStatus !== messaging.AuthorizationStatus.PROVISIONAL) {
              console.warn("⚠️ FCM authorization not granted on iOS");
              return null;
            }
          }
          
          // Get FCM token
          fcmToken = await messaging().getToken();
          console.log("✅ FCM token obtained:", fcmToken);
          
          // Listen for token refresh
          messaging().onTokenRefresh((newToken: string) => {
            console.log("🔄 FCM token refreshed:", newToken);
            updateUserFCMToken(userId, newToken);
          });
          
        } catch (error) {
          console.error("❌ Error getting FCM token:", error);
          // Fallback to Expo push token if FCM fails
          const expoPushToken = await Notifications.getExpoPushTokenAsync();
          fcmToken = expoPushToken.data;
          console.log("⚠️ Using Expo push token as fallback:", fcmToken);
        }
      } else {
        console.warn("⚠️ React Native Firebase messaging not available, using Expo push token");
        const expoPushToken = await Notifications.getExpoPushTokenAsync();
        fcmToken = expoPushToken.data;
      }
    }

    if (!fcmToken) {
      console.error("❌ Failed to get notification token");
      return null;
    }

    // Store token in Firestore
    const result = await updateUserFCMToken(userId, fcmToken);
    if (result.success) {
      console.log("✅ FCM token stored in Firestore");
      return fcmToken;
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
  // Setup Expo notification handler for foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Setup Firebase onMessage listener for foreground notifications (Android)
  if (messaging && Platform.OS !== 'web') {
    messaging().onMessage(async (remoteMessage: any) => {
      console.log('📬 FCM message received in foreground:', remoteMessage);
      
      // Show Expo notification for foreground messages
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || remoteMessage.data?.title || 'New Message',
          body: remoteMessage.notification?.body || remoteMessage.data?.body || '',
          data: remoteMessage.data,
        },
        trigger: null, // Show immediately
      });
    });
  }
  
  // Setup background message handler (Android)
  if (messaging && Platform.OS === 'android') {
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('📬 FCM message handled in background:', remoteMessage);
    });
  }
  
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
