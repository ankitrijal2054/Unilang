import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { Message } from "../types";
import { formatTime } from "../utils/formatters";
import { StatusIndicator } from "./StatusIndicator";
import { colorPalette } from "../utils/theme";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderName?: boolean;
  senderName?: string;
  isLatestFromUser?: boolean;
}

/**
 * MessageBubble Component
 * Displays a single message in a chat with modern minimalist design
 */
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({
    message,
    isOwnMessage,
    showSenderName,
    senderName,
    isLatestFromUser = false,
  }) => {
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

    // For own messages, show bubble with status below if latest
    if (isOwnMessage) {
      // Check if message is pending (offline)
      const isPending = (message as any).localStatus === "pending";

      return (
        <View style={[styles.container, styles.ownContainer]}>
          <View style={[bubbleStyle, isPending && styles.pendingBubble]}>
            <Text style={[textStyle, isPending && styles.pendingText]}>
              {message.text}
            </Text>

            <View style={styles.footer}>
              <Text
                style={[
                  styles.ownTimestamp,
                  isPending && styles.pendingTimestamp,
                ]}
              >
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
          {/* Status indicator below and outside bubble for latest message only */}
          {isLatestFromUser && (
            <View style={styles.statusContainer}>
              <StatusIndicator status={message.status} size={14} />
            </View>
          )}
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
                <Text style={styles.otherTimestamp}>
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
            <Text style={styles.otherTimestamp}>
              {formatTime(message.timestamp)}
            </Text>
          </View>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.text === nextProps.message.text &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.message.type === nextProps.message.type &&
      prevProps.isOwnMessage === nextProps.isOwnMessage &&
      prevProps.senderName === nextProps.senderName &&
      prevProps.isLatestFromUser === nextProps.isLatestFromUser
    );
  }
);

MessageBubble.displayName = "MessageBubble";

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    gap: 6,
  },
  ownContainer: {
    justifyContent: "flex-end",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
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
    backgroundColor: colorPalette.primary,
  },
  messageColumn: {
    flex: 1,
    alignItems: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 2,
  },
  ownBubble: {
    backgroundColor: colorPalette.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colorPalette.neutral[100],
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownText: {
    color: "white",
    fontWeight: "500",
  },
  otherText: {
    color: colorPalette.neutral[900],
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  ownTimestamp: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherTimestamp: {
    fontSize: 12,
    color: colorPalette.neutral[500],
  },
  senderName: {
    fontSize: 12,
    fontWeight: "700",
    color: colorPalette.primary,
    marginBottom: 4,
  },
  statusContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 4,
  },
  systemMessageContainer: {
    marginVertical: 12,
    marginHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  systemMessageText: {
    fontSize: 13,
    color: colorPalette.neutral[500],
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "500",
  },
  pendingBubble: {
    backgroundColor: colorPalette.neutral[200],
  },
  pendingText: {
    color: colorPalette.neutral[700],
  },
  pendingTimestamp: {
    color: colorPalette.neutral[600],
  },
});
