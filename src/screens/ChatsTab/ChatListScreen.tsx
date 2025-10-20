import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Appbar, Button, Text } from "react-native-paper";
import { useAuthStore } from "../../store/authStore";
import { subscribeToUserChats } from "../../services/chatService";
import { Chat } from "../../types";
import { ChatListItem } from "../../components/ChatListItem";

interface ChatListScreenProps {
  navigation: any;
}

export const ChatListScreen: React.FC<ChatListScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subscribe to real-time chat updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log("📋 Setting up chat listener for user:", user.uid);

    const unsubscribe = subscribeToUserChats(user.uid, (updatedChats) => {
      setChats(updatedChats);
      setLoading(false);
      setRefreshing(false);
      console.log("✅ Chats updated:", updatedChats.length);
    });

    // Cleanup listener on unmount
    return () => {
      console.log("🧹 Unsubscribing from chat listener");
      unsubscribe();
    };
  }, [user?.uid]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Real-time listener will handle refresh
  };

  const handleChatPress = (chat: Chat) => {
    if (chat.isDeleted) {
      return; // Prevent navigation to deleted chats
    }

    const chatName =
      chat.type === "group" && chat.name
        ? chat.name
        : chat.type === "direct"
        ? "Direct Chat"
        : "Group Chat";

    navigation.navigate("Chat", {
      chatId: chat.id,
      chatName,
      chatType: chat.type,
    });
  };

  const handleNewChat = () => {
    navigation.getParent().navigate("ContactsTab");
  };

  const renderChatItem = ({ item }: { item: Chat }) => (
    <ChatListItem
      chat={item}
      onPress={() => handleChatPress(item)}
      unreadCount={0}
      isOnline={false}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by tapping the button below
      </Text>
      <Button
        mode="contained"
        onPress={handleNewChat}
        style={styles.emptyButton}
      >
        Start Chatting
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.Content title="Unilang" subtitle="Messages" />
        <Appbar.Action icon="plus" onPress={handleNewChat} />
      </Appbar.Header>

      {/* Loading state */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : chats.length === 0 ? (
        renderEmpty()
      ) : (
        /* Chat List */
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2196F3"
            />
          }
          scrollEnabled={true}
          removeClippedSubviews={true}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
});
