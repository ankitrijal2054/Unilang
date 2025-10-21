import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Appbar,
  Checkbox,
  TextInput,
  Button,
  Text,
  Snackbar,
} from "react-native-paper";
import { useAuthStore } from "../../store/authStore";
import { getAllUsers } from "../../services/userService";
import { createGroupChat } from "../../services/chatService";
import { User } from "../../types";

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

  const handleContinue = () => {
    if (selectedUserIds.size < 2) {
      Alert.alert("Error", "Please select at least 2 participants");
      return;
    }
    setStep("group_name");
  };

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
        // Navigate to the new group chat
        navigation.navigate("Chat", {
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

    return (
      <View style={styles.userItem}>
        <Checkbox
          status={isSelected ? "checked" : "unchecked"}
          onPress={() => toggleUserSelection(item.uid)}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (step === "select_participants") {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="New Group"
            subtitle={`${selectedUserIds.size} selected`}
          />
        </Appbar.Header>

        <FlatList
          data={allUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No users available</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            disabled={selectedUserIds.size < 2}
            loading={false}
            style={styles.button}
          >
            Continue ({selectedUserIds.size}/max)
          </Button>
        </View>

        <Snackbar
          visible={!!errorMessage}
          onDismiss={() => setErrorMessage("")}
          duration={3000}
        >
          {errorMessage}
        </Snackbar>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => setStep("select_participants")} />
        <Appbar.Content title="Group Name" />
      </Appbar.Header>

      <View style={styles.contentContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.label}>Group Name</Text>
          <TextInput
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
            mode="outlined"
            style={styles.input}
            editable={!creating}
            autoFocus
          />

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>
              Members ({selectedUserIds.size + 1}):
            </Text>
            <Text style={styles.summaryText}>{user?.name} (You)</Text>
            {Array.from(selectedUserIds).map((userId) => {
              const member = allUsers.find((u) => u.uid === userId);
              return (
                <Text key={userId} style={styles.summaryText}>
                  {member?.name}
                </Text>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={() => setStep("select_participants")}
            disabled={creating}
            style={[styles.button, styles.backButton]}
          >
            Back
          </Button>
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            loading={creating}
            disabled={!groupName.trim() || creating}
            style={[styles.button, styles.createButton]}
          >
            Create Group
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    backgroundColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  formContainer: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f5",
  },
  summaryContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: "#333",
    marginVertical: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  userEmail: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  footer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    paddingBottom: 8,
  },
  button: {
    flex: 1,
  },
  backButton: {
    flex: 1,
  },
  createButton: {
    flex: 1.2,
  },
});
