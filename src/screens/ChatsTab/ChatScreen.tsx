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
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Appbar,
  TextInput,
  IconButton,
  Text,
  Snackbar,
  Modal,
  Portal,
  Button,
  Menu,
} from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AnimatedDots } from "../../components/AnimatedDots";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToMessages,
  sendMessage,
  sendImageMessage,
  markMessagesAsRead,
} from "../../services/messageService";
import { updateChatLastMessage } from "../../services/chatService";
import {
  subscribeToUserPresence,
  getUserById,
} from "../../services/userService";
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
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";
import {
  translateMessage,
  cacheTranslation,
  toggleTranslationVisibility,
} from "../../services/aiService";

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
  const [senderAvatars, setSenderAvatars] = useState<{ [key: string]: string }>(
    {}
  );
  const [isNetworkOnline, setIsNetworkOnline] = useState(true);
  const [typingUsers, setTypingUsers] = useState<
    Array<{ userId: string; userName: string }>
  >([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Translation state (Phase 3)
  const [translatingMessageId, setTranslatingMessageId] = useState<
    string | null
  >(null);
  const [slangModalVisible, setSlangModalVisible] = useState(false);
  const [slangExplanation, setSlangExplanation] = useState("");
  const [senderLanguages, setSenderLanguages] = useState<{
    [userId: string]: string;
  }>({});

  // Smart Replies state (Phase 3B)
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [smartRepliesVisible, setSmartRepliesVisible] = useState(false);
  const [loadingSmartReplies, setLoadingSmartReplies] = useState(false);

  // Tone Adjustment state (Phase 3C)
  const [toneMenuVisible, setToneMenuVisible] = useState(false);
  const [adjustingTone, setAdjustingTone] = useState(false);

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
          const rawData = chatDoc.data();

          // Convert deletionTimestamps from Firestore Timestamps to ISO strings
          const deletionTimestamps: { [key: string]: string } = {};
          if (rawData.deletionTimestamps) {
            Object.keys(rawData.deletionTimestamps).forEach((userId) => {
              const timestamp = rawData.deletionTimestamps[userId];
              // Convert Firestore Timestamp to ISO string
              deletionTimestamps[userId] =
                timestamp?.toDate?.()?.toISOString() || timestamp;
            });
          }

          const chatData: Chat = {
            ...rawData,
            deletionTimestamps,
          } as Chat;

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

                    // Cache preferred language for translation (Phase 3)
                    if (userData.preferred_language) {
                      setSenderLanguages((prev) => ({
                        ...prev,
                        [otherUserId]: userData.preferred_language,
                      }));
                    }
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

    // Get deletion timestamp for the current user (if chat was deleted)
    const deletionTimestamp = chat?.deletionTimestamps?.[user.uid];

    // Subscribe to Firestore for real-time updates
    const unsubscribe = subscribeToMessages(
      chatId,
      (updatedMessages) => {
        setMessages(updatedMessages); // React state - updates UI
        // Also update the persistent store
        useMessageStore.getState().setMessages(chatId, updatedMessages);
        setLoading(false);
      },
      deletionTimestamp // Pass deletion timestamp to filter old messages
    );

    // Mark messages as read when opening chat
    markMessagesAsRead(chatId, user.uid).catch((err) => {
      console.error("Error marking messages as read:", err);
    });

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [chatId, user?.uid, chat?.deletionTimestamps]);

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
                [participantId]: result.user!.name,
              };
            });

            // Also store avatar URL if available
            if (result.user.avatarUrl) {
              setSenderAvatars((prev) => ({
                ...prev,
                [participantId]: result.user!.avatarUrl!,
              }));
            }

            // Cache preferred language for translation (Phase 3)
            if (result.user?.preferred_language) {
              setSenderLanguages((prev) => ({
                ...prev,
                [participantId]: result.user!.preferred_language,
              }));
            }
          } else {
            setSenderNames((prev) => ({
              ...prev,
              [participantId]: "Unknown User",
            }));
          }
        } catch (error) {
          console.error(
            `Error fetching sender info for ${participantId}:`,
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

  const handlePickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "We need access to your photos to send images."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  // ================== TRANSLATION HANDLERS (Phase 3) ==================

  /**
   * Handle translate button tap
   * If translation exists, toggle visibility; otherwise fetch new translation
   */
  const handleTranslate = async (messageId: string) => {
    try {
      setTranslatingMessageId(messageId);

      const message = messages.find((m) => m.id === messageId);
      if (!message) return;

      // Check if translation already exists
      if (message.translation) {
        // Just toggle visibility
        const newVisibility = !message.translationVisible;
        await toggleTranslationVisibility(messageId, newVisibility);
        return;
      }

      // Get sender's preferred language
      let sourceLang = senderLanguages[message.senderId];
      if (!sourceLang) {
        const senderData = await getUserById(message.senderId);
        sourceLang = senderData.user?.preferred_language || "en";
        setSenderLanguages((prev) => ({
          ...prev,
          [message.senderId]: sourceLang,
        }));
      }

      // Get receiver's (current user's) preferred language
      const targetLang = user?.preferred_language || "en";

      // Skip translation if same language
      if (sourceLang === targetLang) {
        Alert.alert(
          "Translation not needed",
          "This message is already in your language."
        );
        return;
      }

      // Call N8N translation API
      const result = await translateMessage(
        message.text,
        targetLang,
        sourceLang
      );

      // Cache translation in Firestore
      await cacheTranslation(messageId, result);
    } catch (error: any) {
      console.error("[ChatScreen] Translation error:", error);
      Alert.alert(
        "Translation Error",
        error.message || "Could not translate message. Please try again."
      );
    } finally {
      setTranslatingMessageId(null);
    }
  };

  /**
   * Handle slang info button tap
   */
  const handleSlangInfo = (explanation: string) => {
    setSlangExplanation(explanation);
    setSlangModalVisible(true);
  };

  // ================== END TRANSLATION HANDLERS ==================

  // ================== SMART REPLIES AUTO-HIDE LOGIC (Phase 3B) ==================

  // Auto-hide smart replies after 10 seconds
  useEffect(() => {
    if (smartRepliesVisible) {
      const timer = setTimeout(() => {
        setSmartRepliesVisible(false);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, [smartRepliesVisible]);

  // Hide smart replies when user starts typing
  useEffect(() => {
    if (messageText.length > 0 && smartRepliesVisible) {
      setSmartRepliesVisible(false);
    }
  }, [messageText]);

  // ================== SMART REPLIES HANDLERS (Phase 3B) ==================

  /**
   * Generate smart reply suggestions based on conversation history
   */
  const handleGenerateSmartReplies = async () => {
    try {
      setLoadingSmartReplies(true);

      // Get last 8 messages for context
      const recentMessages = messages.slice(-8).map((msg) => ({
        sender:
          msg.senderId === user?.uid
            ? "You"
            : senderNames[msg.senderId] || "Other",
        text: msg.text,
      }));

      // Call N8N API
      const { generateSmartReplies } = await import("../../services/aiService");
      const replies = await generateSmartReplies(
        recentMessages,
        user?.preferred_language || "en"
      );

      setSmartReplies(replies);
      setSmartRepliesVisible(true);
    } catch (error: any) {
      console.error("[ChatScreen] Smart replies error:", error);
      Alert.alert(
        "Smart Replies Error",
        error.message || "Could not generate suggestions. Please try again."
      );
    } finally {
      setLoadingSmartReplies(false);
    }
  };

  /**
   * Insert a smart reply into the input
   */
  const handleSelectSmartReply = (reply: string) => {
    setMessageText(reply);
    setSmartRepliesVisible(false);
  };

  /**
   * Hide smart replies manually
   */
  const handleHideSmartReplies = () => {
    setSmartRepliesVisible(false);
  };

  // ================== END SMART REPLIES HANDLERS ==================

  // ================== TONE ADJUSTMENT HANDLERS (Phase 3C) ==================

  /**
   * Adjust message tone (formal/neutral/casual)
   */
  const handleAdjustTone = async (tone: "formal" | "neutral" | "casual") => {
    if (!messageText.trim()) return;

    try {
      setAdjustingTone(true);
      setToneMenuVisible(false);

      // Call N8N API
      const { adjustTone } = await import("../../services/aiService");
      const adjustedText = await adjustTone(messageText.trim(), tone);

      // Replace message text with adjusted version
      setMessageText(adjustedText);
    } catch (error: any) {
      console.error("[ChatScreen] Tone adjustment error:", error);
      Alert.alert(
        "Tone Adjustment Error",
        error.message || "Could not adjust tone. Please try again."
      );
    } finally {
      setAdjustingTone(false);
    }
  };

  // ================== END TONE ADJUSTMENT HANDLERS ==================

  const handleSendImageMessage = async () => {
    if (!selectedImage || !user?.uid) {
      return;
    }

    const caption = messageText.trim();
    const imageUri = selectedImage;

    // Clear inputs
    setMessageText("");
    setSelectedImage(null);
    setUploadingImage(true);

    try {
      const result = await sendImageMessage(
        chatId,
        imageUri,
        user.uid,
        caption
      );

      if (result.success) {
        console.log("✅ Image message sent:", result.messageId);

        // Update chat's last message
        await updateChatLastMessage(chatId, "📷 Image").catch((err) => {
          console.error("Error updating chat last message:", err);
        });
      } else {
        console.error("❌ Failed to send image:", result.error);
        Alert.alert("Error", "Failed to send image. Please try again.");
        setSelectedImage(imageUri); // Restore image for retry
        setMessageText(caption); // Restore caption
      }
    } catch (error) {
      console.error("❌ Error sending image:", error);
      Alert.alert("Error", "Failed to send image. Please try again.");
      setSelectedImage(imageUri); // Restore image for retry
      setMessageText(caption); // Restore caption
    } finally {
      setUploadingImage(false);
    }
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

    const senderAvatarUrl =
      !isSystemMessage && chatType === "group" && !isOwnMessage
        ? senderAvatars[item.senderId]
        : undefined;

    // Show status only for the absolute last non-system message
    const isLatestMessage = !isSystemMessage && item.id === lastMessageId;

    // Get sender's preferred language (for translation button logic)
    const senderPreferredLang = senderLanguages[item.senderId];
    const receiverPreferredLang = user?.preferred_language;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showSenderName={
          !isSystemMessage && chatType === "group" && !isOwnMessage
        }
        senderName={senderName}
        senderAvatarUrl={senderAvatarUrl}
        isLatestFromUser={isLatestMessage}
        chatType={chatType}
        // Translation props (Phase 3)
        onTranslate={handleTranslate}
        senderPreferredLang={senderPreferredLang}
        receiverPreferredLang={receiverPreferredLang}
        isTranslating={translatingMessageId === item.id}
        onSlangInfo={handleSlangInfo}
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

      {/* Smart Replies Section (Phase 3B) */}
      {!smartRepliesVisible &&
        messages.length > 0 &&
        messages[messages.length - 1]?.senderId !== user?.uid && (
          <View style={styles.smartRepliesButtonContainer}>
            <TouchableOpacity
              style={styles.smartRepliesButton}
              onPress={handleGenerateSmartReplies}
              disabled={loadingSmartReplies}
            >
              {loadingSmartReplies ? (
                <AnimatedDots size={5} />
              ) : (
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={18}
                  color={colorPalette.primary}
                />
              )}
            </TouchableOpacity>
          </View>
        )}

      {/* Smart Reply Chips */}
      {smartRepliesVisible && smartReplies.length > 0 && (
        <View style={styles.smartRepliesContainer}>
          <View style={styles.smartRepliesHeader}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={18}
              color={colorPalette.primary}
            />
            <Text style={styles.smartRepliesHeaderText}>Smart Replies</Text>
            <TouchableOpacity onPress={handleHideSmartReplies}>
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={colorPalette.neutral[500]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.smartRepliesChips}>
            {smartReplies.map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.smartReplyChip}
                onPress={() => handleSelectSmartReply(reply)}
              >
                <Text style={styles.smartReplyChipText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Image Preview (if selected) */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <View style={styles.imagePreviewWrapper}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.imagePreview}
            />
            <TouchableOpacity
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
          {uploadingImage && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={colorPalette.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      )}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        {/* Tone Menu Button (Phase 3C) */}
        <Menu
          visible={toneMenuVisible}
          onDismiss={() => setToneMenuVisible(false)}
          contentStyle={styles.toneMenu}
          anchor={
            <IconButton
              icon={() => (
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={26}
                  color={
                    adjustingTone
                      ? colorPalette.primary
                      : messageText.trim()
                      ? colorPalette.primary
                      : colorPalette.neutral[400]
                  }
                />
              )}
              onPress={() => setToneMenuVisible(true)}
              disabled={
                !messageText.trim() ||
                sending ||
                uploadingImage ||
                adjustingTone
              }
              size={36}
              style={styles.toneButton}
            />
          }
        >
          <Menu.Item
            onPress={() => handleAdjustTone("formal")}
            title="Formal"
            leadingIcon="briefcase"
            titleStyle={styles.toneMenuItem}
            style={styles.toneMenuItemStyle}
          />
          <Menu.Item
            onPress={() => handleAdjustTone("neutral")}
            title="Neutral"
            leadingIcon="emoticon-neutral"
            titleStyle={styles.toneMenuItem}
            style={styles.toneMenuItemStyle}
          />
          <Menu.Item
            onPress={() => handleAdjustTone("casual")}
            title="Casual"
            leadingIcon="sunglasses"
            titleStyle={styles.toneMenuItem}
            style={styles.toneMenuItemStyle}
          />
        </Menu>

        {/* Attachment Button */}
        <IconButton
          icon={() => (
            <MaterialCommunityIcons
              name="paperclip"
              size={26}
              color={colorPalette.neutral[600]}
            />
          )}
          onPress={handlePickImage}
          disabled={sending || uploadingImage}
          size={36}
          style={styles.attachButton}
        />

        <View style={styles.inputWrapper}>
          <TextInput
            placeholder={
              adjustingTone
                ? "Adjusting tone..."
                : selectedImage
                ? "Add a caption..."
                : "Type a message..."
            }
            placeholderTextColor={colorPalette.neutral[400]}
            value={messageText}
            onChangeText={handleTextInputChange}
            mode="outlined"
            multiline
            style={styles.input}
            editable={!sending && !uploadingImage && !adjustingTone}
            outlineColor={colorPalette.neutral[200]}
            activeOutlineColor={colorPalette.primary}
            outlineStyle={{ borderRadius: 12 }}
          />

          {/* Tone Adjustment Loading Overlay */}
          {adjustingTone && (
            <View style={styles.toneAdjustOverlay}>
              <View style={styles.toneAdjustContent}>
                <AnimatedDots />
              </View>
            </View>
          )}
        </View>

        <View style={styles.sendButtonWrapper}>
          <IconButton
            icon={() => (
              <MaterialCommunityIcons
                name="send"
                size={26}
                color={
                  (messageText.trim() || selectedImage) &&
                  !sending &&
                  !uploadingImage
                    ? colorPalette.primary
                    : colorPalette.neutral[400]
                }
              />
            )}
            onPress={selectedImage ? handleSendImageMessage : handleSendMessage}
            disabled={
              (!messageText.trim() && !selectedImage) ||
              sending ||
              uploadingImage
            }
            loading={sending || uploadingImage}
            size={40}
            style={styles.sendButton}
          />
        </View>
      </View>

      {/* Slang Explanation Modal (Phase 3) */}
      <Portal>
        <Modal
          visible={slangModalVisible}
          onDismiss={() => setSlangModalVisible(false)}
          contentContainerStyle={styles.slangModal}
        >
          <View style={styles.slangModalContent}>
            {/* Icon Header */}
            <LinearGradient
              colors={
                colorPalette.gradientOrange as [string, string, ...string[]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.slangModalIcon}
            >
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={32}
                color="#FFFFFF"
              />
            </LinearGradient>

            {/* Title 
            <Text style={styles.slangModalTitle}>Cultural Context</Text> */}

            {/* Explanation Text */}
            <View style={styles.slangModalTextContainer}>
              <Text style={styles.slangModalText}>{slangExplanation}</Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setSlangModalVisible(false)}
              style={styles.slangModalCloseButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  colorPalette.gradientBlue as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.slangModalCloseGradient}
              >
                <Text style={styles.slangModalCloseText}>Got it!</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
  },
  gradient: {
    flex: 1,
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
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colorPalette.background,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral[150],
    ...colorPalette.shadows.small,
  },
  toneButton: {
    margin: 0,
    marginRight: -4,
    padding: 0,
  },
  toneMenu: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
    minWidth: 170,
    ...colorPalette.shadows.large,
  },
  toneMenuItemStyle: {
    minHeight: 48,
    height: 48,
    paddingVertical: 0,
    paddingHorizontal: spacing.base,
  },
  toneMenuItem: {
    ...typography.bodyMedium,
    color: colorPalette.neutral[900],
  },
  attachButton: {
    margin: 0,
    marginRight: -4,
    padding: 0,
  },
  inputWrapper: {
    flex: 1,
    position: "relative",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colorPalette.neutral[100],
    borderRadius: borderRadius.lg,
    ...typography.body,
  },
  sendButtonWrapper: {
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    width: 48,
    borderRadius: 24,
    ...colorPalette.shadows.small,
  },
  // Tone Adjustment Overlay Styles
  toneAdjustOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  toneAdjustContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.md,
    ...colorPalette.shadows.medium,
  },
  sendButton: {
    margin: 0,
    padding: 0,
  },
  imagePreviewContainer: {
    padding: 12,
    backgroundColor: colorPalette.background,
  },
  imagePreviewWrapper: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 100,
    height: 100,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  uploadingText: {
    marginTop: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
  // ========== Slang Modal Styles (Phase 3) ==========
  slangModal: {
    backgroundColor: "transparent",
    margin: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  slangModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.xxl,
    padding: spacing.xxxl,
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
    ...colorPalette.shadows.large,
  },
  slangModalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...colorPalette.shadows.medium,
  },
  slangModalTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  slangModalTextContainer: {
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    width: "100%",
  },
  slangModalText: {
    ...typography.body,
    lineHeight: 24,
    color: colorPalette.neutral[800],
    textAlign: "center",
  },
  slangModalCloseButton: {
    width: "100%",
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  slangModalCloseGradient: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xxxl,
    alignItems: "center",
    justifyContent: "center",
  },
  slangModalCloseText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  // ========== Smart Replies Styles (Phase 3B) ==========
  smartRepliesButtonContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  smartRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colorPalette.semantic.smartReply,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colorPalette.primary + "30",
    ...colorPalette.shadows.medium,
  },
  smartRepliesButtonText: {
    ...typography.captionMedium,
    color: colorPalette.primary,
    fontWeight: "700",
  },
  smartRepliesContainer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colorPalette.semantic.smartReply,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colorPalette.primary + "20",
    ...colorPalette.shadows.small,
  },
  smartRepliesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  smartRepliesHeaderText: {
    flex: 1,
    ...typography.bodyBold,
    color: colorPalette.primary,
  },
  smartRepliesChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  smartReplyChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colorPalette.primary + "30",
    maxWidth: "100%",
    ...colorPalette.shadows.small,
  },
  smartReplyChipText: {
    ...typography.bodyMedium,
    color: colorPalette.neutral[900],
  },
});
