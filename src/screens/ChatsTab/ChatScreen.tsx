import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SectionList,
  Text as RNText,
} from "react-native";
import {
  Appbar,
  TextInput,
  IconButton,
  Text,
  Snackbar,
} from "react-native-paper";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
} from "../../services/messageService";
import { updateChatLastMessage } from "../../services/chatService";
import { subscribeToUserPresence } from "../../services/userService";
import { subscribeToNetworkStatus, isOnline } from "../../utils/networkUtils";
import {
  setTyping,
  subscribeToTypingStatus,
  clearTyping,
} from "../../services/typingService";
import { useMessageStore } from "../../store/messageStore";
import { Message, User, Chat } from "../../types";
import { MessageBubble } from "../../components/MessageBubble";
import { TypingIndicator } from "../../components/TypingIndicator";
import { formatMessageDate, formatRelativeTime } from "../../utils/formatters";
import { db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "../../utils/constants";
import { colorPalette } from "../../utils/theme";

interface ChatScreenProps {
  navigation: any;
  route: any;
}

interface MessageGroup {
  title: string;
  data: Message[];
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuthStore();
  const { chatId, chatName, chatType } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [senderNames, setSenderNames] = useState<{ [key: string]: string }>({});
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: string; userName: string }>
  >([]);

  const flatListRef = useRef<SectionList>(null);
  const optimisticMessagesRef = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Group messages by date
  const groupedMessages: MessageGroup[] = React.useMemo(() => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((msg) => {
      const date = formatMessageDate(msg.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      title: date,
      data: msgs,
    }));
  }, [messages]);

  // Get the ID of the last non-system message for status display
  const lastMessageId = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type !== "system") {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Fetch chat data and setup presence listener for direct chats
  useEffect(() => {
    if (!chatId || !user?.uid) {
      return;
    }

    let unsubscribePresence: (() => void) | null = null;

    const fetchChatAndPresence = async () => {
      try {
        // Fetch chat data
        const chatDoc = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data() as Chat;
          setChat(chatData);

          // For direct chats, find and subscribe to the other user's presence
          if (chatType === "direct" && chatData.participants.length === 2) {
            const otherUserId = chatData.participants.find(
              (id) => id !== user.uid
            );
            if (otherUserId) {
              unsubscribePresence = subscribeToUserPresence(
                otherUserId,
                (userData) => {
                  if (userData) {
                    setOtherUser(userData);
                  }
                }
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching chat or presence:", error);
      }
    };

    fetchChatAndPresence();

    return () => {
      if (unsubscribePresence) {
        unsubscribePresence();
      }
    };
  }, [chatId, chatType, user?.uid]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatId || !user?.uid) {
      setLoading(false);
      return;
    }

    // Check if store is hydrated before reading cached messages
    const isHydrated = useMessageStore.getState().isHydrated;

    if (!isHydrated) {
      // Store not ready yet, wait a bit and retry
      const timer = setTimeout(() => {
        const cachedMessages = useMessageStore.getState().getMessages(chatId);
        if (cachedMessages.length > 0) {
          setMessages(cachedMessages);
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // Store is hydrated, load cached messages immediately (if available)
    const cachedMessages = useMessageStore.getState().getMessages(chatId);
    if (cachedMessages.length > 0) {
      setMessages(cachedMessages); // React state - updates UI
    }

    // Subscribe to Firestore for real-time updates
    const unsubscribe = subscribeToMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages); // React state - updates UI
      // Also update the persistent store
      useMessageStore.getState().setMessages(chatId, updatedMessages);
      setLoading(false);
    });

    // Mark messages as read when opening chat
    markMessagesAsRead(chatId, user.uid).catch((err) => {
      console.error("Error marking messages as read:", err);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [chatId, user?.uid]);

  // Subscribe to network status changes
  useEffect(() => {
    const unsubscribeNetwork = subscribeToNetworkStatus((isConnected) => {
      setIsNetworkOnline(isConnected);
      if (isConnected) {
        // Show brief "online" indicator
        console.log("🟢 Back online - messages will sync");
      } else {
        console.log("🔴 Offline - messages will be queued");
      }
    });

    return () => {
      unsubscribeNetwork();
    };
  }, []);

  // Subscribe to typing indicators for this chat
  useEffect(() => {
    if (!chatId) {
      return;
    }

    const unsubscribeTyping = subscribeToTypingStatus(chatId, (typingUsers) => {
      setTypingUsers(typingUsers);
    });

    return () => {
      // Clear typing status when unmounting
      clearTyping(chatId).catch((err) =>
        console.error("Error clearing typing on unmount:", err)
      );
      unsubscribeTyping();
    };
  }, [chatId]);

  // Fetch sender names for group chat (all participants upfront)
  useEffect(() => {
    if (chatType !== "group" || !chat?.participants) {
      return;
    }

    const fetchAllSenderNames = async () => {
      const { getUserById } = await import("../../services/userService");

      // Collect all unique sender IDs from messages + current participants
      // This ensures we fetch names even for users who left the group
      const senderIds = new Set<string>();

      // Add current participants
      chat.participants.forEach((id) => senderIds.add(id));

      // Add all message senders (in case they left the group)
      messages.forEach((msg) => senderIds.add(msg.senderId));

      for (const participantId of Array.from(senderIds)) {
        // Skip if already cached
        if (senderNames[participantId]) {
          continue;
        }

        try {
          const result = await getUserById(participantId);
          if (result.success && result.user) {
            setSenderNames((prev) => {
              return {
                ...prev,
                [participantId]: result.user.name,
              };
            });
          } else {
            setSenderNames((prev) => ({
              ...prev,
              [participantId]: "Unknown User",
            }));
          }
        } catch (error) {
          console.error(
            `Error fetching sender name for ${participantId}:`,
            error
          );
          setSenderNames((prev) => ({
            ...prev,
            [participantId]: "Unknown User",
          }));
        }
      }
    };

    fetchAllSenderNames();
  }, [chat?.participants, chatType, messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (groupedMessages.length > 0) {
      setTimeout(() => {
        try {
          const lastSectionIndex = groupedMessages.length - 1;
          const lastItemIndex = Math.max(
            0,
            groupedMessages[lastSectionIndex].data.length - 1
          );
          flatListRef.current?.scrollToLocation({
            sectionIndex: lastSectionIndex,
            itemIndex: lastItemIndex,
            animated: true,
            viewOffset: 0,
          });
        } catch (error) {
          // Silently ignore scroll errors (ref may not be ready)
        }
      }, 50);
    }
  }, [groupedMessages]);

  // Update header subtitle with presence info for direct chats
  const getHeaderSubtitle = (): string => {
    if (chatType === "group") {
      return "Group";
    }

    if (!otherUser) {
      return "Direct Message";
    }

    if (otherUser.status === "online") {
      return "Online";
    }

    if (otherUser.lastSeen) {
      return `Last seen ${formatRelativeTime(otherUser.lastSeen)}`;
    }

    return "Offline";
  };

  // Get presence indicator color
  const getPresenceColor = (): string => {
    if (chatType === "group") return "transparent";
    return otherUser?.status === "online" ? "#4CAF50" : "#999";
  };

  const handleOpenGroupInfo = () => {
    if (chatType === "group") {
      navigation.navigate("GroupInfo", { chatId });
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.uid) {
      return;
    }

    const textToSend = messageText.trim();
    setMessageText("");
    // Don't set setSending(true) to allow multiple messages to queue

    try {
      // Check current network status
      const online = await isOnline();

      // Create optimistic message with pending status if offline
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        chatId,
        senderId: user.uid,
        text: textToSend,
        timestamp: new Date().toISOString(),
        status: "sending",
        localStatus: online ? undefined : "pending", // Only set pending if offline
        ai: {
          translated_text: "",
          detected_language: "",
          summary: "",
        },
      };

      // Add to optimistic messages set
      optimisticMessagesRef.current.add(tempId);

      // Add to UI immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // Show syncing toast if offline

      // Send to Firestore
      const result = await sendMessage(chatId, textToSend, user.uid);

      if (result.success) {
        console.log("✅ Message sent:", result.messageId);

        // Update chat's last message
        await updateChatLastMessage(chatId, textToSend).catch((err) => {
          console.error("Error updating chat last message:", err);
        });

        // Remove from optimistic set
        optimisticMessagesRef.current.delete(tempId);
      } else {
        console.error("❌ Failed to send message:", result.error);
        setMessageText(textToSend); // Restore text for retry
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      setMessageText(textToSend); // Restore text for retry
    }
    // Remove finally block - no need to set setSending(false)
  };

  const handleTextInputChange = (text: string) => {
    setMessageText(text);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If user is typing and we haven't marked them as typing yet
    if (text.trim().length > 0 && !isTypingRef.current) {
      isTypingRef.current = true;
      setTyping(chatId, true).catch((err) =>
        console.error("Error setting typing status:", err)
      );
    }

    // Set timeout to mark user as stopped typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        setTyping(chatId, false).catch((err) =>
          console.error("Error clearing typing status:", err)
        );
      }
    }, 2000); // Stop typing after 2 seconds of inactivity
  };

  const renderMessageItem = ({
    item,
  }: {
    item: Message;
    index: number;
    section: MessageGroup;
  }) => {
    // System messages should not show sender name
    const isSystemMessage = item.type === "system";
    const isOwnMessage = item.senderId === user?.uid;

    const senderName =
      !isSystemMessage && chatType === "group" && !isOwnMessage
        ? senderNames[item.senderId] || "Unknown User"
        : undefined;

    // Show status only for the absolute last non-system message
    const isLatestMessage = !isSystemMessage && item.id === lastMessageId;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showSenderName={
          !isSystemMessage && chatType === "group" && !isOwnMessage
        }
        senderName={senderName}
        isLatestFromUser={isLatestMessage}
      />
    );
  };

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: MessageGroup;
  }) => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateSeparatorText}>{title}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.popToTop()} />
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{chatName}</Text>
            {chatType === "direct" && (
              <View
                style={[
                  styles.presenceIndicator,
                  { backgroundColor: getPresenceColor() },
                ]}
              />
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            {chatType === "group"
              ? `${chat?.participants?.length || 0} participants`
              : getHeaderSubtitle()}
          </Text>
        </View>
        {chatType === "group" && (
          <Appbar.Action icon="information" onPress={handleOpenGroupInfo} />
        )}
      </Appbar.Header>

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

      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Messages Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start the conversation by sending a message
          </Text>
        </View>
      ) : (
        <SectionList
          ref={flatListRef as any}
          sections={groupedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          renderSectionHeader={renderSectionHeader}
          inverted={false}
          scrollEnabled={true}
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          windowSize={10}
          contentContainerStyle={styles.messageListContent}
        />
      )}

      {/* Typing Indicator - Show between messages and input */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor={colorPalette.neutral[400]}
          value={messageText}
          onChangeText={handleTextInputChange}
          mode="outlined"
          multiline
          style={styles.input}
          editable={!sending}
          outlineColor={colorPalette.neutral[200]}
          activeOutlineColor={colorPalette.primary}
          outlineStyle={{ borderRadius: 12 }}
        />
        <View style={styles.sendButtonWrapper}>
          <IconButton
            icon={() => (
              <MaterialCommunityIcons
                name="send"
                size={26}
                color={
                  messageText.trim() && !sending
                    ? colorPalette.primary
                    : colorPalette.neutral[400]
                }
              />
            )}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
            loading={sending}
            size={48}
            style={styles.sendButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  presenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colorPalette.neutral[600],
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: colorPalette.neutral[600],
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 20,
  },
  messageListContent: {
    paddingVertical: 12,
  },
  dateSeparator: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: colorPalette.neutral[500],
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 0,
    paddingBottom: 8,
    backgroundColor: colorPalette.background,
    gap: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 12,
    fontSize: 16,
  },
  sendButtonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    height: 56,
    width: 56,
  },
  sendButton: {
    margin: 0,
    padding: 0,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
