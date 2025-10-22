import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
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
 * Shows who is currently typing with animated ellipsis
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
}) => {
  const dotAnim = useRef(new Animated.Value(0)).current;

  // Animate the ellipsis dots
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [dotAnim]);

  // Don't show if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Generate the typing message text
  const getTypingText = (): string => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].userName} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing`;
    } else {
      return `${typingUsers.length} people are typing`;
    }
  };

  // Animated dots opacity
  const dotsOpacity = dotAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 1],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.typingText}>{getTypingText()}</Text>
      <Animated.View style={[styles.dots, { opacity: dotsOpacity }]}>
        <Text style={styles.dotsText}>●●●</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colorPalette.neutral[100],
    borderTopWidth: 1,
    borderTopColor: colorPalette.neutral[200],
  },
  typingText: {
    fontSize: 13,
    fontStyle: "italic",
    color: colorPalette.neutral[600],
    flex: 1,
  },
  dots: {
    marginLeft: 6,
  },
  dotsText: {
    fontSize: 8,
    color: colorPalette.neutral[500],
    letterSpacing: 2,
  },
});
