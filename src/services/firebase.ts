import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { Platform } from "react-native";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Conditional import based on platform
let messaging: any = null;
if (Platform.OS !== 'web') {
  // For native platforms, we'll use @react-native-firebase/messaging
  // This will be set up after the app initializes
  messaging = null; // Will be set via setMessagingService
}

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Validate that all config values are present
const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    console.warn(`Missing Firebase config: ${key}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence for Firestore
// For React Native, offline persistence is enabled by default
// But we explicitly set it here for clarity
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === "failed-precondition") {
      // Multiple tabs open
      console.log(
        "Firestore persistence: Multiple tabs open, offline disabled"
      );
    } else if (err.code === "unimplemented") {
      // Browser doesn't support persistence
      console.log("Firestore persistence: Not supported in this browser");
    }
  });
} catch (error) {
  // Already enabled, that's fine
}

// Export messaging function
export const setMessagingService = (messagingService: any) => {
  messaging = messagingService;
};

export const getMessagingService = () => messaging;

// Export app for any additional Firebase services needed later
export { app };
