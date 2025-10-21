import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { Message } from "../types";
import { formatTime } from "../utils/formatters";
import { StatusIndicator } from "./StatusIndicator";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderName?: boolean;
  senderName?: string;
}

/**
 * MessageBubble Component
 * Displays a single message in a chat
 * For group chats: shows sender name above message with small avatar on left
 * For direct chats: shows message bubble only
 */
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({ message, isOwnMessage, showSenderName, senderName }) => {
    const bubbleStyle = useMemo(
      () => [
        styles.bubble,
        isOwnMessage ? styles.ownBubble : styles.otherBubble,
      ],
      [isOwnMessage]
    );

    const textStyle = useMemo(
      () => [
        styles.messageText,
        isOwnMessage ? styles.ownText : styles.otherText,
      ],
      [isOwnMessage]
    );

    // System messages (join, leave, removed from group)
    if (message.type === "system") {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{message.text}</Text>
        </View>
      );
    }

    // For own messages, just show the bubble
    if (isOwnMessage) {
      return (
        <View style={[styles.container, styles.ownContainer]}>
          <View style={bubbleStyle}>
            <Text style={textStyle}>{message.text}</Text>

            <View style={styles.footer}>
              <Text style={styles.timestamp}>
                {formatTime(message.timestamp)}
              </Text>
              <StatusIndicator status={message.status} size={12} />
            </View>
          </View>
        </View>
      );
    }

    // For group messages from others, show name above and avatar on left
    if (showSenderName && senderName) {
      return (
        <View style={styles.otherMessageContainer}>
          {/* Avatar on the left */}
          <Avatar.Text
            size={32}
            label={senderName.charAt(0).toUpperCase()}
            style={styles.avatar}
          />

          {/* Message bubble and name on the right */}
          <View style={styles.messageColumn}>
            <Text style={styles.senderName}>{senderName}</Text>
            <View style={bubbleStyle}>
              <Text style={textStyle}>{message.text}</Text>

              <View style={styles.footer}>
                <Text style={styles.timestamp}>
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // For direct chat messages from others
    return (
      <View style={[styles.container, styles.otherContainer]}>
        <View style={bubbleStyle}>
          <Text style={textStyle}>{message.text}</Text>

          <View style={styles.footer}>
            <Text style={styles.timestamp}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if message content or status changed
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.text === nextProps.message.text &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.message.type === nextProps.message.type &&
      prevProps.isOwnMessage === nextProps.isOwnMessage &&
      prevProps.senderName === nextProps.senderName
    );
  }
);

MessageBubble.displayName = "MessageBubble";

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  ownContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  otherMessageContainer: {
    marginVertical: 8,
    marginHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  avatar: {
    backgroundColor: "#2196F3",
  },
  messageColumn: {
    flex: 1,
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 2,
  },
  ownBubble: {
    backgroundColor: "#2196F3",
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownText: {
    color: "white",
  },
  otherText: {
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2196F3",
    marginBottom: 4,
  },
  systemMessageContainer: {
    marginVertical: 12,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    fontSize: 13,
    color: "#65676b",
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
});
