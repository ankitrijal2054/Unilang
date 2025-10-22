import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Appbar, TextInput, Text, Avatar } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuthStore } from "../../store/authStore";
import {
  getAllUsers,
  subscribeToUserPresence,
} from "../../services/userService";
import { createDirectChat } from "../../services/chatService";
import { User } from "../../types";
import { colorPalette } from "../../utils/theme";
import { formatLastSeen } from "../../utils/formatters";

interface ContactsListScreenProps {
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
          {isOnline
            ? "Active now"
            : `Last seen ${formatLastSeen(
                user.lastSeen || new Date().toISOString()
              )}`}
        </Text>
      </View>

      {/* Arrow Icon */}
      {!isCurrentUser && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colorPalette.neutral[500]}
        />
      )}
    </TouchableOpacity>
  );
};

export const ContactsListScreen: React.FC<ContactsListScreenProps> = ({
  navigation,
}) => {
  const { user: currentUser } = useAuthStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all users and setup real-time listeners
  useEffect(() => {
    let unsubscribers: Array<() => void> = [];

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

          // Setup real-time listeners for each user's presence
          filteredUsers.forEach((user) => {
            const unsub = subscribeToUserPresence(user.uid, (updatedUser) => {
              if (updatedUser) {
                // Update the user in the list
                setAllUsers((prev) =>
                  prev
                    .map((u) => (u.uid === updatedUser.uid ? updatedUser : u))
                    .sort((a, b) => {
                      // Re-sort to move online users to top
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
        console.error("❌ Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      console.log("🧹 Cleaning up user presence listeners");
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
    // Navigate to contact card to show user profile
    navigation.navigate("ContactCard", {
      userId: selectedUser.uid,
    });
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <UserItem
      user={item}
      isCurrentUser={false}
      onPress={handleUserPress}
      loading={false} // No longer creating chat, so loading is false
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colorPalette.neutral[100], colorPalette.neutral[100]]}
          locations={[0, 1]}
          style={styles.headerGradient}
        >
          <BlurView intensity={50} tint="light" style={styles.headerBlur}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={28}
                    color={colorPalette.neutral[900]}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Contacts</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </BlurView>
        </LinearGradient>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by name or email..."
          placeholderTextColor={colorPalette.neutral[400]}
          value={searchText}
          onChangeText={setSearchText}
          mode="outlined"
          left={
            <TextInput.Icon icon="magnify" color={colorPalette.neutral[400]} />
          }
          style={styles.searchInput}
          editable={!loading}
          outlineColor={colorPalette.neutral[200]}
          activeOutlineColor={colorPalette.primary}
          outlineStyle={{ borderRadius: 12 }}
        />
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  header: {
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colorPalette.neutral[100],
    shadowColor: colorPalette.neutral[900],
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerBlur: {
    flex: 1,
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerLeft: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    width: 44,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  searchContainer: {
    padding: 12,
    backgroundColor: colorPalette.background,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[200],
  },
  searchInput: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 12,
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: colorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 20,
  },
  userItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[100],
    backgroundColor: colorPalette.background,
  },
  disabledItem: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    backgroundColor: colorPalette.primary,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colorPalette.success,
    borderWidth: 2,
    borderColor: colorPalette.background,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: colorPalette.neutral[600],
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 12,
  },
  onlineStatus: {
    color: colorPalette.success,
    fontWeight: "600",
  },
  offlineStatus: {
    color: colorPalette.neutral[500],
  },
  disabledText: {
    opacity: 0.5,
  },
});
