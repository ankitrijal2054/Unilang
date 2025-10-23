import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { Text, IconButton } from "react-native-paper";
import { colorPalette } from "../utils/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

interface ImageZoomModalProps {
  visible: boolean;
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  caption?: string;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  visible,
  imageUrl,
  imageWidth = 800,
  imageHeight = 600,
  caption,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Calculate display dimensions (fit to screen, maintain aspect ratio)
  const aspectRatio = imageWidth / imageHeight;
  let displayWidth = SCREEN_WIDTH;
  let displayHeight = displayWidth / aspectRatio;

  // If too tall, fit to height instead
  if (displayHeight > SCREEN_HEIGHT * 0.8) {
    displayHeight = SCREEN_HEIGHT * 0.8;
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
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      {/* Hide status bar for immersive experience */}
      <StatusBar hidden={visible} />

      <View style={styles.container}>
        {/* Background overlay (tap to close) */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.content}>
            {/* Close button */}
            <View style={styles.header}>
              <IconButton
                icon="close"
                iconColor="#fff"
                size={28}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            {/* Image */}
            <View style={styles.imageWrapper}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
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
                  resizeMode="contain"
                  onLoadEnd={handleLoadEnd}
                  onError={handleError}
                />
              )}
            </View>

            {/* Caption (if exists) */}
            {caption && caption !== "📷 Image" && (
              <View style={styles.captionContainer}>
                <Text style={styles.caption}>{caption}</Text>
              </View>
            )}

            {/* Hint text */}
            <View style={styles.footer}>
              <Text style={styles.hintText}>Tap anywhere to close</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  overlay: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    right: 10,
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  imageWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    borderRadius: 8,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#fff",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#fff",
  },
  captionContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 8,
    padding: 12,
  },
  caption: {
    fontSize: 14,
    color: "#fff",
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 40,
  },
  hintText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
  },
});
