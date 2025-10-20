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
import { Message } from "../../types";
import { MessageBubble } from "../../components/MessageBubble";
import { formatMessageDate } from "../../utils/formatters";

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

  const flatListRef = useRef<FlatList>(null);
  const optimisticMessagesRef = useRef<Set<string>>(new Set());

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

      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

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

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

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

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showSenderName={chatType === "group" && !isOwnMessage}
        senderName="User"
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
        <Appbar.Content
          title={chatName}
          subtitle={chatType === "group" ? "Group" : "Direct Message"}
        />
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
