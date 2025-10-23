import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Badge, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Chat } from "../types";
import { formatChatTime, truncateText } from "../utils/formatters";
import { useAuthStore } from "../store/authStore";
import { useChatDisplayName } from "../utils/useChatDisplayName";
import { colorPalette } from "../utils/theme";

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
  unreadCount?: number;
  isOnline?: boolean;
  otherUserAvatarUrl?: string; // Avatar URL of the other user (for direct chats)
}

/**
 * ChatListItem Component
 * Displays a single chat in the chat list with modern minimalist design
 */
export const ChatListItem: React.FC<ChatListItemProps> = React.memo(
  ({
    chat,
    onPress,
    unreadCount = 0,
    isOnline = false,
    otherUserAvatarUrl,
  }) => {
    const { user } = useAuthStore();
    const chatName = useChatDisplayName(chat, user?.uid);

    const messagePreview = useMemo(
      () => truncateText(chat.lastMessage || "No messages yet", 40),
      [chat.lastMessage]
    );

    const timeLabel = useMemo(
      () => formatChatTime(chat.lastMessageTime),
      [chat.lastMessageTime]
    );

    const isGroupChat = chat.type === "group";

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.6}
        style={styles.container}
      >
        {/* Avatar / Icon */}
        <View style={styles.avatarContainer}>
          {/* Display real avatar for direct chats, fallback to icon */}
          {!isGroupChat && otherUserAvatarUrl ? (
            <Avatar.Image
              size={56}
              source={{ uri: otherUserAvatarUrl }}
              style={[
                styles.avatarImage,
                chat.isDeleted && styles.deletedAvatar,
              ]}
            />
          ) : (
            <View
              style={[styles.avatar, chat.isDeleted && styles.deletedAvatar]}
            >
              <MaterialCommunityIcons
                name={isGroupChat ? "account-multiple" : "account"}
                size={24}
                color={
                  chat.isDeleted
                    ? colorPalette.neutral[400]
                    : colorPalette.primary
                }
              />
            </View>
          )}

          {/* Online indicator */}
          {isOnline && !isGroupChat && !chat.isDeleted && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        {/* Chat info */}
        <View style={styles.chatInfo}>
          <View style={styles.header}>
            <Text
              style={[
                styles.chatName,
                chat.isDeleted && styles.deletedText,
                unreadCount > 0 && styles.unreadName,
              ]}
              numberOfLines={1}
            >
              {chatName}
              {chat.isDeleted && " (Deleted)"}
            </Text>
            <Text style={styles.time}>{timeLabel}</Text>
          </View>

          <View style={styles.previewRow}>
            <Text
              style={[styles.preview, unreadCount > 0 && styles.unreadPreview]}
              numberOfLines={1}
            >
              {messagePreview}
            </Text>

            {unreadCount > 0 && (
              <Badge style={styles.badge} size={20}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.chat.id === nextProps.chat.id &&
      prevProps.chat.type === nextProps.chat.type &&
      prevProps.chat.name === nextProps.chat.name &&
      prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
      prevProps.chat.lastMessageTime === nextProps.chat.lastMessageTime &&
      prevProps.unreadCount === nextProps.unreadCount &&
      prevProps.isOnline === nextProps.isOnline &&
      prevProps.otherUserAvatarUrl === nextProps.otherUserAvatarUrl &&
      prevProps.onPress === nextProps.onPress
    );
  }
);

ChatListItem.displayName = "ChatListItem";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[100],
    backgroundColor: colorPalette.background,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colorPalette.primary,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.1,
  },
  avatarImage: {
    borderRadius: 28,
  },
  deletedAvatar: {
    backgroundColor: colorPalette.neutral[400],
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colorPalette.success,
    borderWidth: 2,
    borderColor: colorPalette.background,
  },
  chatInfo: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  chatName: {
    fontSize: 15,
    fontWeight: "600",
    color: colorPalette.neutral[900],
    flex: 1,
  },
  unreadName: {
    fontWeight: "700",
  },
  deletedText: {
    color: colorPalette.neutral[500],
  },
  time: {
    fontSize: 12,
    color: colorPalette.neutral[500],
    marginLeft: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    fontSize: 13,
    color: colorPalette.neutral[600],
    flex: 1,
    marginRight: 8,
  },
  unreadPreview: {
    fontWeight: "700",
    color: colorPalette.neutral[700],
  },
  badge: {
    backgroundColor: colorPalette.primary,
  },
});
