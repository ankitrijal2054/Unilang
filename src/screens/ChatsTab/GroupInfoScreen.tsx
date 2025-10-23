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
import { Appbar, Text, Button, TextInput, Divider } from "react-native-paper";
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
import { colorPalette } from "../../utils/theme";

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

  const isAdmin = user?.uid === chat?.adminId;

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
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Group Info" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </View>
    );
  }

  const renderMemberItem = ({ item }: { item: User }) => {
    const isAdmin = item.uid === chat?.adminId;
    const isCurrentUser = item.uid === user?.uid;
    const isCurrentUserAdmin = user?.uid === chat?.adminId;

    return (
      <View style={styles.memberItem}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {item.name} {isCurrentUser ? "(You)" : ""}
          </Text>
          {isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
        </View>
        {isCurrentUserAdmin && !isCurrentUser && (
          <Button
            mode="text"
            textColor={colorPalette.error}
            onPress={() => handleRemoveMember(item.uid, item.name)}
            disabled={updating}
            compact
          >
            Remove
          </Button>
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

      <ScrollView style={styles.content}>
        {/* Group Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitleHeader}>Group Name</Text>
          {editingName ? (
            <View style={styles.editContainer}>
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
                outlineStyle={{ borderRadius: 12 }}
              />
              <View style={styles.editButtons}>
                <Button
                  compact
                  onPress={() => {
                    setEditingName(false);
                    setNewName(chat?.name || "");
                  }}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  compact
                  onPress={handleUpdateGroupName}
                  loading={updating}
                  disabled={updating}
                >
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={styles.groupName}>{chat?.name}</Text>
              {isAdmin && (
                <Button
                  compact
                  mode="text"
                  onPress={() => setEditingName(true)}
                  disabled={updating}
                >
                  Edit
                </Button>
              )}
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitleHeader}>
              Members ({members.length})
            </Text>
            {isAdmin && (
              <Button
                compact
                mode="text"
                onPress={handleAddMembers}
                disabled={updating}
              >
                Add
              </Button>
            )}
          </View>

          <FlatList
            data={members}
            renderItem={renderMemberItem}
            keyExtractor={(item) => item.uid}
            scrollEnabled={false}
            style={styles.membersList}
          />
        </View>

        <Divider />

        {/* Actions Section */}
        <View style={styles.section}>
          {isAdmin ? (
            <View style={styles.actionContainer}>
              <Button
                mode="outlined"
                onPress={handleDeleteGroup}
                disabled={updating}
                labelStyle={styles.deleteButtonLabel}
              >
                Delete Group
              </Button>
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <Button
                mode="outlined"
                onPress={handleLeaveGroup}
                disabled={updating}
                labelStyle={styles.leaveButtonLabel}
              >
                Leave Group
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Members Modal */}
      {showAddMembers && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <Button
                compact
                onPress={() => setShowAddMembers(false)}
                disabled={updating}
              >
                Close
              </Button>
            </View>

            {allUsers.length === 0 ? (
              <Text style={styles.modalEmptyText}>
                All users are already members
              </Text>
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
                      <View style={styles.memberSelectInfo}>
                        <Text style={styles.memberSelectName}>{item.name}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => toggleNewMemberSelection(item.uid)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxChecked,
                          ]}
                        >
                          {isSelected && (
                            <MaterialCommunityIcons
                              name="check"
                              size={16}
                              color={colorPalette.background}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => item.uid}
                style={styles.modalList}
              />
            )}

            <View style={styles.modalFooter}>
              <Button
                onPress={() => setShowAddMembers(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleConfirmAddMembers}
                loading={updating}
                disabled={selectedNewMembers.size === 0 || updating}
              >
                Confirm ({selectedNewMembers.size})
              </Button>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  content: {
    flex: 1,
    paddingVertical: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 12,
  },
  groupName: {
    fontSize: 14,
    fontWeight: "600",
    color: colorPalette.neutral[700],
    marginVertical: 4,
  },
  displayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editContainer: {
    gap: 8,
  },
  input: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 12,
    fontSize: 16,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  membersList: {
    marginTop: 8,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[100],
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: 14,
    color: colorPalette.neutral[900],
    fontWeight: "600",
  },
  adminBadge: {
    fontSize: 11,
    color: colorPalette.primary,
    fontWeight: "700",
  },
  actionContainer: {
    gap: 8,
  },
  deleteButtonLabel: {
    color: colorPalette.error,
  },
  leaveButtonLabel: {
    color: colorPalette.error,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modal: {
    backgroundColor: colorPalette.background,
    borderRadius: 12,
    width: "80%",
    maxHeight: "70%",
    padding: 20,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  modalEmptyText: {
    fontSize: 16,
    color: colorPalette.neutral[600],
    textAlign: "center",
    marginTop: 20,
  },
  modalList: {
    width: "100%",
    maxHeight: "50%",
    marginBottom: 20,
  },
  memberSelectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  memberSelectInfo: {
    flex: 1,
  },
  memberSelectName: {
    fontSize: 16,
    color: colorPalette.neutral[900],
    fontWeight: "600",
  },
  checkboxContainer: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  checkboxChecked: {
    backgroundColor: colorPalette.primary,
    borderColor: colorPalette.primary,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 15,
  },
  divider: {
    marginVertical: 0,
  },
  sectionTitleHeader: {
    fontSize: 18,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 12,
  },
});
