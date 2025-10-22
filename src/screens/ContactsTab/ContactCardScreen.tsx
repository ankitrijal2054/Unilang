import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import {
  Appbar,
  Button,
  Text,
  Avatar,
  Card,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToUserPresence,
  getUserById,
} from "../../services/userService";
import { createDirectChat } from "../../services/chatService";
import { User } from "../../types";
import { colorPalette } from "../../utils/theme";
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
          <LinearGradient
            colors={[colorPalette.neutral[100], colorPalette.neutral[100]]}
            locations={[0, 1]}
            style={styles.headerGradient}
          >
            <BlurView intensity={50} tint="light" style={styles.headerBlur}>
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={() => navigation.popToTop()}>
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={28}
                      color={colorPalette.neutral[900]}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Contact</Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </BlurView>
          </LinearGradient>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colorPalette.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
                  <TouchableOpacity onPress={() => navigation.popToTop()}>
                    <MaterialCommunityIcons
                      name="arrow-left"
                      size={28}
                      color={colorPalette.neutral[900]}
                    />
                  </TouchableOpacity>
                </View>
                <View style={styles.headerCenter}>
                  <Text style={styles.headerTitle}>Contact</Text>
                </View>
                <View style={styles.headerRight} />
              </View>
            </BlurView>
          </LinearGradient>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contact not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOnline = user.status === "online";
  const languageName =
    LANGUAGE_NAMES[user.preferred_language] || user.preferred_language;

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
                <TouchableOpacity onPress={() => navigation.popToTop()}>
                  <MaterialCommunityIcons
                    name="arrow-left"
                    size={28}
                    color={colorPalette.neutral[900]}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Contact</Text>
              </View>
              <View style={styles.headerRight} />
            </View>
          </BlurView>
        </LinearGradient>
      </View>

      <ScrollView style={styles.content}>
        {/* Contact Card */}
        <Card style={styles.contactCard}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Avatar.Text
                size={80}
                label={user.name.charAt(0).toUpperCase()}
              />
              {isOnline && <View style={styles.onlineIndicator} />}
            </View>

            {/* Name */}
            <Text style={styles.name}>{user.name}</Text>

            {/* Status */}
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

            {/* Info Items */}
            <View style={styles.infoSection}>
              {/* Email */}
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={colorPalette.primary}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              {/* Language */}
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="translate"
                  size={20}
                  color={colorPalette.primary}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Language</Text>
                  <Text style={styles.infoValue}>{languageName}</Text>
                </View>
              </View>

              {/* Status */}
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name={isOnline ? "check-circle" : "clock-outline"}
                  size={20}
                  color={
                    isOnline ? colorPalette.success : colorPalette.neutral[500]
                  }
                />
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
          </View>
        </Card>

        {/* Start Chat Button */}
        <View style={styles.buttonSection}>
          <Button
            mode="contained"
            icon="message"
            onPress={handleStartChat}
            loading={starting}
            disabled={starting}
            style={styles.button}
          >
            Start Chat
          </Button>
        </View>
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: colorPalette.neutral[600],
  },
  content: {
    paddingTop: 16,
    backgroundColor: colorPalette.background,
  },
  contactCard: {
    margin: 16,
    backgroundColor: colorPalette.background,
    borderColor: colorPalette.neutral[200],
  },
  cardContent: {
    padding: 24,
    alignItems: "center",
  },
  avatarSection: {
    position: "relative",
    marginBottom: 16,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colorPalette.success,
    borderWidth: 3,
    borderColor: colorPalette.background,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 8,
    textAlign: "center",
  },
  status: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  onlineStatus: {
    color: colorPalette.success,
    fontWeight: "600",
  },
  offlineStatus: {
    color: colorPalette.neutral[500],
  },
  infoSection: {
    width: "100%",
    gap: 16,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral[200],
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colorPalette.neutral[500],
    fontWeight: "700",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: colorPalette.neutral[900],
    fontWeight: "600",
  },
  onlineText: {
    color: colorPalette.success,
  },
  offlineText: {
    color: colorPalette.neutral[500],
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  button: {
    paddingVertical: 8,
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
  headerRight: {
    width: 44,
  },
});
