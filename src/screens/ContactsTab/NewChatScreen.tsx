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
import {
  getAllUsers,
  subscribeToUserPresence,
} from "../../services/userService";
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
      <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );
};

export const NewChatScreen: React.FC<NewChatScreenProps> = ({ navigation }) => {
  const { user: currentUser } = useAuthStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Fetch all users and setup real-time listeners
  useEffect(() => {
    let unsubscribers: Array<() => void> = [];

    const fetchUsers = async () => {
      try {
        if (!currentUser?.uid) {
          setAllUsers([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        const result = await getAllUsers();

        if (result.success && result.users) {
          const filteredUsers = result.users
            .filter((u) => u.uid !== currentUser.uid)
            .sort((a, b) => {
              if (a.status === "online" && b.status !== "online") return -1;
              if (a.status !== "online" && b.status === "online") return 1;
              return a.name.localeCompare(b.name);
            });

          setAllUsers(filteredUsers);

          filteredUsers.forEach((user) => {
            const unsub = subscribeToUserPresence(user.uid, (updatedUser) => {
              if (updatedUser) {
                setAllUsers((prev) =>
                  prev
                    .map((u) => (u.uid === updatedUser.uid ? updatedUser : u))
                    .sort((a, b) => {
                      if (a.status === "online" && b.status !== "online")
                        return -1;
                      if (a.status !== "online" && b.status === "online")
                        return 1;
                      return a.name.localeCompare(b.name);
                    })
                );
              }
            });
            unsubscribers.push(unsub);
          });
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
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
    // Directly create and open chat with selected user
    if (creating) return;

    try {
      setCreating(true);
      const result = await createDirectChat(currentUser!.uid, selectedUser.uid);

      if (result.success && result.chatId) {
        navigation.navigate("Chat", {
          chatId: result.chatId,
          chatName: selectedUser.name,
          chatType: "direct",
        });
      }
    } catch (error) {
      console.error("Error creating chat:", error);
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <UserItem
      user={item}
      isCurrentUser={false}
      onPress={handleUserPress}
      loading={creating}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Users Found</Text>
      <Text style={styles.emptySubtitle}>Start a new conversation</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.navigate("ChatList")} />
        <Appbar.Content title="New Chat" subtitle="Select a user" />
      </Appbar.Header>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search users..."
          value={searchText}
          onChangeText={setSearchText}
          mode="flat"
          left={<TextInput.Icon icon="magnify" />}
          style={styles.searchInput}
          editable={!loading && !creating}
          dense
        />
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
  },
  userItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  disabledItem: {
    opacity: 0.5,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    backgroundColor: "#2196F3",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
  },
  onlineStatus: {
    color: "#4CAF50",
    fontWeight: "500",
  },
  offlineStatus: {
    color: "#999",
  },
  disabledText: {
    opacity: 0.5,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
