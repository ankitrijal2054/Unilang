import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { AnimatedDots } from "./AnimatedDots";
import { colorPalette } from "../utils/theme";

interface TypingUser {
  userId: string;
  userName: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

/**
 * Animated typing indicator component
 * Modern Messenger-style with animated dots in a bubble
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  // Don't show if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Generate the typing message text
  const getTypingText = (): string => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName}`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName}`;
    } else {
      return `${typingUsers.length} people`;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Typing bubble with animated dots */}
        <View style={styles.bubble}>
          <AnimatedDots size={8} gap={3} color={colorPalette.neutral[500]} />
        </View>
        {/* Typing text */}
        <Text style={styles.typingText}>{getTypingText()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "transparent",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bubble: {
    backgroundColor: colorPalette.neutral[200],
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 60,
    justifyContent: "center",
    alignItems: "center",
    // Subtle shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typingText: {
    fontSize: 12,
    color: colorPalette.neutral[500],
    fontWeight: "500",
  },
});
