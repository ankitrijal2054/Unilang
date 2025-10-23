import React, { useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Text, Button, Portal, Dialog, Divider } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colorPalette } from "../utils/theme";

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onAvatarSelected: (imageUri: string) => void;
  isLoading?: boolean;
}

/**
 * AvatarPickerModal Component
 * Allows users to select or remove profile picture
 */
export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  onAvatarSelected,
  isLoading = false,
}) => {
  const [pickerLoading, setPickerLoading] = useState(false);

  const handleTakePhoto = async () => {
    try {
      setPickerLoading(true);

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Camera permission is required to take photos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onAvatarSelected(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      alert("Failed to take photo. Please try again.");
    } finally {
      setPickerLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      setPickerLoading(true);

      // Request library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Photo library permission is required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onAvatarSelected(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error("Error choosing image:", error);
      alert("Failed to select image. Please try again.");
    } finally {
      setPickerLoading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        {/* Header */}
        <Dialog.Title style={styles.title}>Change Profile Picture</Dialog.Title>

        {/* Content */}
        <Dialog.Content>
          {pickerLoading || isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={colorPalette.primary}
                style={styles.spinner}
              />
              <Text style={styles.loadingText}>Processing image...</Text>
            </View>
          ) : (
            <View style={styles.optionsContainer}>
              {/* Take Photo Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePhoto}
                disabled={pickerLoading || isLoading}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={28}
                  color={colorPalette.primary}
                  style={styles.optionIcon}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Take Photo</Text>
                  <Text style={styles.optionDescription}>
                    Use camera to capture
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colorPalette.neutral[400]}
                />
              </TouchableOpacity>

              <Divider style={styles.optionDivider} />

              {/* Choose from Library Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleChooseFromLibrary}
                disabled={pickerLoading || isLoading}
              >
                <MaterialCommunityIcons
                  name="image"
                  size={28}
                  color={colorPalette.primary}
                  style={styles.optionIcon}
                />
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Choose from Library</Text>
                  <Text style={styles.optionDescription}>
                    Select existing photo
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colorPalette.neutral[400]}
                />
              </TouchableOpacity>
            </View>
          )}
        </Dialog.Content>

        {/* Actions */}
        <Dialog.Actions>
          <Button
            onPress={onClose}
            disabled={pickerLoading || isLoading}
            labelStyle={styles.cancelButtonLabel}
          >
            Cancel
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 16,
  },
  spinner: {
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: colorPalette.neutral[600],
    fontWeight: "500",
  },
  optionsContainer: {
    gap: 0,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  optionIcon: {
    width: 44,
    textAlign: "center",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colorPalette.neutral[900],
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: colorPalette.neutral[600],
  },
  optionDivider: {
    marginVertical: 0,
  },
  cancelButtonLabel: {
    color: colorPalette.neutral[700],
    fontWeight: "600",
  },
});
