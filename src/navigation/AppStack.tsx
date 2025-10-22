import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChatListScreen } from "../screens/ChatsTab/ChatListScreen";
import { ChatScreen } from "../screens/ChatsTab/ChatScreen";
import { GroupInfoScreen } from "../screens/ChatsTab/GroupInfoScreen";
import { NewChatScreen } from "../screens/ContactsTab/NewChatScreen";
import { ContactsListScreen } from "../screens/ContactsTab/ContactsListScreen";
import { ContactCardScreen } from "../screens/ContactsTab/ContactCardScreen";
import { NewGroupScreen } from "../screens/ContactsTab/NewGroupScreen";
import { ProfileScreen } from "../screens/ProfileTab/ProfileScreen";
import { colorPalette } from "../utils/theme";

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
      name="QuickChat"
      component={NewChatScreen}
      options={{ title: "New Chat" }}
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
      name="Contacts"
      component={ContactsListScreen}
      options={{ title: "Contacts" }}
    />
    <Stack.Screen
      name="ContactCard"
      component={ContactCardScreen}
      options={{
        title: "Contact Details",
      }}
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
 * Clicking on a tab always resets to the root screen of that tab
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
      tabBarActiveTintColor: colorPalette.primary,
      tabBarInactiveTintColor: colorPalette.neutral[400],
      tabBarStyle: {
        backgroundColor: colorPalette.background,
        borderTopWidth: 1,
        borderTopColor: colorPalette.neutral[200],
        paddingBottom: 8,
        height: 70,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 2,
      },
    })}
    screenListeners={({ navigation, route }) => ({
      tabPress: (e) => {
        // Reset the stack to the root screen when tab is pressed
        const navState = navigation.getState();
        // If there's more than one screen in the stack, navigate to root
        if (navState.index > 0) {
          if (route.name === "ChatsTab") {
            navigation.navigate("ChatsTab", { screen: "ChatList" });
          } else if (route.name === "ContactsTab") {
            navigation.navigate("ContactsTab", { screen: "Contacts" });
          } else if (route.name === "ProfileTab") {
            navigation.navigate("ProfileTab", { screen: "ProfileMain" });
          }
        }
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
