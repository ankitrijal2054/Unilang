import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Badge } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Chat } from "../types";
import { formatChatTime, truncateText } from "../utils/formatters";
import { useAuthStore } from "../store/authStore";
import { useChatDisplayName } from "../utils/useChatDisplayName";

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
  unreadCount?: number;
  isOnline?: boolean;
}

/**
 * ChatListItem Component
 * Displays a single chat in the chat list
 * Shows chat name, last message preview, timestamp, and unread badge
 */
export const ChatListItem: React.FC<ChatListItemProps> = React.memo(
  ({ chat, onPress, unreadCount = 0, isOnline = false }) => {
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
        activeOpacity={0.7}
        style={styles.container}
      >
        {/* Avatar / Icon */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, chat.isDeleted && styles.deletedAvatar]}>
            <MaterialCommunityIcons
              name={isGroupChat ? "account-multiple" : "account"}
              size={24}
              color={chat.isDeleted ? "#999" : "#2196F3"}
            />
          </View>

          {/* Online indicator */}
          {isOnline && !isGroupChat && !chat.isDeleted && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        {/* Chat info */}
        <View style={styles.chatInfo}>
          <View style={styles.header}>
            <Text
              style={[styles.chatName, chat.isDeleted && styles.deletedText]}
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
    // Only re-render if chat content that affects display has changed
    return (
      prevProps.chat.id === nextProps.chat.id &&
      prevProps.chat.type === nextProps.chat.type &&
      prevProps.chat.name === nextProps.chat.name &&
      prevProps.chat.lastMessage === nextProps.chat.lastMessage &&
      prevProps.chat.lastMessageTime === nextProps.chat.lastMessageTime &&
      prevProps.unreadCount === nextProps.unreadCount &&
      prevProps.isOnline === nextProps.isOnline &&
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "white",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
  },
  deletedAvatar: {
    backgroundColor: "#f5f5f5",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "white",
  },
  chatInfo: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  chatName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  deletedText: {
    color: "#999",
  },
  time: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    fontSize: 13,
    color: "#999",
    flex: 1,
    marginRight: 8,
  },
  unreadPreview: {
    fontWeight: "600",
    color: "#333",
  },
  badge: {
    backgroundColor: "#2196F3",
  },
});
