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
  TextInput as RNTextInput,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Snackbar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signUp, signInWithGoogle } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from "../../utils/constants";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        setError("Failed to get Google credentials");
        setIsLoading(false);
        return;
      }

      const result = await signInWithGoogle(idToken);

      if (result.success) {
        console.log("✅ Google sign up successful");
      } else {
        setError(result.error || "Google sign up failed");
        setStoreError(result.error || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google sign up failed";
      console.error("Google sign up error:", errorMessage);
      setError(errorMessage);
      setStoreError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#F5F7FF", "#E8F1FF", "#F0E6FF"]}
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
              <LinearGradient
                colors={
                  colorPalette.gradientBlue as [string, string, ...string[]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <MaterialCommunityIcons
                  name="message-text"
                  size={40}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <Text style={styles.appName}>Unilang</Text>
              <Text style={styles.tagline}>Chat freely, in any language</Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Join Unilang</Text>
              <Text style={styles.formSubtitle}>Create your account</Text>

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={18}
                    color={colorPalette.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="John Doe"
                    placeholderTextColor={colorPalette.neutral[400]}
                    editable={!isLoading}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={18}
                    color={colorPalette.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colorPalette.neutral[400]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={18}
                    color={colorPalette.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colorPalette.neutral[400]}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    style={styles.visibilityButton}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color={colorPalette.neutral[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={18}
                    color={colorPalette.neutral[500]}
                    style={styles.inputIcon}
                  />
                  <RNTextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colorPalette.neutral[400]}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    style={styles.visibilityButton}
                  >
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={18}
                      color={colorPalette.neutral[500]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Language Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Language</Text>
                <TouchableOpacity
                  onPress={() => setLanguageMenuVisible(true)}
                  disabled={isLoading}
                  style={styles.languageButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageButtonContent}>
                    <MaterialCommunityIcons
                      name="translate"
                      size={18}
                      color={colorPalette.neutral[500]}
                      style={styles.inputIcon}
                    />
                    <Text style={styles.languageButtonLabel}>
                      {selectedLanguageLabel}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={colorPalette.neutral[400]}
                  />
                </TouchableOpacity>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={isLoading}
                style={[
                  styles.signUpButton,
                  isLoading && styles.signUpButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isLoading
                      ? [colorPalette.neutral[300], colorPalette.neutral[300]]
                      : (colorPalette.gradientBlue as [
                          string,
                          string,
                          ...string[]
                        ])
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.signUpButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign Up Button */}
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                style={styles.googleButton}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="google"
                  size={20}
                  color="#FFFFFF"
                  style={styles.googleButtonIcon}
                />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Link Section */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.signInLink}>Sign in</Text>
              </TouchableOpacity>
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

      {/* Language Picker Modal - Bottom Sheet Style */}
      <Modal
        visible={languageMenuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setLanguageMenuVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          {/* Tap outside to close */}
          <TouchableOpacity
            style={styles.pickerModalTapArea}
            onPress={() => setLanguageMenuVisible(false)}
            activeOpacity={1}
          />

          {/* Bottom Sheet Picker */}
          <View style={styles.pickerBottomSheet}>
            {/* Handle Bar */}
            <View style={styles.pickerHandleContainer}>
              <View style={styles.pickerHandle} />
            </View>

            {/* Header with Done Button */}
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setLanguageMenuVisible(false)}
                style={styles.pickerDoneButton}
              >
                <Text style={styles.pickerDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Language Wheel */}
            <FlatList
              data={SUPPORTED_LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerLanguageOption,
                    selectedLanguage === item.code &&
                      styles.pickerLanguageOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(item.code);
                    setLanguageMenuVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.pickerLanguageOptionText,
                      selectedLanguage === item.code &&
                        styles.pickerLanguageOptionTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedLanguage === item.code && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={colorPalette.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.pickerLanguageListContainer}
              scrollEnabled={true}
              nestedScrollEnabled={true}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorPalette.background,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  appName: {
    ...typography.h2,
    color: colorPalette.primary,
  },
  tagline: {
    ...typography.body,
    color: colorPalette.neutral[600],
  },
  formCard: {
    backgroundColor: colorPalette.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderColor: colorPalette.neutral[100],
    ...colorPalette.shadows.medium,
  },
  formTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.body,
    color: colorPalette.neutral[600],
    marginBottom: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  inputLabel: {
    ...typography.bodyBold,
    color: colorPalette.neutral[700],
    fontSize: 13,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colorPalette.neutral[150],
    height: 48,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    ...typography.body,
    color: colorPalette.neutral[950],
    fontSize: 15,
    lineHeight: 15,
    paddingVertical: 0,
    marginVertical: 0,
  },
  visibilityButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colorPalette.neutral[150],
    height: 48,
  },
  languageButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  languageButtonLabel: {
    ...typography.body,
    color: colorPalette.neutral[700],
  },
  signUpButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  signUpButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.xs,
    gap: 0,
  },
  footerText: {
    ...typography.body,
    color: colorPalette.neutral[600],
  },
  signInLink: {
    ...typography.bodyBold,
    color: colorPalette.primary,
  },
  snackbar: {
    backgroundColor: colorPalette.error,
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colorPalette.neutral[200],
  },
  dividerText: {
    ...typography.body,
    color: colorPalette.neutral[600],
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.google,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...colorPalette.shadows.medium,
  },
  googleButtonIcon: {
    marginRight: spacing.sm,
  },
  googleButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerModalTapArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pickerBottomSheet: {
    backgroundColor: colorPalette.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    ...colorPalette.shadows.large,
  },
  pickerHandleContainer: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    backgroundColor: colorPalette.neutral[300],
    borderRadius: 2,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  pickerTitle: {
    ...typography.h3,
    color: colorPalette.neutral[950],
  },
  pickerDoneButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  pickerDoneButtonText: {
    ...typography.bodyBold,
    color: colorPalette.primary,
  },
  pickerLanguageListContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  pickerLanguageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colorPalette.neutral[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colorPalette.neutral[150],
  },
  pickerLanguageOptionSelected: {
    backgroundColor: colorPalette.primary,
    borderColor: colorPalette.primary,
  },
  pickerLanguageOptionText: {
    ...typography.body,
    color: colorPalette.neutral[900],
  },
  pickerLanguageOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
