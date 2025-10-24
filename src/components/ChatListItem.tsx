import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Badge, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Chat } from "../types";
import { formatChatTime, truncateText } from "../utils/formatters";
import { useAuthStore } from "../store/authStore";
import { useChatDisplayName } from "../utils/useChatDisplayName";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../utils/theme";

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

    // Group avatar gradient colors
    const groupGradientColors = (
      isGroupChat
        ? colorPalette.gradientPurpleSoft
        : colorPalette.gradientBlueSoft
    ) as [string, string, ...string[]];

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.65}
        style={[styles.container, unreadCount > 0 && styles.containerUnread]}
      >
        {/* Avatar / Icon */}
        <View style={styles.avatarContainer}>
          {/* Display real avatar for direct chats, fallback to gradient icon */}
          {!isGroupChat && otherUserAvatarUrl ? (
            <Avatar.Image
              size={60}
              source={{ uri: otherUserAvatarUrl }}
              style={[
                styles.avatarImage,
                chat.isDeleted && styles.deletedAvatar,
              ]}
            />
          ) : (
            <LinearGradient
              colors={
                chat.isDeleted
                  ? [colorPalette.neutral[300], colorPalette.neutral[400]]
                  : groupGradientColors
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.avatar, chat.isDeleted && styles.deletedAvatar]}
            >
              <MaterialCommunityIcons
                name={isGroupChat ? "account-multiple" : "account"}
                size={26}
                color="#FFFFFF"
              />
            </LinearGradient>
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
    paddingHorizontal: spacing.base,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colorPalette.neutral[150],
    backgroundColor: colorPalette.background,
  },
  containerUnread: {
    backgroundColor: colorPalette.neutral[50],
  },
  avatarContainer: {
    position: "relative",
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  avatarImage: {
    borderRadius: 30,
    ...colorPalette.shadows.small,
  },
  deletedAvatar: {
    opacity: 0.5,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colorPalette.semantic.online,
    borderWidth: 3,
    borderColor: colorPalette.background,
    ...colorPalette.shadows.small,
  },
  chatInfo: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  chatName: {
    ...typography.bodyBold,
    color: colorPalette.neutral[900],
    flex: 1,
  },
  unreadName: {
    ...typography.bodyBold,
    fontWeight: "700",
    color: colorPalette.neutral[950],
  },
  deletedText: {
    color: colorPalette.neutral[500],
    fontWeight: "500",
  },
  time: {
    ...typography.small,
    color: colorPalette.neutral[500],
    marginLeft: spacing.sm,
    fontWeight: "500",
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadPreview: {
    ...typography.captionMedium,
    fontWeight: "700",
    color: colorPalette.neutral[800],
  },
  badge: {
    backgroundColor: colorPalette.primary,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
    ...colorPalette.shadows.small,
  },
});
