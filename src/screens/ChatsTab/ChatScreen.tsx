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
import { Appbar, TextInput, IconButton, Text } from "react-native-paper";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToMessages,
  sendMessage,
  markMessagesAsRead,
} from "../../services/messageService";
import { updateChatLastMessage } from "../../services/chatService";
import { subscribeToUserPresence } from "../../services/userService";
import { Message, User, Chat } from "../../types";
import { MessageBubble } from "../../components/MessageBubble";
import { formatMessageDate, formatRelativeTime } from "../../utils/formatters";
import { db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "../../utils/constants";

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

  const flatListRef = useRef<SectionList>(null);
  const optimisticMessagesRef = useRef<Set<string>>(new Set());
  const senderNamesRef = useRef<{ [key: string]: string }>({});

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
              console.log("👤 Subscribing to presence for user:", otherUserId);
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
      console.log("🧹 Unsubscribing from presence");
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

    console.log("💬 Setting up message listener for chat:", chatId);

    const unsubscribe = subscribeToMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
      console.log("✅ Messages updated:", updatedMessages.length);
    });

    // Mark messages as read when opening chat
    markMessagesAsRead(chatId, user.uid).catch((err) => {
      console.error("Error marking messages as read:", err);
    });

    // Cleanup listener on unmount
    return () => {
      console.log("🧹 Unsubscribing from message listener");
      unsubscribe();
    };
  }, [chatId, user?.uid]);

  // Fetch sender names for group chat messages
  useEffect(() => {
    if (chatType !== "group" || messages.length === 0) {
      return;
    }

    const fetchSenderNames = async () => {
      const { getUserById } = await import("../../services/userService");

      for (const msg of messages) {
        if (!senderNamesRef.current[msg.senderId]) {
          try {
            const result = await getUserById(msg.senderId);
            if (result.success && result.user) {
              senderNamesRef.current[msg.senderId] = result.user.name;
            }
          } catch (error) {
            console.error("Error fetching sender name:", error);
          }
        }
      }
    };

    fetchSenderNames();
  }, [messages, chatType]);

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
    if (!messageText.trim() || !user?.uid || sending) {
      return;
    }

    const textToSend = messageText.trim();
    setMessageText("");
    setSending(true);

    try {
      // Create optimistic message
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        chatId,
        senderId: user.uid,
        text: textToSend,
        timestamp: new Date().toISOString(),
        status: "sending",
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
    } finally {
      setSending(false);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;
    const senderName =
      chatType === "group" && !isOwnMessage
        ? senderNamesRef.current[item.senderId] || "Unknown User"
        : undefined;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showSenderName={chatType === "group" && !isOwnMessage}
        senderName={senderName}
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
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

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          value={messageText}
          onChangeText={setMessageText}
          mode="flat"
          multiline
          style={styles.input}
          editable={!sending}
          dense
        />
        <IconButton
          icon="send"
          size={20}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || sending}
          loading={sending}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    fontWeight: "600",
    color: "#333",
  },
  presenceIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
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
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
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
    color: "#999",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
});
