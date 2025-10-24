import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  TextInput as RNTextInput,
  Image,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../store/authStore";
import {
  getAllUsers,
  subscribeToUserPresence,
} from "../../services/userService";
import { createDirectChat } from "../../services/chatService";
import { User } from "../../types";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";
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

  // Get initials for avatar
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate gradient colors based on user ID
  const gradientColors = [
    colorPalette.gradientBlueSoft,
    colorPalette.gradientPurpleSoft,
    colorPalette.gradientPinkSoft,
    colorPalette.gradientCyanSoft,
  ][user.uid.charCodeAt(0) % 4];

  return (
    <TouchableOpacity
      onPress={() => !loading && onPress(user)}
      activeOpacity={0.7}
      disabled={isCurrentUser || loading}
      style={[styles.userItemContainer, isCurrentUser && styles.disabledItem]}
    >
      {/* Avatar with Gradient or Image */}
      <View style={styles.avatarContainer}>
        {user.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.userAvatar} />
        ) : (
          <LinearGradient
            colors={gradientColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.userAvatar}
          >
            <Text style={styles.userAvatarText}>{initials}</Text>
          </LinearGradient>
        )}
        {isOnline && !isCurrentUser && (
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineIndicatorInner} />
          </View>
        )}
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
        {!isCurrentUser && (
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOnline
                    ? colorPalette.success
                    : colorPalette.neutral[400],
                },
              ]}
            />
            <Text
              style={[
                styles.userStatus,
                isOnline ? styles.onlineStatus : styles.offlineStatus,
              ]}
            >
              {isOnline
                ? "Active now"
                : `Last seen ${formatLastSeen(
                    user.lastSeen || new Date().toISOString()
                  )}`}
            </Text>
          </View>
        )}
      </View>

      {/* Arrow Icon */}
      {!isCurrentUser && (
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colorPalette.neutral[400]}
          />
        </View>
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
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<RNTextInput>(null);
  const searchBorderAnim = useRef(new Animated.Value(0)).current;
  const searchScaleAnim = useRef(new Animated.Value(1)).current;

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

  const handleSearchFocus = () => {
    setSearchFocused(true);
    Animated.parallel([
      Animated.spring(searchBorderAnim, {
        toValue: 1,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(searchScaleAnim, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    Animated.parallel([
      Animated.spring(searchBorderAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }),
      Animated.spring(searchScaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();
  };

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
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colorPalette.neutral[950]}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Contacts</Text>
            <Text style={styles.headerSubtitle}>
              {allUsers.length} contact{allUsers.length !== 1 ? "s" : ""}{" "}
              available
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <Animated.View
          style={{
            transform: [{ scale: searchScaleAnim }],
          }}
        >
          <Animated.View
            style={[
              styles.searchInputWrapper,
              {
                borderWidth: 2,
                borderColor: searchBorderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["transparent", colorPalette.primary],
                }),
              },
            ]}
          >
            <View style={styles.searchIconContainer}>
              <LinearGradient
                colors={
                  searchFocused
                    ? (colorPalette.gradientBlue as [
                        string,
                        string,
                        ...string[]
                      ])
                    : [colorPalette.neutral[400], colorPalette.neutral[400]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.searchIconGradient}
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colorPalette.background}
                />
              </LinearGradient>
            </View>
            <RNTextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={colorPalette.neutral[500]}
              value={searchText}
              onChangeText={setSearchText}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchText("");
                  searchInputRef.current?.focus();
                }}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <View style={styles.clearButtonInner}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={colorPalette.neutral[600]}
                  />
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>

        {/* Search Results Count */}
        {searchText.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsText}>
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "result" : "results"} found
            </Text>
          </View>
        )}
      </View>

      {/* Users List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={
              colorPalette.gradientBlueSoft as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingIconContainer}
          >
            <MaterialCommunityIcons
              name="account-multiple"
              size={40}
              color={colorPalette.background}
            />
          </LinearGradient>
          <ActivityIndicator
            size="large"
            color={colorPalette.primary}
            style={{ marginTop: spacing.lg }}
          />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
          keyboardShouldPersistTaps="handled"
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
    backgroundColor: colorPalette.backgroundSecondary,
  },
  header: {
    height: 72,
    justifyContent: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colorPalette.background,
    ...colorPalette.shadows.small,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral[100],
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
  },
  headerSubtitle: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colorPalette.background,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.full,
    paddingLeft: spacing.xs,
    paddingRight: spacing.sm,
    height: 52,
    ...colorPalette.shadows.medium,
  },
  searchIconContainer: {
    marginRight: spacing.sm,
  },
  searchIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colorPalette.neutral[950],
    paddingVertical: 0,
    fontSize: 15,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  clearButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colorPalette.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  searchResultsContainer: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  searchResultsText: {
    ...typography.small,
    color: colorPalette.neutral[600],
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  loadingText: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...colorPalette.shadows.medium,
  },
  emptyTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    ...typography.body,
    color: colorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 22,
  },
  userItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colorPalette.background,
    gap: spacing.md,
  },
  disabledItem: {
    opacity: 0.5,
  },
  userSeparator: {
    height: 1,
    backgroundColor: colorPalette.neutral[100],
    marginLeft: spacing.base + 60 + spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  userAvatarText: {
    ...typography.h4,
    color: colorPalette.background,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colorPalette.background,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  onlineIndicatorInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colorPalette.success,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  userEmail: {
    ...typography.small,
    color: colorPalette.neutral[600],
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userStatus: {
    ...typography.small,
  },
  onlineStatus: {
    color: colorPalette.success,
    fontWeight: "500",
  },
  offlineStatus: {
    color: colorPalette.neutral[500],
  },
  disabledText: {
    opacity: 0.5,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
