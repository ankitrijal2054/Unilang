import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

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

// Initialize Messaging (FCM)
let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log("Firebase Messaging not available in this environment");
}

export { messaging };

// Export app for any additional Firebase services needed later
export { app };
