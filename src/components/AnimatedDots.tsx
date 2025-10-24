import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { colorPalette } from "../utils/theme";

interface AnimatedDotsProps {
  size?: number;
  color?: string;
  gap?: number;
}

/**
 * AnimatedDots Component
 * Reusable animated dots loading indicator
 */
export const AnimatedDots: React.FC<AnimatedDotsProps> = ({
  size = 6,
  color = colorPalette.primary,
  gap = 4,
}) => {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(dot3Opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => animateDots());
    };

    animateDots();
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  };

  return (
    <View style={[styles.container, { gap }]}>
      <Animated.View style={[dotStyle, { opacity: dot1Opacity }]} />
      <Animated.View style={[dotStyle, { opacity: dot2Opacity }]} />
      <Animated.View style={[dotStyle, { opacity: dot3Opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
});
