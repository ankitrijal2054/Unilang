import React, { useState } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { colorPalette } from "../utils/theme";

const MAX_IMAGE_WIDTH = Dimensions.get("window").width * 0.65; // 65% of screen width
const MAX_IMAGE_HEIGHT = 400;

interface ImageMessageProps {
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  caption?: string;
  onPress: () => void;
  isOwnMessage: boolean;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  imageUrl,
  imageWidth = 800,
  imageHeight = 600,
  caption,
  onPress,
  isOwnMessage,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Calculate display dimensions (maintain aspect ratio)
  const aspectRatio = imageWidth / imageHeight;
  let displayWidth = MAX_IMAGE_WIDTH;
  let displayHeight = displayWidth / aspectRatio;

  // Cap height if too tall
  if (displayHeight > MAX_IMAGE_HEIGHT) {
    displayHeight = MAX_IMAGE_HEIGHT;
    displayWidth = displayHeight * aspectRatio;
  }

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.imageContainer,
          { width: displayWidth, height: displayHeight },
        ]}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colorPalette.primary} />
            <Text style={styles.loadingText}>Loading image...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Failed to load image</Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              { width: displayWidth, height: displayHeight },
            ]}
            resizeMode="cover"
            onLoadEnd={handleLoadEnd}
            onError={handleError}
          />
        )}

        {/* Tap to zoom overlay */}
        {!loading && !error && (
          <View style={styles.overlay}>
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomIcon}>🔍</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      {/* Optional caption below image */}
      {caption && caption !== "📷 Image" && (
        <Text
          style={[
            styles.caption,
            { color: isOwnMessage ? colorPalette.background : "#000" },
          ]}
        >
          {caption}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colorPalette.neutral[200],
    position: "relative",
  },
  image: {
    borderRadius: 12,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral[100],
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colorPalette.neutral[600],
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colorPalette.neutral[200],
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: colorPalette.neutral[600],
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 8,
  },
  zoomIndicator: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 6,
    paddingHorizontal: 10,
  },
  zoomIcon: {
    fontSize: 16,
  },
  caption: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 18,
  },
});
