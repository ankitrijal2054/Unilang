import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
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
 * Different styling for own vs other messages
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

    return (
      <View style={[styles.container, isOwnMessage && styles.ownContainer]}>
        {showSenderName && !isOwnMessage && senderName && (
          <Text style={styles.senderName}>{senderName}</Text>
        )}

        <View style={bubbleStyle}>
          <Text style={textStyle}>{message.text}</Text>

          <View style={styles.footer}>
            <Text style={styles.timestamp}>
              {formatTime(message.timestamp)}
            </Text>
            {isOwnMessage && (
              <StatusIndicator status={message.status} size={12} />
            )}
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
      prevProps.isOwnMessage === nextProps.isOwnMessage
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
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
});
