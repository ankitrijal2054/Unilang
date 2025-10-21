import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Appbar, Button, Text, Avatar, Card, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/authStore";
import {
  subscribeToUserPresence,
  getUserById,
} from "../../services/userService";
import { createDirectChat } from "../../services/chatService";
import { User } from "../../types";

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
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.popToTop()} />
          <Appbar.Content title="Contact" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.popToTop()} />
          <Appbar.Content title="Contact" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contact not found</Text>
        </View>
      </View>
    );
  }

  const isOnline = user.status === "online";
  const languageName = LANGUAGE_NAMES[user.preferred_language] || user.preferred_language;

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.popToTop()} />
        <Appbar.Content title="Contact" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Contact Card */}
        <Card style={styles.contactCard}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Avatar.Text size={80} label={user.name.charAt(0).toUpperCase()} />
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
              {isOnline ? "Active now" : `Last seen ${user.lastSeen || "recently"}`}
            </Text>

            {/* Info Items */}
            <View style={styles.infoSection}>
              {/* Email */}
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="email" size={20} color="#2196F3" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>

              {/* Language */}
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="translate" size={20} color="#2196F3" />
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
                  color={isOnline ? "#4CAF50" : "#999"}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, isOnline ? styles.onlineText : styles.offlineText]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    color: "#666",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contactCard: {
    marginBottom: 24,
    elevation: 4,
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
    backgroundColor: "#4CAF50",
    borderWidth: 3,
    borderColor: "#fff",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  status: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  onlineStatus: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  offlineStatus: {
    color: "#999",
  },
  infoSection: {
    width: "100%",
    gap: 16,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
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
    color: "#999",
    fontWeight: "600",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  onlineText: {
    color: "#4CAF50",
  },
  offlineText: {
    color: "#999",
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  button: {
    paddingVertical: 8,
  },
});
