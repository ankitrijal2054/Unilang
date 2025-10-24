import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colorPalette, spacing, borderRadius } from "../utils/theme";

/**
 * SkeletonChatItem Component
 * Displays a loading placeholder for chat list items with shimmer animation
 */
export const SkeletonChatItem: React.FC = () => {
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
    <View style={styles.container}>
      {/* Avatar skeleton */}
      <Animated.View style={[styles.avatar, { opacity }]} />

      {/* Chat info skeleton */}
      <View style={styles.chatInfo}>
        <View style={styles.header}>
          <Animated.View style={[styles.nameBar, { opacity }]} />
          <Animated.View style={[styles.timeBar, { opacity }]} />
        </View>
        <Animated.View style={[styles.messageBar, { opacity }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[100],
    backgroundColor: colorPalette.background,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colorPalette.neutral[200],
    marginRight: 14,
  },
  chatInfo: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  nameBar: {
    width: 140,
    height: 16,
    borderRadius: borderRadius.xs,
    backgroundColor: colorPalette.neutral[200],
  },
  timeBar: {
    width: 50,
    height: 12,
    borderRadius: borderRadius.xs,
    backgroundColor: colorPalette.neutral[200],
  },
  messageBar: {
    width: "80%",
    height: 14,
    borderRadius: borderRadius.xs,
    backgroundColor: colorPalette.neutral[200],
  },
});
