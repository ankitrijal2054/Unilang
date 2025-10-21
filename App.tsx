import { PaperProvider } from "react-native-paper";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "./src/store/authStore";
import { useNavigation } from "@react-navigation/native";
import {
  setupNotificationHandler,
  requestNotificationPermissions,
  registerForPushNotifications,
  setupNotificationListeners,
} from "./src/services/notificationService";

// Configure how notifications are handled when app is in foreground
setupNotificationHandler();

export default function App() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const unsubscribersRef = useRef<{
    unsubscribeNotification?: () => void;
    unsubscribeResponse?: () => void;
  }>({});

  useEffect(() => {
    // Request notification permissions on app launch
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    // When user logs in, get and store their FCM token
    if (user?.uid) {
      registerForPushNotifications(user.uid);
    }

    // Setup listeners for notification events
    setupNotificationEventListeners();

    // Cleanup
    return () => {
      unsubscribersRef.current.unsubscribeNotification?.();
      unsubscribersRef.current.unsubscribeResponse?.();
    };
  }, [user?.uid]);

  const setupNotificationEventListeners = () => {
    const { unsubscribeNotification, unsubscribeResponse } =
      setupNotificationListeners(
        // Handle notification received while app is in foreground
        (notification) => {
          console.log("📬 Foreground notification:", notification);
        },
        // Handle user tapping on notification
        (response) => {
          const { notification } = response;
          const chatId = notification.request.content.data?.chatId;

          if (chatId) {
            console.log(
              "📲 User tapped notification, navigating to chat:",
              chatId
            );
            // Navigate to the chat when notification is tapped
            setTimeout(() => {
              navigation.navigate("AppStack", {
                screen: "ChatsTab",
                params: {
                  screen: "Chat",
                  params: { chatId },
                },
              });
            }, 500);
          }
        }
      );

    unsubscribersRef.current = {
      unsubscribeNotification,
      unsubscribeResponse,
    };
  };

  return (
    <PaperProvider>
      <RootNavigator />
    </PaperProvider>
  );
}
