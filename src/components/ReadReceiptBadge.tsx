import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { User } from "../types";
import { getUserById } from "../services/userService";
import { colorPalette } from "../utils/theme";

interface ReadReceiptBadgeProps {
  readBy: string[]; // Array of user IDs who have read the message
  chatType: "direct" | "group";
  maxAvatars?: number; // Maximum number of avatars to show
}

/**
 * ReadReceiptBadge Component
 * Shows "Seen" for direct chats or "Seen by" with avatars for group chats
 */
export const ReadReceiptBadge: React.FC<ReadReceiptBadgeProps> = ({
  readBy,
  chatType,
  maxAvatars = 3,
}) => {
  const [readers, setReaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data for readers
  useEffect(() => {
    const fetchReaders = async () => {
      if (!readBy || readBy.length === 0) {
        setLoading(false);
        return;
      }

      const userPromises = readBy.slice(0, maxAvatars).map(async (userId) => {
        const result = await getUserById(userId);
        return result.success && result.user ? result.user : null;
      });

      const users = await Promise.all(userPromises);
      setReaders(users.filter((u): u is User => u !== null));
      setLoading(false);
    };

    fetchReaders();
  }, [readBy, maxAvatars]);

  if (loading || !readBy || readBy.length === 0) {
    return null;
  }

  // Direct chat: just show "Seen"
  if (chatType === "direct") {
    return (
      <View style={styles.container}>
        <Text style={styles.seenText}>Seen</Text>
      </View>
    );
  }

  // Group chat: show "Seen by" with avatars
  const remainingCount = readBy.length - maxAvatars;

  return (
    <View style={styles.container}>
      <Text style={styles.seenByText}>Seen by</Text>
      <View style={styles.avatarRow}>
        {readers.map((user, index) => (
          <Avatar.Text
            key={user.uid}
            size={20}
            label={user.name.charAt(0).toUpperCase()}
            style={[styles.avatar, index > 0 && styles.avatarOverlap]}
            labelStyle={styles.avatarLabel}
          />
        ))}
        {remainingCount > 0 && (
          <View style={[styles.moreIndicator, styles.avatarOverlap]}>
            <Text style={styles.moreText}>+{remainingCount}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingRight: 4,
  },
  seenText: {
    fontSize: 11,
    color: colorPalette.neutral[500],
    fontWeight: "500",
  },
  seenByText: {
    fontSize: 11,
    color: colorPalette.neutral[500],
    fontWeight: "500",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: colorPalette.primary,
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  moreIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colorPalette.neutral[400],
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 9,
    color: "white",
    fontWeight: "700",
  },
});
