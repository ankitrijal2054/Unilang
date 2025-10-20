import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, Text } from "react-native";
import { LoginScreen } from "../screens/AuthStack/LoginScreen";
import { SignUpScreen } from "../screens/AuthStack/SignUpScreen";
import { AppStack } from "./AppStack";
import { useAuthStore } from "../store/authStore";
import { onAuthStateChanged } from "../services/authService";

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
          setIsAuthenticated(true);
          // Note: Full user profile will be fetched from Firestore in Phase 3
          // For now, we just mark as authenticated
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
  }, [setIsAuthenticated, setIsLoading, logout]);

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
