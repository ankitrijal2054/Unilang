import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  TextInput as RNTextInput,
} from "react-native";
import {
  Appbar,
  Checkbox,
  TextInput,
  Button,
  Text,
  Snackbar,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { getAllUsers } from "../../services/userService";
import { createGroupChat } from "../../services/chatService";
import { User } from "../../types";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

interface NewGroupScreenProps {
  navigation: any;
  route: any;
}

type Step = "select_participants" | "group_name";

export const NewGroupScreen: React.FC<NewGroupScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuthStore();

  const [step, setStep] = useState<Step>("select_participants");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<RNTextInput>(null);
  const searchBorderAnim = useRef(new Animated.Value(0)).current;
  const searchScaleAnim = useRef(new Animated.Value(1)).current;

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const result = await getAllUsers();
        if (result.success && result.users) {
          // Filter out current user
          const otherUsers = result.users.filter((u) => u.uid !== user?.uid);
          setAllUsers(otherUsers);
        } else {
          setErrorMessage("Failed to load users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setErrorMessage("Error loading users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user?.uid]);

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

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

  const handleContinue = () => {
    if (selectedUserIds.size < 2) {
      Alert.alert("Error", "Please select at least 2 participants");
      return;
    }
    setStep("group_name");
  };

  // Filter users based on search query
  const filteredUsers = allUsers.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  });

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }

    if (!user?.uid) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setCreating(true);

    try {
      const participantArray = Array.from(selectedUserIds);
      const result = await createGroupChat(
        groupName.trim(),
        participantArray,
        user.uid
      );

      if (result.success && result.chatId) {
        // Navigate to the new group chat (use replace so back goes to ChatList)
        navigation.replace("Chat", {
          chatId: result.chatId,
          chatName: groupName.trim(),
          chatType: "group",
        });
      } else {
        Alert.alert("Error", "Failed to create group. Please try again.");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "An error occurred while creating the group");
    } finally {
      setCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isSelected = selectedUserIds.has(item.uid);

    // Get initials for avatar
    const initials = item.name
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
    ][item.uid.charCodeAt(0) % 4];

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.uid)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userAvatar}
        >
          <Text style={styles.userAvatarText}>{initials}</Text>
        </LinearGradient>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        {/* Checkbox */}
        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
          {isSelected && (
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={colorPalette.background}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={
              colorPalette.gradientBlueSoft as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingIconContainer}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={40}
              color={colorPalette.background}
            />
          </LinearGradient>
          <ActivityIndicator
            size="large"
            color={colorPalette.primary}
            style={{ marginTop: spacing.lg }}
          />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "select_participants") {
    return (
      <SafeAreaView style={styles.container}>
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
              <Text style={styles.headerTitle}>New Group</Text>
              <Text style={styles.headerSubtitle}>
                {selectedUserIds.size} participant
                {selectedUserIds.size !== 1 ? "s" : ""} selected
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Search Bar */}
        <View style={styles.searchContainer}>
          <Animated.View
            style={[
              styles.searchInputWrapper,
              {
                transform: [{ scale: searchScaleAnim }],
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
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
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

          {/* Search Results Count */}
          {searchQuery.length > 0 && (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultsText}>
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1 ? "result" : "results"} found
              </Text>
            </View>
          )}
        </View>

        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.userSeparator} />}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={
                  colorPalette.gradientPurpleSoft as [
                    string,
                    string,
                    ...string[]
                  ]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconContainer}
              >
                <MaterialCommunityIcons
                  name={searchQuery ? "account-search" : "account-off"}
                  size={48}
                  color={colorPalette.background}
                />
              </LinearGradient>
              <Text style={styles.emptyTitle}>
                {searchQuery ? "No Matches Found" : "No Users Found"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No users match "${searchQuery}". Try a different search.`
                  : "There are no other users available to add to the group."}
              </Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedUserIds.size < 2 && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={selectedUserIds.size < 2}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                selectedUserIds.size < 2
                  ? [colorPalette.neutral[300], colorPalette.neutral[300]]
                  : (colorPalette.gradientBlue as [string, string, ...string[]])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButtonGradient}
            >
              <Text style={styles.continueButtonText}>
                Continue ({selectedUserIds.size} selected)
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={colorPalette.background}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Snackbar
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage("")}
          duration={3000}
        >
          {errorMessage}
        </Snackbar>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep("select_participants")}
              disabled={creating}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colorPalette.neutral[950]}
              />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Group Name</Text>
              <Text style={styles.headerSubtitle}>
                {selectedUserIds.size + 1} member
                {selectedUserIds.size + 1 !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Group Icon Preview */}
          <View style={styles.groupPreviewContainer}>
            <LinearGradient
              colors={
                colorPalette.gradientPurple as [string, string, ...string[]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.groupIcon}
            >
              <MaterialCommunityIcons
                name="account-group"
                size={48}
                color={colorPalette.background}
              />
            </LinearGradient>
          </View>

          {/* Group Name Input Card */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Group Name</Text>
            <TextInput
              placeholder="Enter group name..."
              value={groupName}
              onChangeText={setGroupName}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              editable={!creating}
              autoFocus
              maxLength={50}
            />
          </View>

          {/* Members Summary Card */}
          <View style={styles.membersCard}>
            <View style={styles.membersCardHeader}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color={colorPalette.primary}
              />
              <Text style={styles.membersCardTitle}>
                Members ({selectedUserIds.size + 1})
              </Text>
            </View>

            {/* Current User */}
            <View style={styles.memberPreviewItem}>
              <LinearGradient
                colors={
                  colorPalette.gradientBlueSoft as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.memberPreviewAvatar}
              >
                <Text style={styles.memberPreviewAvatarText}>
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Text>
              </LinearGradient>
              <View style={styles.memberPreviewInfo}>
                <Text style={styles.memberPreviewName}>{user?.name}</Text>
                <Text style={styles.memberPreviewRole}>Admin</Text>
              </View>
            </View>

            {/* Selected Members */}
            {Array.from(selectedUserIds).map((userId) => {
              const member = allUsers.find((u) => u.uid === userId);
              if (!member) return null;

              const initials = member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const gradientColors = [
                colorPalette.gradientBlueSoft,
                colorPalette.gradientPurpleSoft,
                colorPalette.gradientPinkSoft,
                colorPalette.gradientCyanSoft,
              ][member.uid.charCodeAt(0) % 4];

              return (
                <View key={userId} style={styles.memberPreviewItem}>
                  <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.memberPreviewAvatar}
                  >
                    <Text style={styles.memberPreviewAvatarText}>
                      {initials}
                    </Text>
                  </LinearGradient>
                  <View style={styles.memberPreviewInfo}>
                    <Text style={styles.memberPreviewName}>{member.name}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Fixed Footer with Action Buttons */}
        <View style={styles.groupNameFooter}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep("select_participants")}
            disabled={creating}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createGroupButton,
              (!groupName.trim() || creating) &&
                styles.createGroupButtonDisabled,
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || creating}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !groupName.trim() || creating
                  ? [colorPalette.neutral[300], colorPalette.neutral[300]]
                  : (colorPalette.gradientBlue as [string, string, ...string[]])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createGroupButtonGradient}
            >
              {creating ? (
                <ActivityIndicator
                  size="small"
                  color={colorPalette.background}
                />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={colorPalette.background}
                  />
                  <Text style={styles.createGroupButtonText}>Create Group</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.backgroundSecondary,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.backgroundSecondary,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  groupPreviewContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  groupIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.large,
  },
  inputCard: {
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...colorPalette.shadows.medium,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colorPalette.backgroundSecondary,
    borderRadius: borderRadius.md,
    ...typography.body,
  },
  inputOutline: {
    borderRadius: borderRadius.md,
  },
  membersCard: {
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...colorPalette.shadows.medium,
  },
  membersCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  membersCardTitle: {
    ...typography.h4,
    color: colorPalette.neutral[950],
  },
  memberPreviewItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  memberPreviewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  memberPreviewAvatarText: {
    ...typography.bodyBold,
    color: colorPalette.background,
    fontSize: 16,
  },
  memberPreviewInfo: {
    flex: 1,
    gap: 2,
  },
  memberPreviewName: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  memberPreviewRole: {
    ...typography.small,
    color: colorPalette.primary,
  },
  groupNameFooter: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colorPalette.background,
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral[100],
    ...colorPalette.shadows.small,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colorPalette.neutral[100],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.base,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  createGroupButton: {
    flex: 2,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  createGroupButtonDisabled: {
    opacity: 0.6,
  },
  createGroupButtonGradient: {
    flexDirection: "row",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  createGroupButtonText: {
    ...typography.bodyBold,
    color: colorPalette.background,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colorPalette.background,
    gap: spacing.md,
  },
  userSeparator: {
    height: 1,
    backgroundColor: colorPalette.neutral[100],
    marginLeft: spacing.base + 56 + spacing.md,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  userAvatarText: {
    ...typography.h4,
    color: colorPalette.background,
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
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colorPalette.neutral[400],
    backgroundColor: colorPalette.background,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colorPalette.primary,
    borderColor: colorPalette.primary,
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
  footer: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    backgroundColor: colorPalette.background,
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral[100],
    ...colorPalette.shadows.small,
  },
  continueButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonGradient: {
    flexDirection: "row",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  continueButtonText: {
    ...typography.bodyBold,
    color: colorPalette.background,
    fontSize: 16,
  },
});
