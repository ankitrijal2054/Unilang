import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChatListScreen } from "../screens/ChatsTab/ChatListScreen";
import { ChatScreen } from "../screens/ChatsTab/ChatScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * ChatsStack - Stack navigator for chat-related screens
 */
const ChatsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen
      name="ChatList"
      component={ChatListScreen}
      options={{ title: "Chats" }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        title: "Chat",
        animationEnabled: true,
      }}
    />
  </Stack.Navigator>
);

/**
 * Placeholder screens for Contacts and Profile (will be built later)
 */
const ContactsPlaceholder = () => {
  return null; // Placeholder - will be built in Phase 3
};

const ProfilePlaceholder = () => {
  return null; // Placeholder - will be built in Phase 3
};

/**
 * AppStack - Bottom tab navigator with Chats, Contacts, and Profile tabs
 */
export const AppStack = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof MaterialCommunityIcons.glyphMap =
          "chat-outline";

        if (route.name === "ChatsTab") {
          iconName = focused ? "chat" : "chat-outline";
        } else if (route.name === "ContactsTab") {
          iconName = focused ? "contacts" : "contacts-outline";
        } else if (route.name === "ProfileTab") {
          iconName = focused ? "account" : "account-outline";
        }

        return (
          <MaterialCommunityIcons name={iconName} size={size} color={color} />
        );
      },
      tabBarActiveTintColor: "#2196F3",
      tabBarInactiveTintColor: "#999",
      tabBarStyle: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        paddingBottom: 4,
        height: 56,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 4,
      },
    })}
  >
    <Tab.Screen
      name="ChatsTab"
      component={ChatsStack}
      options={{
        title: "Chats",
      }}
    />

    <Tab.Screen
      name="ContactsTab"
      component={ContactsPlaceholder}
      options={{
        title: "Contacts",
      }}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          // Placeholder - will navigate to NewChatScreen in Phase 3
        },
      })}
    />

    <Tab.Screen
      name="ProfileTab"
      component={ProfilePlaceholder}
      options={{
        title: "Profile",
      }}
      listeners={({ navigation }) => ({
        tabPress: (e) => {
          e.preventDefault();
          // Placeholder - will navigate to ProfileScreen in Phase 3
        },
      })}
    />
  </Tab.Navigator>
);
