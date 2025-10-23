import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { subscribeToUserChats } from "../../services/chatService";
import { subscribeToNetworkStatus } from "../../utils/networkUtils";
import { Chat } from "../../types";
import { ChatListItem } from "../../components/ChatListItem";
import { useChatDisplayName } from "../../utils/useChatDisplayName";
import { colorPalette } from "../../utils/theme";

interface ChatListScreenProps {
  navigation: any;
}

/**
 * Wrapper component to handle hook usage within FlatList renderItem
 */
const ChatItemWrapper: React.FC<{
  chat: Chat;
  currentUserId?: string;
  onPress: (chat: Chat, chatName: string) => void;
}> = ({ chat, currentUserId, onPress }) => {
  const chatName = useChatDisplayName(chat, currentUserId);

  // Use chat document's lastMessage directly (updated via subscribeToUserChats)
  // No need for message store here - that's only for the ChatScreen
  return (
    <ChatListItem
      chat={chat}
      onPress={() => onPress(chat, chatName)}
      unreadCount={0}
      isOnline={false}
    />
  );
};

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log("📋 Setting up chat listener for user:", user.uid);

    const unsubscribe = subscribeToUserChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
      setRefreshing(false);
      console.log("✅ Chats updated:", updatedChats.length);
    });

    // Cleanup listener on unmount
    return () => {
      console.log("🧹 Unsubscribing from chat listener");
      unsubscribe();
    };
  }, [user?.uid]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Real-time listener will handle refresh
  };

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribeNetwork = subscribeToNetworkStatus((isConnected) => {
      setIsNetworkOnline(isConnected);
    });

    return () => {
      unsubscribeNetwork();
    };
  }, []);

  const handleChatPress = (chat: Chat, chatName: string) => {
    if (chat.isDeleted) {
      return; // Prevent navigation to deleted chats
    }

    navigation.navigate("Chat", {
      chatId: chat.id,
      chatName,
      chatType: chat.type,
    });
  };

  const handleNewChat = () => {
    navigation.navigate("QuickChat");
  };

  const handleNewGroup = () => {
    navigation.getParent().navigate("ContactsTab", {
      screen: "NewGroup",
    });
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <ChatItemWrapper
      chat={item}
      currentUserId={user?.uid}
      onPress={handleChatPress}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by tapping the button below
      </Text>
      <Button
        mode="contained"
        onPress={handleNewChat}
        style={styles.emptyButton}
        labelStyle={styles.emptyButtonLabel}
      >
        Start Chatting
      </Button>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colorPalette.neutral[100], colorPalette.neutral[100]]}
          locations={[0, 1]}
          style={styles.headerGradient}
        >
          <BlurView intensity={50} tint="light" style={styles.headerBlur}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>Messages</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleNewChat}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={28}
                    color={colorPalette.neutral[900]}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNewGroup}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={28}
                    color={colorPalette.neutral[900]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </LinearGradient>
      </View>

      {/* Offline Banner - Show right below header */}
      {!isNetworkOnline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons
            name="wifi-off"
            size={16}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.offlineBannerText}>No connection</Text>
        </View>
      )}

      {/* Loading state */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : chats.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(chat) => chat.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colorPalette.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  header: {
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colorPalette.neutral[100],
    shadowColor: colorPalette.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerBlur: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: `rgba(243, 244, 246, 0.6)`,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerLeft: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 100,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  headerSubtitle: {
    fontSize: 16,
    color: colorPalette.neutral[600],
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: colorPalette.neutral[600],
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colorPalette.neutral[600],
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  emptyButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
