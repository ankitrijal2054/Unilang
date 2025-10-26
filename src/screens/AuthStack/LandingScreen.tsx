import {
  StyleSheet,
  View,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  colorPalette,
  spacing,
  borderRadius,
  typography,
} from "../../utils/theme";

interface LandingScreenProps {
  navigation: any;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const { height } = Dimensions.get("window");

export const LandingScreen = ({ navigation }: LandingScreenProps) => {
  const features: Feature[] = [
    {
      icon: "message-text",
      title: "Real-time Chat",
      description: "Instant messaging with read receipts",
    },
    {
      icon: "translate",
      title: "AI Translation",
      description: "Break language barriers seamlessly",
    },
    {
      icon: "lightbulb-on",
      title: "Smart Replies",
      description: "AI-powered suggestions & tone adjustment",
    },
    {
      icon: "account-multiple",
      title: "Group Chat",
      description: "Connect with multiple people at once",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colorPalette.background, colorPalette.neutral[50]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Doodle Elements */}
        <View style={styles.doodleTopLeft}>
          <View style={styles.doodle1} />
        </View>
        <View style={styles.doodleBottomRight}>
          <View style={styles.doodle2} />
        </View>

        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Logo - Using gradient blue like LoginScreen */}
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

            {/* Title - Using primary color like LoginScreen */}
            <Text style={styles.appName}>Unilang</Text>
            <Text style={styles.tagline}>Chat freely, in any language</Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                {/* Feature Icon Background */}
                <LinearGradient
                  colors={[
                    index === 0
                      ? "#E3F2FD"
                      : index === 1
                      ? "#F3E5F5"
                      : index === 2
                      ? "#FFF3E0"
                      : "#E8F5E9",
                    index === 0
                      ? "#BBDEFB"
                      : index === 1
                      ? "#E1BEE7"
                      : index === 2
                      ? "#FFE0B2"
                      : "#C8E6C9",
                  ]}
                  style={styles.featureIconBg}
                >
                  <MaterialCommunityIcons
                    name={feature.icon as any}
                    size={24}
                    color={
                      index === 0
                        ? "#1976D2"
                        : index === 1
                        ? "#7B1FA2"
                        : index === 2
                        ? "#E65100"
                        : "#2E7D32"
                    }
                  />
                </LinearGradient>

                {/* Feature Text */}
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>
                  {feature.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Section - Buttons */}
        <View style={styles.bottomSection}>
          {/* Sign In Button - Match LoginScreen style */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.signInButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                colorPalette.gradientBlue as [string, string, ...string[]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInButtonGradient}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign Up Button - Match LoginScreen style */}
          <TouchableOpacity
            onPress={() => navigation.navigate("SignUp")}
            style={styles.signUpButton}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
  // Background Doodle Elements
  doodleTopLeft: {
    position: "absolute",
    top: -40,
    left: -40,
    zIndex: 0,
  },
  doodle1: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colorPalette.primary,
    opacity: 0.05,
  },
  doodleBottomRight: {
    position: "absolute",
    bottom: -60,
    right: -60,
    zIndex: 0,
  },
  doodle2: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colorPalette.primary,
    opacity: 0.04,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    justifyContent: "space-between",
    zIndex: 1,
  },
  headerSection: {
    alignItems: "center",
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
  featuresContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  featureCard: {
    width: "48%",
    backgroundColor: colorPalette.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colorPalette.neutral[100],
    ...colorPalette.shadows.small,
  },
  featureIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  featureDescription: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 16,
  },
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    zIndex: 1,
  },
  signInButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...colorPalette.shadows.medium,
  },
  signInButtonGradient: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonText: {
    ...typography.bodyBold,
    color: colorPalette.white,
    fontSize: 16,
  },
  signUpButton: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colorPalette.primary,
    borderRadius: borderRadius.lg,
    backgroundColor: colorPalette.background,
  },
  signUpButtonText: {
    ...typography.bodyBold,
    color: colorPalette.primary,
    fontSize: 16,
  },
});
