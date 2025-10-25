import { PaperProvider } from "react-native-paper";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  setupNotificationHandler,
  requestNotificationPermissions,
} from "./src/services/notificationService";
import { lightTheme } from "./src/utils/theme";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";

// Configure how notifications are handled when app is in foreground
setupNotificationHandler();

// Request permissions on app startup
requestNotificationPermissions();

// Initialize Google Sign-In with environment variables
const googleWebClientId =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

if (googleWebClientId) {
  const config: any = {
    webClientId: googleWebClientId,
  };

  // iOS-specific configuration
  if (googleIosClientId) {
    config.iosClientId = googleIosClientId;
  }

  GoogleSignin.configure(config);
} else {
  console.warn(
    "⚠️ Google Sign-In credentials not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file."
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lightTheme}>
        <RootNavigator />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
