import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { Message } from "../types";
import { formatTime } from "../utils/formatters";
import { StatusIndicator } from "./StatusIndicator";
import { ReadReceiptBadge } from "./ReadReceiptBadge";
import { ImageMessage } from "./ImageMessage";
import { ImageZoomModal } from "./ImageZoomModal";
import { colorPalette } from "../utils/theme";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showSenderName?: boolean;
  senderName?: string;
  senderAvatarUrl?: string; // Avatar URL of the message sender (for group chats)
  isLatestFromUser?: boolean;
  chatType: "direct" | "group";
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
    senderAvatarUrl,
    isLatestFromUser = false,
    chatType,
  }) => {
    const [zoomModalVisible, setZoomModalVisible] = useState(false);

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

    // Check if this is an image message
    const isImageMessage = message.messageType === "image" && message.imageUrl;

    // For own messages, show bubble with status below if latest
    if (isOwnMessage) {
      // Check if message is pending (offline)
      const isPending = (message as any).localStatus === "pending";

      return (
        <>
          <View style={[styles.container, styles.ownContainer]}>
            <View style={[bubbleStyle, isPending && styles.pendingBubble]}>
              {isImageMessage ? (
                <ImageMessage
                  imageUrl={message.imageUrl!}
                  imageWidth={message.imageWidth}
                  imageHeight={message.imageHeight}
                  caption={message.text}
                  onPress={() => setZoomModalVisible(true)}
                  isOwnMessage={true}
                />
              ) : (
                <Text style={[textStyle, isPending && styles.pendingText]}>
                  {message.text}
                </Text>
              )}

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
            {/* Read receipt or status indicator below bubble for latest message only */}
            {isLatestFromUser && (
              <View style={styles.statusContainer}>
                {message.readBy && message.readBy.length > 0 ? (
                  <ReadReceiptBadge
                    readBy={message.readBy}
                    chatType={chatType}
                  />
                ) : (
                  <StatusIndicator status={message.status} size={14} />
                )}
              </View>
            )}
          </View>

          {/* Image zoom modal */}
          {isImageMessage && (
            <ImageZoomModal
              visible={zoomModalVisible}
              imageUrl={message.imageUrl!}
              imageWidth={message.imageWidth}
              imageHeight={message.imageHeight}
              caption={message.text}
              onClose={() => setZoomModalVisible(false)}
            />
          )}
        </>
      );
    }

    // For group messages from others, show name above and avatar on left
    if (showSenderName && senderName) {
      return (
        <>
          <View style={styles.otherMessageContainer}>
            {/* Avatar on the left - show real avatar if available, else initials */}
            {senderAvatarUrl ? (
              <Avatar.Image
                size={32}
                source={{ uri: senderAvatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={32}
                label={senderName.charAt(0).toUpperCase()}
                style={styles.avatar}
              />
            )}

            {/* Message bubble and name on the right */}
            <View style={styles.messageColumn}>
              <Text style={styles.senderName}>{senderName}</Text>
              <View style={bubbleStyle}>
                {isImageMessage ? (
                  <ImageMessage
                    imageUrl={message.imageUrl!}
                    imageWidth={message.imageWidth}
                    imageHeight={message.imageHeight}
                    caption={message.text}
                    onPress={() => setZoomModalVisible(true)}
                    isOwnMessage={false}
                  />
                ) : (
                  <Text style={textStyle}>{message.text}</Text>
                )}

                <View style={styles.footer}>
                  <Text style={styles.otherTimestamp}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Image zoom modal */}
          {isImageMessage && (
            <ImageZoomModal
              visible={zoomModalVisible}
              imageUrl={message.imageUrl!}
              imageWidth={message.imageWidth}
              imageHeight={message.imageHeight}
              caption={message.text}
              onClose={() => setZoomModalVisible(false)}
            />
          )}
        </>
      );
    }

    // For direct chat messages from others
    return (
      <>
        <View style={[styles.container, styles.otherContainer]}>
          <View style={bubbleStyle}>
            {isImageMessage ? (
              <ImageMessage
                imageUrl={message.imageUrl!}
                imageWidth={message.imageWidth}
                imageHeight={message.imageHeight}
                caption={message.text}
                onPress={() => setZoomModalVisible(true)}
                isOwnMessage={false}
              />
            ) : (
              <Text style={textStyle}>{message.text}</Text>
            )}

            <View style={styles.footer}>
              <Text style={styles.otherTimestamp}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </View>
        </View>

        {/* Image zoom modal */}
        {isImageMessage && (
          <ImageZoomModal
            visible={zoomModalVisible}
            imageUrl={message.imageUrl!}
            imageWidth={message.imageWidth}
            imageHeight={message.imageHeight}
            caption={message.text}
            onClose={() => setZoomModalVisible(false)}
          />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.text === nextProps.message.text &&
      prevProps.message.status === nextProps.message.status &&
      prevProps.message.type === nextProps.message.type &&
      prevProps.message.messageType === nextProps.message.messageType &&
      prevProps.message.imageUrl === nextProps.message.imageUrl &&
      JSON.stringify(prevProps.message.readBy) ===
        JSON.stringify(nextProps.message.readBy) &&
      prevProps.isOwnMessage === nextProps.isOwnMessage &&
      prevProps.senderName === nextProps.senderName &&
      prevProps.senderAvatarUrl === nextProps.senderAvatarUrl &&
      prevProps.isLatestFromUser === nextProps.isLatestFromUser &&
      prevProps.chatType === nextProps.chatType
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
