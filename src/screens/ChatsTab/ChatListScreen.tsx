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
import { Button, Text, Snackbar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { subscribeToUserChats, deleteChat } from "../../services/chatService";
import { getUserById } from "../../services/userService";
import { subscribeToMessages } from "../../services/messageService";
import { subscribeToNetworkStatus } from "../../utils/networkUtils";
import { Chat, Message } from "../../types";
import { SwipeableChatItem } from "../../components/SwipeableChatItem";
import { DeleteChatModal } from "../../components/DeleteChatModal";
import { SkeletonChatItem } from "../../components/SkeletonChatItem";
import { useChatDisplayName } from "../../utils/useChatDisplayName";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

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
  onDelete: (chat: Chat, chatName: string) => void;
}> = ({ chat, currentUserId, onPress, onDelete }) => {
  const chatName = useChatDisplayName(chat, currentUserId);
  const [otherUserAvatarUrl, setOtherUserAvatarUrl] = useState<string>();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch other user's avatar for direct chats
  useEffect(() => {
    if (
      chat.type === "direct" &&
      currentUserId &&
      chat.participants.length > 0
    ) {
      const otherUserId = chat.participants.find(
        (uid) => uid !== currentUserId
      );

      if (otherUserId) {
        const fetchAvatar = async () => {
          try {
            const result = await getUserById(otherUserId);
            if (result.success && result.user?.avatarUrl) {
              setOtherUserAvatarUrl(result.user.avatarUrl);
            }
          } catch (error) {
            console.error("Error fetching other user's avatar:", error);
          }
        };

        fetchAvatar();
      }
    }
  }, [chat, currentUserId]);

  // Subscribe to messages to calculate unread count
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeToMessages(chat.id, (messages: Message[]) => {
      // Count unread messages: messages sent by others that haven't been read by current user
      const unread = messages.filter(
        (msg) =>
          msg.senderId !== currentUserId &&
          (!msg.readBy || !msg.readBy.includes(currentUserId))
      ).length;
      setUnreadCount(unread);
    });

    return () => {
      unsubscribe();
    };
  }, [chat.id, currentUserId]);

  // Use chat document's lastMessage directly (updated via subscribeToUserChats)
  // No need for message store here - that's only for the ChatScreen
  return (
    <SwipeableChatItem
      chat={chat}
      otherUserAvatarUrl={otherUserAvatarUrl}
      unreadCount={unreadCount}
      onPress={() => onPress(chat, chatName)}
      onDelete={() => onDelete(chat, chatName)}
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<{
    chat: Chat;
    name: string;
  } | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

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

  const handleDeleteChat = (chat: Chat, chatName: string) => {
    setChatToDelete({ chat, name: chatName });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!chatToDelete || !user?.uid) return;

    setDeleteModalVisible(false);

    try {
      const result = await deleteChat(chatToDelete.chat.id, user.uid);
      if (result.success) {
        setSnackbarMessage(`"${chatToDelete.name}" deleted`);
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage("Failed to delete chat");
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      setSnackbarMessage("Failed to delete chat");
      setSnackbarVisible(true);
    }

    setChatToDelete(null);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setChatToDelete(null);
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <ChatItemWrapper
      chat={item}
      currentUserId={user?.uid}
      onPress={handleChatPress}
      onDelete={handleDeleteChat}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={colorPalette.gradientBlueSoft as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIconContainer}
      >
        <MaterialCommunityIcons
          name="message-text-outline"
          size={48}
          color="#FFFFFF"
        />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with someone special
      </Text>
      <TouchableOpacity
        onPress={handleNewChat}
        style={styles.emptyButton}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={colorPalette.gradientBlue as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyButtonGradient}
        >
          <Text style={styles.emptyButtonLabel}>Start Chatting</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Messages</Text>
            <Text style={styles.headerSubtitle}>
              {chats.length} conversation{chats.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewChat}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={colorPalette.neutral[950]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewGroup}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color={colorPalette.neutral[950]}
              />
            </TouchableOpacity>
          </View>
        </View>
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

      {/* Loading state with skeleton loaders */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonChatItem />
          <SkeletonChatItem />
          <SkeletonChatItem />
          <SkeletonChatItem />
          <SkeletonChatItem />
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

      {/* Delete Chat Modal */}
      <DeleteChatModal
        visible={deleteModalVisible}
        chatName={chatToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  header: {
    height: 72,
    justifyContent: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colorPalette.background,
    ...colorPalette.shadows.small,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
  },
  headerSubtitle: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral[100],
  },
  loadingText: {
    ...typography.caption,
    color: colorPalette.neutral[950],
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonContainer: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
    ...colorPalette.shadows.medium,
  },
  emptyTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colorPalette.neutral[600],
    textAlign: "center",
    marginBottom: spacing.xxxl,
  },
  emptyButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  emptyButtonGradient: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxxl,
    borderRadius: borderRadius.full,
  },
  emptyButtonLabel: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    textAlign: "center",
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.errorDark,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  offlineBannerText: {
    ...typography.captionMedium,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  snackbar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
});
