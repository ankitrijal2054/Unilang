import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import {
  Appbar,
  Text,
  Button,
  Divider,
  TextInput,
  Dialog,
  Portal,
  RadioButton,
} from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { updateUserProfile } from "../../services/userService";
import { signOutUser } from "../../services/authService";
import { SUPPORTED_LANGUAGES } from "../../utils/constants";
import { colorPalette } from "../../utils/theme";

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuthStore();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.preferred_language || "en"
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);

  if (!user) {
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
                  <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </BlurView>
          </LinearGradient>
        </View>
        <View style={styles.emptyContainer}>
          <Text>No user data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentLanguageName = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === selectedLanguage
  )?.name;

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    if (newName === user.name) {
      setEditingName(false);
      return;
    }

    setIsSavingName(true);
    try {
      const result = await updateUserProfile(user.uid, { name: newName });

      if (result.success) {
        useAuthStore.setState({ user: { ...user, name: newName } });
        setEditingName(false);
        Alert.alert("Success", "Profile updated successfully");
        console.log("✅ Name updated:", newName);
      } else {
        Alert.alert("Error", "Failed to update name. Please try again.");
      }
    } catch (error) {
      console.error("Error updating name:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveLanguage = async () => {
    if (selectedLanguage === user.preferred_language) {
      setShowLanguageDialog(false);
      return;
    }

    setIsSavingLanguage(true);
    try {
      const result = await updateUserProfile(user.uid, {
        preferred_language: selectedLanguage,
      });

      if (result.success) {
        useAuthStore.setState({
          user: { ...user, preferred_language: selectedLanguage },
        });
        setShowLanguageDialog(false);
        Alert.alert("Success", "Language updated successfully");
        console.log("✅ Language updated:", selectedLanguage);
      } else {
        Alert.alert("Error", "Failed to update language. Please try again.");
      }
    } catch (error) {
      console.error("Error updating language:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Sign Out",
        onPress: async () => {
          setIsUpdating(true);
          try {
            await signOutUser();
            logout();
            console.log("✅ Logged out successfully");
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          } finally {
            setIsUpdating(false);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleCancelNameEdit = () => {
    setNewName(user.name);
    setEditingName(false);
  };

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
                  <TouchableOpacity onPress={() => navigation.goBack()}>
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={28}
                      color={colorPalette.neutral[900]}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Profile</Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </BlurView>
          </LinearGradient>
        </View>

        <ScrollView style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.circularAvatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
              </View>
            </View>
          </View>

          {/* User Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <Divider />

            {/* Email - Read Only */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={colorPalette.primary}
                />
                <Text style={styles.infoLabelText}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <Divider style={styles.infoDivider} />

            {/* Display Name - Editable */}
            {!editingName ? (
              <>
                <View style={styles.infoRow}>
                  <View style={styles.infoLabel}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color={colorPalette.primary}
                    />
                    <Text style={styles.infoLabelText}>Display Name</Text>
                  </View>
                  <View style={styles.nameValueContainer}>
                    <Text style={styles.infoValue}>{user.name}</Text>
                    <Button
                      compact
                      onPress={() => {
                        setNewName(user.name);
                        setEditingName(true);
                      }}
                    >
                      Edit
                    </Button>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.editNameContainer}>
                  <MaterialCommunityIcons
                    name="account"
                    size={20}
                    color={colorPalette.primary}
                  />
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Enter your name"
                    value={newName}
                    onChangeText={setNewName}
                    mode="flat"
                    dense
                    editable={!isSavingName}
                  />
                </View>
                <View style={styles.editButtonsContainer}>
                  <Button
                    mode="outlined"
                    onPress={handleCancelNameEdit}
                    disabled={isSavingName}
                    compact
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveName}
                    loading={isSavingName}
                    disabled={isSavingName}
                    compact
                  >
                    Save
                  </Button>
                </View>
              </>
            )}

            <Divider style={styles.infoDivider} />

            {/* Preferred Language */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialCommunityIcons
                  name="translate"
                  size={20}
                  color={colorPalette.primary}
                />
                <Text style={styles.infoLabelText}>Language</Text>
              </View>
              <View style={styles.nameValueContainer}>
                <Text style={styles.infoValue}>{currentLanguageName}</Text>
                <Button compact onPress={() => setShowLanguageDialog(true)}>
                  Change
                </Button>
              </View>
            </View>

            <Divider style={styles.infoDivider} />

            {/* Status - Read Only */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Text
                  style={[
                    styles.statusIndicator,
                    {
                      color:
                        user.status === "online"
                          ? colorPalette.success
                          : colorPalette.neutral[500],
                    },
                  ]}
                >
                  ●
                </Text>
                <Text style={styles.infoLabelText}>Status</Text>
              </View>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color:
                      user.status === "online"
                        ? colorPalette.success
                        : colorPalette.neutral[500],
                  },
                ]}
              >
                {user.status === "online" ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <View style={styles.actionSection}>
            <Button
              mode="contained"
              onPress={handleLogout}
              loading={isUpdating}
              disabled={isUpdating}
              buttonColor={colorPalette.error}
              style={styles.logoutButton}
            >
              Sign Out
            </Button>
          </View>
        </ScrollView>

        {/* Language Selection Dialog */}
        <Portal>
          <Dialog
            visible={showLanguageDialog}
            onDismiss={() => {
              setSelectedLanguage(user.preferred_language);
              setShowLanguageDialog(false);
            }}
          >
            <Dialog.Title>Select Language</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <View key={lang.code} style={styles.languageOption}>
                    <RadioButton.Item
                      label={lang.name}
                      value={lang.code}
                      style={styles.radioButton}
                    />
                  </View>
                ))}
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setSelectedLanguage(user.preferred_language);
                  setShowLanguageDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveLanguage}
                loading={isSavingLanguage}
                disabled={
                  isSavingLanguage ||
                  selectedLanguage === user.preferred_language
                }
              >
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[200],
    backgroundColor: colorPalette.background,
  },
  avatarContainer: {
    alignItems: "center",
  },
  avatarEmoji: {
    fontSize: 48,
  },
  statusIndicator: {
    fontSize: 14,
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  infoLabelText: {
    fontSize: 14,
    fontWeight: "600",
    color: colorPalette.neutral[700],
  },
  infoValue: {
    fontSize: 14,
    color: colorPalette.neutral[900],
    fontWeight: "500",
  },
  nameValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  infoDivider: {
    marginVertical: 0,
  },
  editNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colorPalette.surface,
  },
  editButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  languageOption: {
    marginVertical: 4,
  },
  radioButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  actionSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral[200],
  },
  logoutButton: {
    paddingVertical: 8,
  },
  emptyContainer: {
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
  circularAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colorPalette.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
});
