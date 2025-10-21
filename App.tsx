import { PaperProvider } from "react-native-paper";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import {
  setupNotificationHandler,
  requestNotificationPermissions,
} from "./src/services/notificationService";

// Configure how notifications are handled when app is in foreground
setupNotificationHandler();

// Request permissions on app startup
requestNotificationPermissions();

export default function App() {
  return (
    <PaperProvider>
      <RootNavigator />
    </PaperProvider>
  );
}
