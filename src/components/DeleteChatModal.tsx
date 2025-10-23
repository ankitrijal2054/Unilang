import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colorPalette } from "../utils/theme";

interface DeleteChatModalProps {
  visible: boolean;
  chatName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteChatModal: React.FC<DeleteChatModalProps> = ({
  visible,
  chatName,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalContainer}>
            {/* Warning Icon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={56}
                color={colorPalette.error}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>Delete Chat?</Text>

            {/* Message */}
            <Text style={styles.message}>
              This will delete <Text style={styles.chatName}>"{chatName}"</Text>{" "}
              for you only. Other participants will still see it.
            </Text>

            {/* Note */}
            <View style={styles.noteContainer}>
              <MaterialCommunityIcons
                name="information"
                size={16}
                color={colorPalette.neutral[600]}
              />
              <Text style={styles.noteText}>This action cannot be undone</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onCancel}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={onConfirm}
                style={styles.deleteButton}
                buttonColor={colorPalette.error}
                labelStyle={styles.deleteButtonLabel}
              >
                Delete
              </Button>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colorPalette.background,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: colorPalette.neutral[700],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  chatName: {
    fontWeight: "700",
    color: colorPalette.primary,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.neutral[100],
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 6,
  },
  noteText: {
    fontSize: 13,
    color: colorPalette.neutral[600],
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderColor: colorPalette.neutral[300],
  },
  cancelButtonLabel: {
    color: colorPalette.neutral[700],
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
  },
  deleteButtonLabel: {
    fontWeight: "600",
  },
});
