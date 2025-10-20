import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Appbar, TextInput, Text, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { getAllUsers } from "../../services/userService";
import { createDirectChat } from "../../services/chatService";
import { User } from "../../types";

interface NewChatScreenProps {
  navigation: any;
}

interface UserItemProps {
  user: User;
  isCurrentUser: boolean;
  onPress: (user: User) => void;
  loading: boolean;
}

/**
 * UserItem Component - Display individual user in list
 */
const UserItem: React.FC<UserItemProps> = ({
  user,
  isCurrentUser,
  onPress,
  loading,
}) => {
  const isOnline = user.status === "online";

  return (
    <TouchableOpacity
      onPress={() => !loading && onPress(user)}
      activeOpacity={0.7}
      disabled={isCurrentUser || loading}
      style={[styles.userItemContainer, isCurrentUser && styles.disabledItem]}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <Avatar.Icon size={48} icon="account" style={styles.avatar} />
        {isOnline && !isCurrentUser && <View style={styles.onlineIndicator} />}
      </View>

      {/* User Info */}
      <View style={styles.userInfo}>
        <Text
          style={[styles.userName, isCurrentUser && styles.disabledText]}
          numberOfLines={1}
        >
          {user.name}
          {isCurrentUser && " (You)"}
        </Text>
        <Text
          style={[styles.userEmail, isCurrentUser && styles.disabledText]}
          numberOfLines={1}
        >
          {user.email}
        </Text>
        <Text
          style={[
            styles.userStatus,
            isOnline ? styles.onlineStatus : styles.offlineStatus,
            isCurrentUser && styles.disabledText,
          ]}
        >
          {isOnline ? "Active now" : `Last seen ${user.lastSeen || "recently"}`}
        </Text>
      </View>

      {/* Arrow Icon */}
      {!isCurrentUser && (
        <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
      )}
    </TouchableOpacity>
  );
};

export const NewChatScreen: React.FC<NewChatScreenProps> = ({ navigation }) => {
  const { user: currentUser } = useAuthStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [creatingChat, setCreatingChat] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Guard: only fetch if we have current user
        if (!currentUser?.uid) {
          setAllUsers([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const result = await getAllUsers();

        if (result.success && result.users) {
          // Filter out current user and sort by online status
          const filteredUsers = result.users
            .filter((u) => u.uid !== currentUser.uid) // Exclude self
            .sort((a, b) => {
              // Online users first
              if (a.status === "online" && b.status !== "online") return -1;
              if (a.status !== "online" && b.status === "online") return 1;
              // Then by name
              return a.name.localeCompare(b.name);
            });

          setAllUsers(filteredUsers);
          console.log("✅ Users fetched:", filteredUsers.length);
        }
      } catch (error) {
        console.error("❌ Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser?.uid]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) {
      return allUsers;
    }

    const searchLower = searchText.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
    );
  }, [allUsers, searchText]);

  const handleUserPress = async (selectedUser: User) => {
    if (creatingChat) return;

    try {
      setCreatingChat(true);
      console.log("💬 Creating chat with:", selectedUser.name);

      const result = await createDirectChat(currentUser!.uid, selectedUser.uid);

      if (result.success && result.chatId) {
        console.log("✅ Chat created:", result.chatId);

        // Navigate to ChatScreen
        navigation.navigate("Chat", {
          chatId: result.chatId,
          chatName: selectedUser.name,
          chatType: "direct",
        });
      } else {
        console.error("❌ Failed to create chat:", result.error);
      }
    } catch (error) {
      console.error("❌ Error creating chat:", error);
    } finally {
      setCreatingChat(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <UserItem
      user={item}
      isCurrentUser={false}
      onPress={handleUserPress}
      loading={creatingChat}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-search-outline"
        size={64}
        color="#ccc"
      />
      <Text style={styles.emptyTitle}>No Users Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchText
          ? "Try searching with a different name or email"
          : "No other users available yet"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="New Chat" subtitle="Select a contact" />
      </Appbar.Header>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by name or email..."
          value={searchText}
          onChangeText={setSearchText}
          mode="outlined"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          editable={!loading && !creatingChat}
          dense
        />
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={renderEmpty}
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
  searchContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    backgroundColor: "#f9f9f9",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  userItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  disabledItem: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    backgroundColor: "#e3f2fd",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  userStatus: {
    fontSize: 11,
  },
  onlineStatus: {
    color: "#4caf50",
    fontWeight: "500",
  },
  offlineStatus: {
    color: "#999",
  },
  disabledText: {
    color: "#999",
  },
});
