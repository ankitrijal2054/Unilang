import { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  TextInput as RNTextInput,
  ActivityIndicator,
} from "react-native";
import { Text, Snackbar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signIn, signInWithGoogle } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    setUser,
    setIsAuthenticated,
    setError: setStoreError,
  } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn(email, password);

      if (result.success) {
        console.log("✅ Login successful");
      } else {
        setError(result.error || "Login failed. Please try again.");
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
        console.log("✅ Google sign in successful");
      } else {
        setError(result.error || "Google sign in failed");
        setStoreError(result.error || null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google sign in failed";
      console.error("Google sign in error:", errorMessage);
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
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to your account</Text>

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

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
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
                  style={styles.loginButtonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign In Button */}
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
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up Link Section */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
                <Text style={styles.signUpLink}>Create one</Text>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: spacing.xxxl,
    gap: spacing.md,
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
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
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
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
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
  loginButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    fontSize: 16,
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
    backgroundColor: colorPalette.neutral[150],
  },
  dividerText: {
    ...typography.caption,
    color: colorPalette.neutral[500],
  },
  infoText: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 18,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacing.lg,
    gap: 0,
  },
  footerText: {
    ...typography.body,
    color: colorPalette.neutral[600],
  },
  signUpLink: {
    ...typography.bodyBold,
    color: colorPalette.primary,
  },
  snackbar: {
    backgroundColor: colorPalette.error,
    marginBottom: spacing.lg,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colorPalette.google,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
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
});
