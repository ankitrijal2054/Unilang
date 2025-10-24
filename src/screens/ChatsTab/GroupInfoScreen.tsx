import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  Appbar,
  Text,
  Button,
  TextInput,
  Divider,
  Avatar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../store/authStore";
import { updateChat } from "../../services/chatService";
import { getAllUsers } from "../../services/userService";
import { Chat, User } from "../../types";
import { db } from "../../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import { COLLECTIONS } from "../../utils/constants";
import { createSystemMessage } from "../../services/messageService";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

interface GroupInfoScreenProps {
  navigation: any;
  route: any;
}

export const GroupInfoScreen: React.FC<GroupInfoScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuthStore();
  const { chatId } = route.params;

  const [chat, setChat] = useState<Chat | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(
    new Set()
  );
  const [membersExpanded, setMembersExpanded] = useState(false);

  const isAdmin = user?.uid === chat?.adminId;

  // Limit visible members when collapsed
  const MAX_VISIBLE_MEMBERS = 5;
  const visibleMembers = membersExpanded
    ? members
    : members.slice(0, MAX_VISIBLE_MEMBERS);
  const hasMoreMembers = members.length > MAX_VISIBLE_MEMBERS;

  // Fetch chat and member details
  useEffect(() => {
    const fetchChatAndMembers = async () => {
      try {
        // Fetch chat data
        const chatDoc = await getDoc(doc(db, COLLECTIONS.CHATS, chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data() as Chat;
          setChat(chatData);
          setNewName(chatData.name || "");

          // Fetch user details for all participants
          const result = await getAllUsers();
          if (result.success && result.users) {
            const chatMembers = result.users.filter((u) =>
              chatData.participants.includes(u.uid)
            );
            setMembers(chatMembers);
          }
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
        Alert.alert("Error", "Failed to load group info");
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchChatAndMembers();
    }
  }, [chatId]);

  const handleUpdateGroupName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Group name cannot be empty");
      return;
    }

    if (newName.trim() === chat?.name) {
      setEditingName(false);
      return;
    }

    setUpdating(true);
    try {
      const result = await updateChat(chatId, { name: newName.trim() });
      if (result.success) {
        setChat((prev) => (prev ? { ...prev, name: newName.trim() } : null));
        setEditingName(false);
        Alert.alert("Success", "Group name updated");
      } else {
        Alert.alert("Error", "Failed to update group name");
      }
    } catch (error) {
      console.error("Error updating group name:", error);
      Alert.alert("Error", "An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (memberId === user?.uid && isAdmin) {
      Alert.alert("Error", "Admin cannot remove themselves");
      return;
    }

    Alert.alert("Remove Member", `Remove ${memberName} from group?`, [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Remove",
        onPress: async () => {
          setUpdating(true);
          try {
            const newParticipants = chat?.participants.filter(
              (id) => id !== memberId
            );
            const result = await updateChat(chatId, {
              participants: newParticipants,
            });

            if (result.success) {
              setChat((prev) =>
                prev ? { ...prev, participants: newParticipants! } : null
              );
              setMembers((prev) => prev.filter((m) => m.uid !== memberId));

              // Create system message
              await createSystemMessage(
                chatId,
                `${memberName} was removed from the group`
              );

              Alert.alert("Success", `${memberName} has been removed`);
            } else {
              Alert.alert("Error", "Failed to remove member");
            }
          } catch (error) {
            console.error("Error removing member:", error);
            Alert.alert("Error", "An error occurred");
          } finally {
            setUpdating(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleLeaveGroup = () => {
    Alert.alert("Leave Group", "Are you sure you want to leave this group?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Leave",
        onPress: async () => {
          setUpdating(true);
          try {
            const newParticipants = chat?.participants.filter(
              (id) => id !== user?.uid
            );
            const result = await updateChat(chatId, {
              participants: newParticipants,
            });

            if (result.success) {
              // Create system message
              await createSystemMessage(chatId, `${user?.name} left the group`);

              Alert.alert("Success", "You have left the group");
              navigation.navigate("ChatList");
            } else {
              Alert.alert("Error", "Failed to leave group");
            }
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "An error occurred");
          } finally {
            setUpdating(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Delete Group",
      "Are you sure? This will delete the group for everyone.",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            setUpdating(true);
            try {
              const result = await updateChat(chatId, { isDeleted: true });

              if (result.success) {
                Alert.alert("Success", "Group has been deleted");
                navigation.navigate("ChatList");
              } else {
                Alert.alert("Error", "Failed to delete group");
              }
            } catch (error) {
              console.error("Error deleting group:", error);
              Alert.alert("Error", "An error occurred");
            } finally {
              setUpdating(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddMembers = async () => {
    try {
      const result = await getAllUsers();
      if (result.success && result.users) {
        // Filter out users already in the group
        const nonMembers = result.users.filter(
          (u) => !chat?.participants.includes(u.uid)
        );
        setAllUsers(nonMembers);
        setSelectedNewMembers(new Set());
        setShowAddMembers(true);
      } else {
        Alert.alert("Error", "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      Alert.alert("Error", "An error occurred");
    }
  };

  const handleConfirmAddMembers = async () => {
    if (selectedNewMembers.size === 0) {
      Alert.alert("Error", "Please select at least one member to add");
      return;
    }

    setUpdating(true);
    try {
      const newParticipants = [
        ...(chat?.participants || []),
        ...Array.from(selectedNewMembers),
      ];
      const result = await updateChat(chatId, {
        participants: newParticipants,
      });

      if (result.success) {
        setChat((prev) =>
          prev ? { ...prev, participants: newParticipants } : null
        );
        const addedMembers = allUsers.filter((u) =>
          selectedNewMembers.has(u.uid)
        );
        const names = addedMembers.map((m) => m.name).join(", ");
        Alert.alert("Success", `Added: ${names}`);
        setShowAddMembers(false);
        setSelectedNewMembers(new Set());

        // Create system message
        await createSystemMessage(
          chatId,
          `${names} ${
            addedMembers.length > 1 ? "were" : "was"
          } added to the group`
        );

        // Refresh members list
        const result2 = await getAllUsers();
        if (result2.success && result2.users) {
          const chatMembers = result2.users.filter((u) =>
            newParticipants.includes(u.uid)
          );
          setMembers(chatMembers);
        }
      } else {
        Alert.alert("Error", "Failed to add members");
      }
    } catch (error) {
      console.error("Error adding members:", error);
      Alert.alert("Error", "An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  const toggleNewMemberSelection = (userId: string) => {
    const newSelected = new Set(selectedNewMembers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedNewMembers(newSelected);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <LinearGradient
            colors={
              [colorPalette.neutral[100], colorPalette.neutral[100]] as [
                string,
                string,
                ...string[]
              ]
            }
            locations={[0, 1]}
            style={styles.headerGradient}
          >
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
                <Text style={styles.headerTitle}>Group Info</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </LinearGradient>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary} />
          <Text style={styles.loadingText}>Loading group info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderMemberItem = ({ item }: { item: User }) => {
    const isMemberAdmin = item.uid === chat?.adminId;
    const isCurrentUser = item.uid === user?.uid;
    const isCurrentUserAdmin = user?.uid === chat?.adminId;

    return (
      <View style={styles.memberItem}>
        {/* Avatar */}
        {item.avatarUrl ? (
          <Avatar.Image
            size={48}
            source={{ uri: item.avatarUrl }}
            style={styles.memberAvatar}
          />
        ) : (
          <LinearGradient
            colors={
              colorPalette.gradientBlueSoft as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.memberAvatarGradient}
          >
            <Text style={styles.memberAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>
              {item.name}{" "}
              {isCurrentUser && <Text style={styles.youText}>(You)</Text>}
            </Text>
          </View>
          {isMemberAdmin && (
            <View style={styles.adminBadgeContainer}>
              <MaterialCommunityIcons
                name="shield-star"
                size={12}
                color={colorPalette.primary}
              />
              <Text style={styles.adminBadge}>Admin</Text>
            </View>
          )}
        </View>

        {/* Remove Button */}
        {isCurrentUserAdmin && !isCurrentUser && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item.uid, item.name)}
            disabled={updating}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={24}
              color={colorPalette.error}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={[colorPalette.neutral[100], colorPalette.neutral[100]]}
          locations={[0, 1]}
          style={styles.headerGradient}
        >
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
              <Text style={styles.headerTitle}>Group Info</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient
            colors={
              colorPalette.gradientPurple as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.groupIconContainer}
          >
            <MaterialCommunityIcons
              name="account-multiple"
              size={48}
              color="#FFFFFF"
            />
          </LinearGradient>

          {editingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                placeholder="Group name"
                placeholderTextColor={colorPalette.neutral[400]}
                value={newName}
                onChangeText={setNewName}
                mode="outlined"
                style={styles.input}
                editable={!updating}
                outlineColor={colorPalette.neutral[200]}
                activeOutlineColor={colorPalette.primary}
                outlineStyle={{ borderRadius: borderRadius.md }}
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditingName(false);
                    setNewName(chat?.name || "");
                  }}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleUpdateGroupName}
                  disabled={updating}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      colorPalette.gradientBlue as [string, string, ...string[]]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveButtonGradient}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.groupNameContainer}>
              <Text style={styles.groupName}>{chat?.name}</Text>
              <Text style={styles.groupMemberCount}>
                {members.length} {members.length === 1 ? "member" : "members"}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  style={styles.editNameButton}
                  onPress={() => setEditingName(true)}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={18}
                    color={colorPalette.primary}
                  />
                  <Text style={styles.editNameButtonText}>Edit Name</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Members Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons
                name="account-group"
                size={20}
                color={colorPalette.primary}
              />
              <Text style={styles.cardTitle}>Members</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={handleAddMembers}
                disabled={updating}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={20}
                  color={colorPalette.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={visibleMembers}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.uid}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              <View style={styles.memberSeparator} />
            )}
          />

          {/* Expand/Collapse Button */}
          {hasMoreMembers && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setMembersExpanded(!membersExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandButtonText}>
                {membersExpanded
                  ? "Show Less"
                  : `Show ${members.length - MAX_VISIBLE_MEMBERS} More`}
              </Text>
              <MaterialCommunityIcons
                name={membersExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={colorPalette.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Actions Card */}
        <View style={styles.actionsCard}>
          {isAdmin ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteGroup}
              disabled={updating}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#EF4444", "#DC2626"] as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>Delete Group</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.leaveButton}
              onPress={handleLeaveGroup}
              disabled={updating}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#EF4444", "#DC2626"] as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                <MaterialCommunityIcons
                  name="exit-to-app"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.actionButtonText}>Leave Group</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Add Members Modal */}
      {showAddMembers && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
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
                style={styles.modalIconContainer}
              >
                <MaterialCommunityIcons
                  name="account-plus"
                  size={28}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowAddMembers(false)}
                disabled={updating}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colorPalette.neutral[600]}
                />
              </TouchableOpacity>
            </View>

            {allUsers.length === 0 ? (
              <View style={styles.modalEmptyContainer}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={48}
                  color={colorPalette.success}
                />
                <Text style={styles.modalEmptyText}>
                  All users are already members
                </Text>
              </View>
            ) : (
              <FlatList
                data={allUsers}
                renderItem={({ item }) => {
                  const isSelected = selectedNewMembers.has(item.uid);
                  return (
                    <TouchableOpacity
                      style={styles.memberSelectItem}
                      onPress={() => toggleNewMemberSelection(item.uid)}
                      activeOpacity={0.7}
                    >
                      {/* Avatar */}
                      {item.avatarUrl ? (
                        <Avatar.Image
                          size={44}
                          source={{ uri: item.avatarUrl }}
                          style={styles.modalMemberAvatar}
                        />
                      ) : (
                        <LinearGradient
                          colors={
                            colorPalette.gradientBlueSoft as [
                              string,
                              string,
                              ...string[]
                            ]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.modalMemberAvatarGradient}
                        >
                          <Text style={styles.modalMemberAvatarText}>
                            {item.name.charAt(0).toUpperCase()}
                          </Text>
                        </LinearGradient>
                      )}

                      <View style={styles.memberSelectInfo}>
                        <Text style={styles.memberSelectName}>{item.name}</Text>
                        <Text style={styles.memberSelectEmail}>
                          {item.email}
                        </Text>
                      </View>

                      {/* Checkbox */}
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxChecked,
                        ]}
                      >
                        {isSelected && (
                          <MaterialCommunityIcons
                            name="check"
                            size={18}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => item.uid}
                style={styles.modalList}
                ItemSeparatorComponent={() => (
                  <View style={styles.modalMemberSeparator} />
                )}
              />
            )}

            {/* Modal Footer */}
            {allUsers.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowAddMembers(false)}
                  disabled={updating}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleConfirmAddMembers}
                  disabled={selectedNewMembers.size === 0 || updating}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      colorPalette.gradientBlue as [string, string, ...string[]]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalConfirmGradient}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalConfirmButtonText}>
                        Add ({selectedNewMembers.size})
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colorPalette.neutral[600],
  },
  header: {
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colorPalette.background,
    ...colorPalette.shadows.small,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.base,
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
    ...typography.h3,
    color: colorPalette.neutral[950],
  },
  content: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: colorPalette.background,
    margin: spacing.base,
    marginTop: spacing.xl,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  groupIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...colorPalette.shadows.medium,
  },
  groupNameContainer: {
    alignItems: "center",
    width: "100%",
  },
  groupName: {
    ...typography.h2,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  groupMemberCount: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    marginBottom: spacing.base,
  },
  editNameButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  editNameButtonText: {
    ...typography.captionMedium,
    color: colorPalette.primary,
  },
  editNameContainer: {
    width: "100%",
    gap: spacing.md,
  },
  input: {
    backgroundColor: colorPalette.neutral[100],
    borderRadius: borderRadius.md,
    ...typography.body,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colorPalette.neutral[100],
  },
  cancelButtonText: {
    ...typography.bodyMedium,
    color: colorPalette.neutral[700],
  },
  saveButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.small,
  },
  saveButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    minWidth: 80,
    alignItems: "center",
  },
  saveButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
  },
  card: {
    backgroundColor: colorPalette.background,
    margin: spacing.base,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...colorPalette.shadows.medium,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.h4,
    color: colorPalette.neutral[950],
  },
  addMemberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral[100],
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginTop: spacing.sm,
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.full,
    alignSelf: "center",
  },
  expandButtonText: {
    ...typography.bodyMedium,
    color: colorPalette.primary,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  memberSeparator: {
    height: 1,
    backgroundColor: colorPalette.neutral[150],
    marginVertical: spacing.xs,
  },
  memberAvatar: {
    ...colorPalette.shadows.small,
  },
  memberAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  memberAvatarText: {
    ...typography.h4,
    color: "#FFFFFF",
  },
  memberInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberName: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  youText: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    fontWeight: "500",
  },
  adminBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colorPalette.primary + "15",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  adminBadge: {
    ...typography.tiny,
    color: colorPalette.primary,
    fontWeight: "700",
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.error + "10",
  },
  actionsCard: {
    margin: spacing.base,
    gap: spacing.md,
  },
  deleteButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  leaveButton: {
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
  },
  actionButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: spacing.xxxl,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modal: {
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.xxl,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    padding: spacing.xl,
    ...colorPalette.shadows.large,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
    ...colorPalette.shadows.medium,
  },
  modalTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    textAlign: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalEmptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.base,
  },
  modalEmptyText: {
    ...typography.body,
    color: colorPalette.neutral[600],
    textAlign: "center",
  },
  modalList: {
    width: "100%",
    maxHeight: 400,
    marginBottom: spacing.base,
  },
  memberSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  modalMemberSeparator: {
    height: 1,
    backgroundColor: colorPalette.neutral[150],
    marginVertical: spacing.xs,
  },
  modalMemberAvatar: {
    ...colorPalette.shadows.small,
  },
  modalMemberAvatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  modalMemberAvatarText: {
    ...typography.h4,
    color: "#FFFFFF",
    fontSize: 18,
  },
  memberSelectInfo: {
    flex: 1,
    gap: 2,
  },
  memberSelectName: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  memberSelectEmail: {
    ...typography.small,
    color: colorPalette.neutral[600],
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colorPalette.neutral[300],
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: colorPalette.primary,
    borderColor: colorPalette.primary,
  },
  modalFooter: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.md,
    marginTop: spacing.base,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.full,
    backgroundColor: colorPalette.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: {
    ...typography.bodyBold,
    color: colorPalette.neutral[700],
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: borderRadius.full,
    overflow: "hidden",
    ...colorPalette.shadows.small,
  },
  modalConfirmGradient: {
    paddingVertical: spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
  },
});
