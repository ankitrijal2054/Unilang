import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TextInput as RNTextInput,
} from "react-native";
import { Text, Dialog, Portal, RadioButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import { updateUserProfile } from "../../services/userService";
import { signOutUser } from "../../services/authService";
import { uploadProfilePicture } from "../../services/storageService";
import { AvatarPickerModal } from "../../components/AvatarPickerModal";
import { SUPPORTED_LANGUAGES } from "../../utils/constants";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

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

  // Avatar picker states
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  if (!user) {
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
              <Text style={styles.headerTitle}>My Profile</Text>
            </View>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={
              colorPalette.gradientOrange as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconContainer}
          >
            <MaterialCommunityIcons
              name="account-off"
              size={48}
              color={colorPalette.background}
            />
          </LinearGradient>
          <Text style={styles.emptyTitle}>No User Data</Text>
          <Text style={styles.emptyText}>
            User information could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentLanguageName = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === selectedLanguage
  )?.name;

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

  const handleAvatarSelected = async (imageUri: string) => {
    if (!user?.uid) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      console.log("📸 Starting avatar upload...");

      // Upload to Firebase Storage
      const avatarUrl = await uploadProfilePicture(imageUri, user.uid);
      console.log("✅ Avatar uploaded:", avatarUrl);

      // Update user profile in Firestore
      const result = await updateUserProfile(user.uid, { avatarUrl });

      if (result.success) {
        // Update local auth store
        useAuthStore.setState({ user: { ...user, avatarUrl } });
        Alert.alert("Success", "Profile picture updated successfully");
        console.log("✅ Avatar updated in profile");
      } else {
        Alert.alert("Error", "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert(
        "Error",
        "Failed to upload profile picture. Please try again."
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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

  const isOnline = user.status === "online";

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
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
              <Text style={styles.headerTitle}>My Profile</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Profile Card with Avatar */}
          <View style={styles.profileCard}>
            <TouchableOpacity
              onPress={() => setShowAvatarPicker(true)}
              disabled={isUploadingAvatar}
              activeOpacity={0.7}
            >
              <View style={styles.avatarSection}>
                {isUploadingAvatar ? (
                  <View style={styles.avatarGradient}>
                    <ActivityIndicator
                      size="large"
                      color={colorPalette.primary}
                    />
                  </View>
                ) : user.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <LinearGradient
                    colors={gradientColors as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarText}>{initials}</Text>
                  </LinearGradient>
                )}

                {/* Camera Icon Overlay */}
                {!isUploadingAvatar && (
                  <View style={styles.cameraIconContainer}>
                    <LinearGradient
                      colors={
                        colorPalette.gradientBlue as [
                          string,
                          string,
                          ...string[]
                        ]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cameraIconGradient}
                    >
                      <MaterialCommunityIcons
                        name="camera-plus"
                        size={20}
                        color={colorPalette.background}
                      />
                    </LinearGradient>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {/* Name Section */}
            {!editingName ? (
              <View style={styles.nameSection}>
                <Text style={styles.userName}>{user.name}</Text>
                <TouchableOpacity
                  style={styles.editNameButton}
                  onPress={() => {
                    setNewName(user.name);
                    setEditingName(true);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="pencil"
                    size={16}
                    color={colorPalette.primary}
                  />
                  <Text style={styles.editNameButtonText}>Edit Name</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.editNameContainer}>
                <RNTextInput
                  style={styles.nameInput}
                  placeholder="Enter your name"
                  value={newName}
                  onChangeText={setNewName}
                  editable={!isSavingName}
                  autoFocus
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelNameEdit}
                    disabled={isSavingName}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveName}
                    disabled={isSavingName}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        colorPalette.gradientBlue as [
                          string,
                          string,
                          ...string[]
                        ]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveButtonGradient}
                    >
                      {isSavingName ? (
                        <ActivityIndicator
                          size="small"
                          color={colorPalette.background}
                        />
                      ) : (
                        <Text style={styles.saveButtonText}>Save</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Email Display */}
            <View style={styles.emailRow}>
              <MaterialCommunityIcons
                name="email"
                size={16}
                color={colorPalette.neutral[600]}
              />
              <Text style={styles.emailText} numberOfLines={1}>
                {user.email}
              </Text>
            </View>

            {/* Status Display */}
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
                  styles.statusText,
                  isOnline ? styles.onlineStatus : styles.offlineStatus,
                ]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>

          {/* Info Card */}
          <View style={styles.infoCard}>
            {/* Language */}
            <TouchableOpacity
              style={styles.infoItem}
              onPress={() => setShowLanguageDialog(true)}
              activeOpacity={0.7}
            >
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
                style={styles.infoIconContainer}
              >
                <MaterialCommunityIcons
                  name="translate"
                  size={16}
                  color={colorPalette.background}
                />
              </LinearGradient>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Preferred Language</Text>
                <Text style={styles.infoValue}>{currentLanguageName}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={colorPalette.neutral[400]}
              />
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={isUpdating}
            activeOpacity={0.8}
            style={[
              styles.logoutButton,
              isUpdating && styles.logoutButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={
                isUpdating
                  ? [colorPalette.neutral[300], colorPalette.neutral[300]]
                  : (colorPalette.gradientOrange as [
                      string,
                      string,
                      ...string[]
                    ])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoutButtonGradient}
            >
              {isUpdating ? (
                <ActivityIndicator color={colorPalette.background} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="logout"
                    size={20}
                    color={colorPalette.background}
                  />
                  <Text style={styles.logoutButtonText}>Sign Out</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Language Selection Dialog */}
        <Portal>
          <Dialog
            visible={showLanguageDialog}
            onDismiss={() => {
              setSelectedLanguage(user.preferred_language);
              setShowLanguageDialog(false);
            }}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>
              Select Language
            </Dialog.Title>
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
              <TouchableOpacity
                onPress={() => {
                  setSelectedLanguage(user.preferred_language);
                  setShowLanguageDialog(false);
                }}
                style={styles.dialogCancelButton}
                activeOpacity={0.7}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveLanguage}
                disabled={
                  isSavingLanguage ||
                  selectedLanguage === user.preferred_language
                }
                style={styles.dialogSaveButton}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    colorPalette.gradientBlue as [string, string, ...string[]]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.dialogSaveGradient}
                >
                  {isSavingLanguage ? (
                    <ActivityIndicator
                      size="small"
                      color={colorPalette.background}
                    />
                  ) : (
                    <Text style={styles.dialogSaveText}>Save</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Avatar Picker Modal */}
        <AvatarPickerModal
          visible={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          onAvatarSelected={handleAvatarSelected}
          isLoading={isUploadingAvatar}
        />
      </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    justifyContent: "space-between",
    gap: spacing.md,
  },
  profileCard: {
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  avatarSection: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    ...colorPalette.shadows.medium,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  avatarText: {
    ...typography.h1,
    fontSize: 44,
    color: colorPalette.background,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 15,
    overflow: "hidden",
    ...colorPalette.shadows.small,
  },
  cameraIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colorPalette.background,
  },
  nameSection: {
    alignItems: "center",
    width: "100%",
    marginBottom: spacing.xs,
  },
  userName: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  editNameButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editNameButtonText: {
    ...typography.small,
    color: colorPalette.primary,
    fontWeight: "500",
  },
  editNameContainer: {
    width: "100%",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  nameInput: {
    ...typography.body,
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colorPalette.neutral[200],
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colorPalette.neutral[100],
  },
  cancelButtonText: {
    ...typography.small,
    color: colorPalette.neutral[700],
    fontWeight: "500",
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...colorPalette.shadows.small,
  },
  saveButtonGradient: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minWidth: 60,
    alignItems: "center",
  },
  saveButtonText: {
    ...typography.small,
    color: colorPalette.background,
    fontWeight: "500",
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    width: "100%",
  },
  emailText: {
    ...typography.small,
    color: colorPalette.neutral[700],
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...typography.small,
  },
  onlineStatus: {
    color: colorPalette.success,
    fontWeight: "500",
  },
  offlineStatus: {
    color: colorPalette.neutral[500],
  },
  infoCard: {
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    ...colorPalette.shadows.medium,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  logoutButton: {
    borderRadius: borderRadius.xxl,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base + 2,
    paddingHorizontal: spacing.xl,
  },
  logoutButtonText: {
    ...typography.bodyBold,
    color: colorPalette.background,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...colorPalette.shadows.medium,
  },
  emptyTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  emptyText: {
    ...typography.body,
    color: colorPalette.neutral[600],
    textAlign: "center",
  },
  dialog: {
    borderRadius: borderRadius.xxl,
  },
  dialogTitle: {
    ...typography.h4,
    color: colorPalette.neutral[950],
  },
  languageOption: {
    marginVertical: 4,
  },
  radioButton: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  dialogCancelButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  dialogCancelText: {
    ...typography.bodyBold,
    color: colorPalette.neutral[700],
  },
  dialogSaveButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  dialogSaveGradient: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    minWidth: 60,
    alignItems: "center",
  },
  dialogSaveText: {
    ...typography.bodyBold,
    color: colorPalette.background,
  },
});
