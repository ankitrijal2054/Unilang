import React, { useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Avatar, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  // Translation props (Phase 3)
  onTranslate?: (messageId: string) => void;
  onRetryTranslation?: (messageId: string) => void;
  senderPreferredLang?: string;
  receiverPreferredLang?: string;
  isTranslating?: boolean;
  onSlangInfo?: (explanation: string) => void;
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
    onTranslate,
    onRetryTranslation,
    senderPreferredLang,
    receiverPreferredLang,
    isTranslating = false,
    onSlangInfo,
  }) => {
    const [zoomModalVisible, setZoomModalVisible] = useState(false);

    // Determine if translate button should show
    const showTranslateButton =
      !isOwnMessage &&
      onTranslate &&
      senderPreferredLang &&
      receiverPreferredLang &&
      senderPreferredLang !== receiverPreferredLang &&
      message.messageType !== "image"; // Only for text messages

    // Check if translation is available and visible
    const hasTranslation = message.translation;
    const showTranslation = hasTranslation && message.translationVisible;

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

    // Helper to render message text (original or translated)
    const renderMessageText = () => {
      if (showTranslation) {
        // Stacked view: translation on top, original below
        return (
          <View>
            {/* Translated text */}
            <Text style={textStyle}>{message.translation!.text}</Text>

            {/* Divider */}
            <View style={styles.translationDivider} />

            {/* Original text (faded) */}
            <View style={styles.originalTextContainer}>
              <Text style={[textStyle, styles.originalText]}>
                {message.text}
              </Text>
            </View>

            {/* Retry button */}
            {onRetryTranslation && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => onRetryTranslation(message.id)}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={12}
                  color={colorPalette.primary}
                />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      // Original text only
      return <Text style={textStyle}>{message.text}</Text>;
    };

    // Helper to render translate button and slang tooltip
    const renderTranslationControls = () => {
      if (!showTranslateButton) return null;

      return (
        <View style={styles.translationControls}>
          {/* Translate button */}
          <TouchableOpacity
            style={styles.translateButton}
            onPress={() => onTranslate!(message.id)}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <ActivityIndicator size={12} color={colorPalette.primary} />
            ) : (
              <MaterialCommunityIcons
                name="translate"
                size={14}
                color={colorPalette.primary}
              />
            )}
            <Text style={styles.translateButtonText}>
              {isTranslating
                ? "Translating..."
                : hasTranslation
                ? showTranslation
                  ? "Hide"
                  : "Show Translation"
                : "Translate"}
            </Text>
          </TouchableOpacity>

          {/* Slang tooltip (if translation has cultural context) */}
          {hasTranslation &&
            message.translation!.slangExplanation &&
            onSlangInfo && (
              <TouchableOpacity
                style={styles.slangTooltip}
                onPress={() =>
                  onSlangInfo(message.translation!.slangExplanation!)
                }
              >
                <MaterialCommunityIcons
                  name="information-outline"
                  size={12}
                  color={colorPalette.warning}
                />
                <Text style={styles.slangText}>Cultural context</Text>
              </TouchableOpacity>
            )}
        </View>
      );
    };

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
                  renderMessageText()
                )}

                <View style={styles.footer}>
                  <Text style={styles.otherTimestamp}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>

                {/* Translation controls (button + slang tooltip) */}
                {renderTranslationControls()}
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
              renderMessageText()
            )}

            <View style={styles.footer}>
              <Text style={styles.otherTimestamp}>
                {formatTime(message.timestamp)}
              </Text>
            </View>

            {/* Translation controls (button + slang tooltip) */}
            {renderTranslationControls()}
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
      JSON.stringify(prevProps.message.translation) ===
        JSON.stringify(nextProps.message.translation) &&
      prevProps.message.translationVisible ===
        nextProps.message.translationVisible &&
      prevProps.isOwnMessage === nextProps.isOwnMessage &&
      prevProps.senderName === nextProps.senderName &&
      prevProps.senderAvatarUrl === nextProps.senderAvatarUrl &&
      prevProps.isLatestFromUser === nextProps.isLatestFromUser &&
      prevProps.chatType === nextProps.chatType &&
      prevProps.isTranslating === nextProps.isTranslating &&
      prevProps.senderPreferredLang === nextProps.senderPreferredLang &&
      prevProps.receiverPreferredLang === nextProps.receiverPreferredLang
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
  // ========== Translation Styles (Phase 3) ==========
  translationControls: {
    marginTop: 8,
    gap: 6,
  },
  translateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(59, 130, 246, 0.1)", // Frosted blue
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.3)",
    alignSelf: "flex-start",
  },
  translateButtonText: {
    fontSize: 12,
    color: colorPalette.primary,
    fontWeight: "600",
  },
  translationDivider: {
    height: 1,
    backgroundColor: colorPalette.neutral[300],
    marginVertical: 8,
    opacity: 0.5,
  },
  originalTextContainer: {
    opacity: 0.5,
    marginTop: 4,
  },
  originalText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  retryText: {
    fontSize: 11,
    color: colorPalette.primary,
    fontWeight: "600",
  },
  slangTooltip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colorPalette.warning + "20", // Yellow tint
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colorPalette.warning + "40",
    alignSelf: "flex-start",
  },
  slangText: {
    fontSize: 11,
    color: colorPalette.warning,
    fontWeight: "600",
  },
});
