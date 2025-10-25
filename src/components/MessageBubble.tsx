import React, { useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Clipboard } from "react-native";
import { Text, Avatar, ActivityIndicator, Menu } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Message } from "../types";
import { formatTime } from "../utils/formatters";
import { StatusIndicator } from "./StatusIndicator";
import { ReadReceiptBadge } from "./ReadReceiptBadge";
import { ImageMessage } from "./ImageMessage";
import { ImageZoomModal } from "./ImageZoomModal";
import { AnimatedDots } from "./AnimatedDots";
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
    senderPreferredLang,
    receiverPreferredLang,
    isTranslating = false,
    onSlangInfo,
  }) => {
    const [zoomModalVisible, setZoomModalVisible] = useState(false);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);

    // Determine if translate option should be available
    const canTranslate =
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
          </View>
        );
      }

      // Original text only
      return <Text style={textStyle}>{message.text}</Text>;
    };

    // Handle copy to clipboard
    const handleCopy = () => {
      const textToCopy = showTranslation
        ? message.translation!.text
        : message.text;
      Clipboard.setString(textToCopy);
      setContextMenuVisible(false);
    };

    // Handle translate from context menu
    const handleTranslateFromMenu = () => {
      setContextMenuVisible(false);
      if (onTranslate) {
        onTranslate(message.id);
      }
    };

    // Handle long press on message
    const handleLongPress = () => {
      // Don't show menu for system messages or image messages
      if (message.type === "system" || message.messageType === "image") {
        return;
      }
      setContextMenuVisible(true);
    };

    // Render slang tooltip if available
    const renderSlangTooltip = () => {
      if (
        !hasTranslation ||
        !message.translation!.slangExplanation ||
        !onSlangInfo
      ) {
        return null;
      }

      return (
        <TouchableOpacity
          style={styles.slangTooltip}
          onPress={() => onSlangInfo(message.translation!.slangExplanation!)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={14}
            color={colorPalette.warningDark}
          />
          {/*<Text style={styles.slangText}>Cultural context</Text> */}
          <MaterialCommunityIcons
            name="chevron-right"
            size={14}
            color={colorPalette.warningDark}
          />
        </TouchableOpacity>
      );
    };

    // Render loading overlay when translating
    const renderTranslatingOverlay = () => {
      if (!isTranslating) return null;

      return (
        <View style={styles.translatingOverlay}>
          <View style={styles.translatingContent}>
            <AnimatedDots />
          </View>
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
            <Menu
              visible={contextMenuVisible}
              onDismiss={() => setContextMenuVisible(false)}
              contentStyle={styles.contextMenu}
              anchor={
                <TouchableOpacity
                  style={[bubbleStyle, isPending && styles.pendingBubble]}
                  onLongPress={handleLongPress}
                  activeOpacity={0.7}
                >
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
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={handleCopy}
                title="Copy"
                leadingIcon="content-copy"
                titleStyle={styles.menuItemTitle}
                style={styles.menuItem}
              />
            </Menu>
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
              <Menu
                visible={contextMenuVisible}
                onDismiss={() => setContextMenuVisible(false)}
                contentStyle={styles.contextMenu}
                anchor={
                  <TouchableOpacity
                    style={bubbleStyle}
                    onLongPress={handleLongPress}
                    activeOpacity={0.7}
                  >
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

                    {/* Slang tooltip */}
                    {renderSlangTooltip()}

                    {/* Loading overlay when translating */}
                    {renderTranslatingOverlay()}
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  onPress={handleCopy}
                  title="Copy"
                  leadingIcon="content-copy"
                  titleStyle={styles.menuItemTitle}
                  style={styles.menuItem}
                />
                {canTranslate && (
                  <Menu.Item
                    onPress={handleTranslateFromMenu}
                    title={
                      hasTranslation
                        ? showTranslation
                          ? "Hide Translation"
                          : "Show Translation"
                        : "Translate"
                    }
                    leadingIcon="translate"
                    titleStyle={styles.menuItemTitle}
                    style={styles.menuItem}
                  />
                )}
              </Menu>
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
          <Menu
            visible={contextMenuVisible}
            onDismiss={() => setContextMenuVisible(false)}
            contentStyle={styles.contextMenu}
            anchor={
              <TouchableOpacity
                style={bubbleStyle}
                onLongPress={handleLongPress}
                activeOpacity={0.7}
              >
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

                {/* Slang tooltip */}
                {renderSlangTooltip()}

                {/* Loading overlay when translating */}
                {renderTranslatingOverlay()}
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={handleCopy}
              title="Copy"
              leadingIcon="content-copy"
              titleStyle={styles.menuItemTitle}
              style={styles.menuItem}
            />
            {canTranslate && (
              <Menu.Item
                onPress={handleTranslateFromMenu}
                title={
                  hasTranslation
                    ? showTranslation
                      ? "Hide Translation"
                      : "Show Translation"
                    : "Translate"
                }
                leadingIcon="translate"
                titleStyle={styles.menuItemTitle}
                style={styles.menuItem}
              />
            )}
          </Menu>
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
    marginVertical: 3,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    gap: 6,
    maxWidth: "75%",
  },
  ownContainer: {
    justifyContent: "flex-end",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    maxWidth: "75%",
    alignSelf: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
    maxWidth: "75%",
    alignSelf: "flex-start",
  },
  otherMessageContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "flex-end",
    alignSelf: "flex-start",
    gap: 10,
    maxWidth: "75%",
  },
  avatar: {
    backgroundColor: colorPalette.primary,
    ...colorPalette.shadows.small,
  },
  messageColumn: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 2,
  },
  ownBubble: {
    backgroundColor: colorPalette.semantic.messageSent,
    borderBottomRightRadius: 6,
    alignSelf: "flex-end",
    ...colorPalette.shadows.messageBubble,
  },
  otherBubble: {
    backgroundColor: colorPalette.semantic.messageReceived,
    borderBottomLeftRadius: 6,
    alignSelf: "flex-start",
    ...colorPalette.shadows.small,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  ownText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  otherText: {
    color: colorPalette.semantic.messageReceivedText,
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
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "500",
  },
  otherTimestamp: {
    fontSize: 11,
    color: colorPalette.neutral[500],
    fontWeight: "500",
  },
  senderName: {
    fontSize: 12,
    fontWeight: "700",
    color: colorPalette.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  statusContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 4,
    marginTop: 2,
  },
  systemMessageContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: colorPalette.neutral[100],
    borderRadius: 16,
    alignSelf: "center",
  },
  systemMessageText: {
    fontSize: 13,
    color: colorPalette.neutral[600],
    textAlign: "center",
    fontStyle: "italic",
    fontWeight: "600",
  },
  pendingBubble: {
    backgroundColor: colorPalette.neutral[200],
    opacity: 0.8,
  },
  pendingText: {
    color: colorPalette.neutral[700],
  },
  pendingTimestamp: {
    color: colorPalette.neutral[600],
  },
  // ========== Translation Styles (Phase 3) ==========
  translationDivider: {
    height: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginVertical: 10,
    opacity: 0.6,
  },
  originalTextContainer: {
    opacity: 0.6,
    marginTop: 6,
  },
  originalText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  slangTooltip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colorPalette.semantic.slangBadge,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colorPalette.warningDark + "40",
    alignSelf: "flex-start",
    marginTop: 8,
    ...colorPalette.shadows.medium,
  },
  slangText: {
    fontSize: 12,
    color: colorPalette.warningDark,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  // ========== Context Menu Styles ==========
  contextMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 6,
    minWidth: 180,
    ...colorPalette.shadows.large,
  },
  menuItem: {
    minHeight: 44,
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colorPalette.neutral[900],
  },
  // ========== Translating Overlay Styles ==========
  translatingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  translatingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    ...colorPalette.shadows.medium,
  },
  translatingText: {
    fontSize: 13,
    color: colorPalette.primary,
    fontWeight: "600",
  },
});
