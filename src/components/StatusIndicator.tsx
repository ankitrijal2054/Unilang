import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface StatusIndicatorProps {
  status: "sending" | "sent" | "delivered" | "read";
  size?: number;
}

/**
 * StatusIndicator Component
 * Displays message status with appropriate icons and colors
 * ✓ sending (gray)
 * ✓ sent (gray)
 * ✓✓ delivered (gray)
 * ✓✓ read (blue)
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 14,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return (
          <MaterialCommunityIcons
            name="clock-outline"
            size={size}
            color="#999"
          />
        );
      case "sent":
        return <MaterialCommunityIcons name="check" size={size} color="#999" />;
      case "delivered":
        return (
          <View style={styles.doubleCheckContainer}>
            <MaterialCommunityIcons
              name="check"
              size={size}
              color="#999"
              style={styles.checkIcon}
            />
            <MaterialCommunityIcons
              name="check"
              size={size}
              color="#999"
              style={styles.checkIcon}
            />
          </View>
        );
      case "read":
        return (
          <View style={styles.doubleCheckContainer}>
            <MaterialCommunityIcons
              name="check"
              size={size}
              color="#2196F3"
              style={styles.checkIcon}
            />
            <MaterialCommunityIcons
              name="check"
              size={size}
              color="#2196F3"
              style={styles.checkIcon}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{getStatusIcon()}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
  },
  doubleCheckContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: 16,
  },
  checkIcon: {
    marginHorizontal: -4,
  },
});
