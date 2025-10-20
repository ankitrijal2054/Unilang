import { useState } from "react";
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
import { TextInput, Button, Text, Snackbar } from "react-native-paper";
import { signUp } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../../utils/constants";

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
    // Validation
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
        // Navigation will be handled by auth state observer in App.tsx
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Unilang</Text>
          <Text style={styles.subtitle}>Create Account</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Sign Up</Text>

          {/* Name Input */}
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            placeholder="John Doe"
            editable={!isLoading}
            style={styles.input}
          />

          {/* Email Input */}
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            style={styles.input}
          />

          {/* Password Input */}
          <TextInput
            label="Password"
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
          />

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            placeholder="••••••••"
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            editable={!isLoading}
            style={styles.input}
          />

          {/* Language Selector */}
          <View style={styles.languageContainer}>
            <Text style={styles.languageLabel}>Preferred Language</Text>
            <Button
              mode="outlined"
              onPress={() => setLanguageMenuVisible(true)}
              disabled={isLoading}
              style={styles.languageButton}
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
          >
            Create Account
          </Button>
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text
            style={styles.signInLink}
            onPress={() => navigation.navigate("Login")}
          >
            Sign In
          </Text>
        </View>
      </ScrollView>

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
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
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  form: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 12,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
  },
  input: {
    marginBottom: 16,
  },
  languageContainer: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  languageButton: {
    justifyContent: "center",
    paddingVertical: 8,
  },
  signUpButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    fontSize: 13,
  },
  signInLink: {
    color: "#2196F3",
    fontWeight: "600",
    fontSize: 13,
  },
  snackbar: {
    backgroundColor: "#f44336",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalClose: {
    fontSize: 24,
    color: "#666",
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  languageOptionSelected: {
    backgroundColor: "#e0f2f7",
    borderRadius: 5,
  },
  languageOptionText: {
    fontSize: 16,
    color: "#333",
  },
  languageOptionTextSelected: {
    fontWeight: "bold",
    color: "#2196F3",
  },
});
