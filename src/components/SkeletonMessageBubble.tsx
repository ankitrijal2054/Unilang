import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colorPalette, spacing, borderRadius } from "../utils/theme";

interface SkeletonMessageBubbleProps {
  isOwnMessage?: boolean;
}

/**
 * SkeletonMessageBubble Component
 * Displays a loading placeholder for message bubbles with shimmer animation
 */
export const SkeletonMessageBubble: React.FC<SkeletonMessageBubbleProps> = ({
  isOwnMessage = false,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        styles.container,
        isOwnMessage ? styles.ownContainer : styles.otherContainer,
      ]}
    >
      <Animated.View
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          { opacity },
        ]}
      >
        <View style={styles.textLine1} />
        <View style={styles.textLine2} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    flexDirection: "row",
  },
  ownContainer: {
    justifyContent: "flex-end",
  },
  otherContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    maxWidth: "75%",
  },
  ownBubble: {
    backgroundColor: colorPalette.primary,
    opacity: 0.2,
  },
  otherBubble: {
    backgroundColor: colorPalette.neutral[200],
  },
  textLine1: {
    width: 150,
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colorPalette.neutral[300],
    marginBottom: spacing.xs,
  },
  textLine2: {
    width: 100,
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colorPalette.neutral[300],
  },
});
