import React, { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Button, Text, Snackbar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { signUp } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../../utils/constants";
import { colorPalette } from "../../utils/theme";

interface SignUpScreenProps {
  navigation: any;
}

export const SignUpScreen = ({ navigation }: SignUpScreenProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);

  const {
    setUser,
    setIsAuthenticated,
    setError: setStoreError,
  } = useAuthStore();

  const selectedLanguageLabel =
    SUPPORTED_LANGUAGES.find((lang) => lang.code === selectedLanguage)?.name ||
    "Select Language";

  const handleSignUp = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signUp(email, password, name, selectedLanguage);

      if (result.success) {
        console.log("✅ Sign up successful");
      } else {
        setError(result.error || "Sign up failed. Please try again.");
        setStoreError(result.error || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setStoreError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#F8FAFC", "#E2E8F0"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Text style={styles.appName}>Unilang</Text>
              </View>
              <Text style={styles.tagline}>Chat freely, in any language</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Join Unilang</Text>
              <Text style={styles.formSubtitle}>Create your account</Text>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  mode="outlined"
                  placeholder="John Doe"
                  editable={!isLoading}
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor={colorPalette.primary}
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor={colorPalette.primary}
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  editable={!isLoading}
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor={colorPalette.primary}
                />
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  mode="outlined"
                  placeholder="••••••••"
                  secureTextEntry={!showConfirmPassword}
                  right={
                    <TextInput.Icon
                      icon={showConfirmPassword ? "eye-off" : "eye"}
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  }
                  editable={!isLoading}
                  style={styles.input}
                  outlineColor="#E2E8F0"
                  activeOutlineColor={colorPalette.primary}
                />
              </View>

              {/* Language Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Language</Text>
                <Button
                  mode="outlined"
                  onPress={() => setLanguageMenuVisible(true)}
                  disabled={isLoading}
                  style={styles.languageButton}
                  labelStyle={styles.languageButtonLabel}
                >
                  {selectedLanguageLabel}
                </Button>
              </View>

              {/* Sign Up Button */}
              <Button
                mode="contained"
                onPress={handleSignUp}
                loading={isLoading}
                disabled={isLoading}
                style={styles.signUpButton}
                labelStyle={styles.buttonLabel}
              >
                Create Account
              </Button>
            </View>

            {/* Sign In Link Section */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Text
                style={styles.signInLink}
                onPress={() => navigation.navigate("Login")}
              >
                Sign in
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>

      {/* Language Picker Modal */}
      <Modal
        visible={languageMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageMenuVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <TouchableOpacity onPress={() => setLanguageMenuVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={SUPPORTED_LANGUAGES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === item.code &&
                    styles.languageOptionSelected,
                ]}
                onPress={() => {
                  setSelectedLanguage(item.code);
                  setLanguageMenuVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.languageOptionText,
                    selectedLanguage === item.code &&
                      styles.languageOptionTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.languageListContainer}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 42,
    fontWeight: "700",
    color: colorPalette.primary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: colorPalette.neutral[600],
    fontWeight: "500",
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: colorPalette.neutral[600],
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colorPalette.neutral[700],
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "rgba(248, 250, 252, 0.6)",
    borderRadius: 12,
    fontSize: 16,
  },
  languageButton: {
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "rgba(248, 250, 252, 0.6)",
  },
  languageButtonLabel: {
    fontSize: 16,
    color: colorPalette.neutral[700],
  },
  signUpButton: {
    marginTop: 6,
    paddingVertical: 12,
    backgroundColor: colorPalette.primary,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
  },
  footerText: {
    color: colorPalette.neutral[600],
    fontSize: 14,
  },
  signInLink: {
    color: colorPalette.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: colorPalette.error,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colorPalette.neutral[300],
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorPalette.neutral[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colorPalette.neutral[900],
  },
  modalClose: {
    fontSize: 24,
    color: colorPalette.neutral[600],
    fontWeight: "600",
  },
  languageListContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colorPalette.neutral[100],
    borderRadius: 12,
  },
  languageOptionSelected: {
    backgroundColor: colorPalette.primary,
  },
  languageOptionText: {
    fontSize: 16,
    color: colorPalette.neutral[900],
    fontWeight: "500",
  },
  languageOptionTextSelected: {
    color: "white",
    fontWeight: "700",
  },
});
