import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, AppState } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { LoginScreen } from "../screens/AuthStack/LoginScreen";
import { SignUpScreen } from "../screens/AuthStack/SignUpScreen";
import { AppStack } from "./AppStack";
import { useAuthStore } from "../store/authStore";
import { onAuthStateChanged } from "../services/authService";
import { updateUserStatus } from "../services/userService";
import { db } from "../services/firebase";
import { COLLECTIONS } from "../utils/constants";

const Stack = createNativeStackNavigator();

interface RootNavigatorProps {
  // No required props
}

export const RootNavigator = ({}: RootNavigatorProps) => {
  const {
    isAuthenticated,
    isLoading,
    setUser,
    setIsAuthenticated,
    setIsLoading,
    logout,
  } = useAuthStore();

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is logged in
          console.log("✅ Auth state: User logged in", firebaseUser.email);

          // Fetch full user profile from Firestore
          const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            const user = {
              uid: firebaseUser.uid,
              name: data.name,
              email: data.email,
              preferred_language: data.preferred_language,
              status: data.status || "online",
              lastSeen: data.lastSeen,
              createdAt: data.createdAt,
              fcmToken: data.fcmToken,
            };

            console.log("✅ User profile loaded:", user.uid);
            setUser(user);

            // Update user status to online
            await updateUserStatus(firebaseUser.uid, "online");
          } else {
            // Fallback user object if Firestore doc doesn't exist
            console.warn("⚠️ User doc not found in Firestore, using fallback");
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
                "User",
              preferred_language: "en",
              status: "online",
              lastSeen: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });

            // Update status to online
            await updateUserStatus(firebaseUser.uid, "online");
          }

          setIsAuthenticated(true);
        } else {
          // User is logged out
          console.log("✅ Auth state: User logged out");
          setIsAuthenticated(false);
          logout();
        }
      } catch (error) {
        console.error("❌ Auth state change error:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setIsAuthenticated, setIsLoading, logout, setUser]);

  // Listen to app state changes (foreground/background) for presence
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Handle app state changes
  const handleAppStateChange = async (state: any) => {
    const { user } = useAuthStore.getState();

    if (!user) return;

    if (state === "active") {
      // App came to foreground
      console.log("📱 App in foreground - setting status to online");
      await updateUserStatus(user.uid, "online");
    } else if (state === "background" || state === "inactive") {
      // App went to background
      console.log("📱 App in background - setting status to offline");
      await updateUserStatus(user.uid, "offline");
    }
  };

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          // App Stack (authenticated user) - with bottom tab navigator
          <Stack.Group>
            <Stack.Screen
              name="AppStack"
              component={AppStack}
              options={{ title: "App" }}
            />
          </Stack.Group>
        ) : (
          // Auth Stack (unauthenticated user)
          <Stack.Group>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Sign In" }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: "Create Account" }}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
