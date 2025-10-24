import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToUserPresence,
  getUserById,
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

interface ContactCardScreenProps {
  navigation: any;
  route: any;
}

export const ContactCardScreen: React.FC<ContactCardScreenProps> = ({
  navigation,
  route,
}) => {
  const { user: currentUser } = useAuthStore();
  const { userId } = route.params;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const LANGUAGE_NAMES: { [key: string]: string } = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    "zh-CN": "Chinese",
    pt: "Portuguese",
    ru: "Russian",
    ja: "Japanese",
    ko: "Korean",
    ar: "Arabic",
  };

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchUser = async () => {
      try {
        const result = await getUserById(userId);
        if (result.success && result.user) {
          setUser(result.user);

          // Subscribe to presence updates
          unsubscribe = subscribeToUserPresence(userId, (updatedUser) => {
            if (updatedUser) {
              setUser(updatedUser);
            }
          });
        } else {
          Alert.alert("Error", "Could not load user profile");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        Alert.alert("Error", "An error occurred");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userId]);

  const handleStartChat = async () => {
    if (!currentUser?.uid || !user?.uid) {
      Alert.alert("Error", "User information missing");
      return;
    }

    setStarting(true);
    try {
      const result = await createDirectChat(currentUser.uid, user.uid);

      if (result.success && result.chatId) {
        navigation.navigate("Chat", {
          chatId: result.chatId,
          chatName: user.name,
          chatType: "direct",
        });
      } else {
        Alert.alert("Error", "Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "An error occurred");
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.popToTop()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colorPalette.neutral[950]}
              />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Contact</Text>
            </View>
          </View>
        </View>
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
              name="account"
              size={48}
              color={colorPalette.background}
            />
          </LinearGradient>
          <ActivityIndicator
            size="large"
            color={colorPalette.primary}
            style={{ marginTop: spacing.lg }}
          />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.popToTop()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colorPalette.neutral[950]}
              />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Contact</Text>
            </View>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <LinearGradient
            colors={
              colorPalette.gradientOrange as [string, string, ...string[]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.errorIconContainer}
          >
            <MaterialCommunityIcons
              name="account-off"
              size={48}
              color={colorPalette.background}
            />
          </LinearGradient>
          <Text style={styles.errorTitle}>Contact Not Found</Text>
          <Text style={styles.errorText}>
            This contact could not be loaded.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOnline = user.status === "online";
  const languageName =
    LANGUAGE_NAMES[user.preferred_language] || user.preferred_language;

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
    <SafeAreaView style={styles.container}>
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.popToTop()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colorPalette.neutral[950]}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Contact Profile</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Hero Card with Avatar */}
        <View style={styles.heroCard}>
          <View style={styles.avatarSection}>
            {user.avatarUrl ? (
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
            {isOnline && (
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineIndicatorInner} />
              </View>
            )}
          </View>

          <Text style={styles.name}>{user.name}</Text>

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
                styles.status,
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
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colorPalette.neutral[700]}
            />
            <Text style={styles.infoCardTitle}>Information</Text>
          </View>

          {/* Email */}
          <View style={styles.infoItem}>
            <LinearGradient
              colors={
                colorPalette.gradientBlueSoft as [string, string, ...string[]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoIconContainer}
            >
              <MaterialCommunityIcons
                name="email"
                size={16}
                color={colorPalette.background}
              />
            </LinearGradient>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>

          <View style={styles.infoSeparator} />

          {/* Language */}
          <View style={styles.infoItem}>
            <LinearGradient
              colors={
                colorPalette.gradientPurpleSoft as [string, string, ...string[]]
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
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>{languageName}</Text>
            </View>
          </View>

          <View style={styles.infoSeparator} />

          {/* Status */}
          <View style={styles.infoItem}>
            <LinearGradient
              colors={
                isOnline
                  ? (colorPalette.gradientGreen as [
                      string,
                      string,
                      ...string[]
                    ])
                  : [colorPalette.neutral[300], colorPalette.neutral[300]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.infoIconContainer}
            >
              <MaterialCommunityIcons
                name={isOnline ? "check-circle" : "clock-outline"}
                size={16}
                color={colorPalette.background}
              />
            </LinearGradient>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text
                style={[
                  styles.infoValue,
                  isOnline ? styles.onlineText : styles.offlineText,
                ]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>

        {/* Start Chat Button */}
        <TouchableOpacity
          onPress={handleStartChat}
          disabled={starting}
          activeOpacity={0.8}
          style={[styles.chatButton, starting && styles.chatButtonDisabled]}
        >
          <LinearGradient
            colors={
              starting
                ? [colorPalette.neutral[300], colorPalette.neutral[300]]
                : (colorPalette.gradientBlue as [string, string, ...string[]])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chatButtonGradient}
          >
            {starting ? (
              <ActivityIndicator color={colorPalette.background} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="message-text"
                  size={20}
                  color={colorPalette.background}
                />
                <Text style={styles.chatButtonText}>Start Chat</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  loadingText: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    ...colorPalette.shadows.medium,
  },
  errorTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  errorText: {
    ...typography.body,
    color: colorPalette.neutral[600],
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    justifyContent: "space-between",
  },
  heroCard: {
    backgroundColor: colorPalette.background,
    borderRadius: borderRadius.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  avatarSection: {
    position: "relative",
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    ...colorPalette.shadows.medium,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  avatarText: {
    ...typography.h1,
    fontSize: 40,
    color: colorPalette.background,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colorPalette.background,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.small,
  },
  onlineIndicatorInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colorPalette.success,
  },
  name: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status: {
    ...typography.body,
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
  infoCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  infoCardTitle: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
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
    marginBottom: 4,
  },
  infoValue: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
  },
  onlineText: {
    color: colorPalette.success,
  },
  offlineText: {
    color: colorPalette.neutral[500],
  },
  infoSeparator: {
    height: 1,
    backgroundColor: colorPalette.neutral[100],
    marginVertical: spacing.sm,
  },
  chatButton: {
    borderRadius: borderRadius.xxl,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  chatButtonDisabled: {
    opacity: 0.6,
  },
  chatButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base + 2,
    paddingHorizontal: spacing.xl,
  },
  chatButtonText: {
    ...typography.bodyBold,
    color: colorPalette.background,
    fontSize: 16,
  },
});
