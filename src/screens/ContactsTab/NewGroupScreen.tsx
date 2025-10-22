import React, { useEffect, useState } from "react";
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
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { getAllUsers } from "../../services/userService";
import { createGroupChat } from "../../services/chatService";
import { User } from "../../types";
import { colorPalette } from "../../utils/theme";

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

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.uid)}
        activeOpacity={0.7}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleUserSelection(item.uid)}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colorPalette.background}
              />
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (step === "select_participants") {
    return (
      <SafeAreaView style={styles.container}>
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
                  <Text style={styles.headerTitle}>New Group</Text>
                  <Text style={styles.headerSubtitle}>
                    {selectedUserIds.size} selected
                  </Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </BlurView>
          </LinearGradient>
        </View>

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
          <LinearGradient
            colors={[colorPalette.neutral[100], colorPalette.neutral[100]]}
            locations={[0, 1]}
            style={styles.headerGradient}
          >
            <BlurView intensity={50} tint="light" style={styles.headerBlur}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity
                    onPress={() => setStep("select_participants")}
                  >
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={28}
                      color={colorPalette.neutral[900]}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Group Name</Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </BlurView>
          </LinearGradient>
        </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colorPalette.neutral[700],
    marginTop: 4,
  },
  headerRight: {
    width: 44,
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
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(248, 250, 252, 0.8)",
    borderRadius: 12,
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: colorPalette.neutral[50],
    borderRadius: 12,
    padding: 16,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colorPalette.neutral[700],
    marginBottom: 4,
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
    borderBottomColor: colorPalette.neutral[100],
    backgroundColor: colorPalette.background,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: colorPalette.neutral[900],
  },
  userEmail: {
    fontSize: 12,
    color: colorPalette.neutral[600],
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colorPalette.neutral[600],
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
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colorPalette.neutral[400],
    backgroundColor: colorPalette.background,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colorPalette.neutral[400],
  },
  checkboxChecked: {
    backgroundColor: colorPalette.primary,
    borderColor: colorPalette.primary,
  },
});
