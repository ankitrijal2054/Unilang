import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChatListScreen } from "../screens/ChatsTab/ChatListScreen";
import { ChatScreen } from "../screens/ChatsTab/ChatScreen";
import { GroupInfoScreen } from "../screens/ChatsTab/GroupInfoScreen";
import { NewChatScreen } from "../screens/ContactsTab/NewChatScreen";
import { NewGroupScreen } from "../screens/ContactsTab/NewGroupScreen";
import { ProfileScreen } from "../screens/ProfileTab/ProfileScreen";

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
      }}
    />
    <Stack.Screen
      name="GroupInfo"
      component={GroupInfoScreen}
      options={{
        title: "Group Info",
      }}
    />
  </Stack.Navigator>
);

/**
 * ContactsStack - Stack navigator for contacts/user discovery
 */
const ContactsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen
      name="NewChat"
      component={NewChatScreen}
      options={{ title: "New Chat" }}
    />
    <Stack.Screen
      name="NewGroup"
      component={NewGroupScreen}
      options={{ title: "New Group" }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        title: "Chat",
      }}
    />
  </Stack.Navigator>
);

/**
 * ProfileStack - Stack navigator for profile-related screens
 */
const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: "Profile" }}
    />
  </Stack.Navigator>
);

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
      component={ContactsStack}
      options={{
        title: "Contacts",
      }}
    />

    <Tab.Screen
      name="ProfileTab"
      component={ProfileStack}
      options={{
        title: "Profile",
      }}
    />
  </Tab.Navigator>
);
