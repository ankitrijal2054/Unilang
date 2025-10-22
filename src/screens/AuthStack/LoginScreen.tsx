import { useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { TextInput, Button, Text, Snackbar } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { signIn } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { colorPalette } from "../../utils/theme";

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

            {/* Form Card with Frosted Glass Effect */}
            <BlurView intensity={90} style={styles.blurContainer}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>Sign in to your account</Text>

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

                {/* Sign In Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  labelStyle={styles.buttonLabel}
                >
                  Sign In
                </Button>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Info Text */}
                <Text style={styles.infoText}>
                  💡 Testing tip: Use email/password to sign in
                </Text>
              </View>
            </BlurView>

            {/* Sign Up Link Section */}
            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Text
                style={styles.signUpLink}
                onPress={() => navigation.navigate("SignUp")}
              >
                Create one
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
    marginBottom: 40,
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
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 28,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  formTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colorPalette.neutral[900],
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: colorPalette.neutral[600],
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colorPalette.neutral[700],
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "rgba(248, 250, 252, 0.6)",
    borderRadius: 12,
    fontSize: 16,
  },
  loginButton: {
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: colorPalette.primary,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colorPalette.neutral[200],
  },
  dividerText: {
    marginHorizontal: 12,
    color: colorPalette.neutral[500],
    fontSize: 13,
    fontWeight: "500",
  },
  infoText: {
    fontSize: 12,
    color: colorPalette.neutral[600],
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
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
  signUpLink: {
    color: colorPalette.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: colorPalette.error,
    marginBottom: 20,
  },
});
