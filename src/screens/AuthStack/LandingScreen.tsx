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
  gradient: [string, string];
  iconColor: string;
}

const { height, width } = Dimensions.get("window");

// Responsive spacing calculation
const getResponsiveSpacing = () => {
  const isSmallDevice = height < 700;
  const isMediumDevice = height >= 700 && height < 850;
  const isLargeDevice = height >= 850;

  return {
    headerGap: isSmallDevice
      ? spacing.sm
      : isMediumDevice
      ? spacing.md
      : spacing.lg,
    headerMarginBottom: isSmallDevice
      ? spacing.md
      : isMediumDevice
      ? spacing.lg
      : spacing.xl,
    contentPaddingTop: isSmallDevice
      ? spacing.xl
      : isMediumDevice
      ? spacing.xxxl
      : spacing.xxxl + 16,
    contentGap: isSmallDevice ? spacing.xs : spacing.sm,
    bottomSectionPadding: isSmallDevice ? spacing.md : spacing.lg,
    featureCardGap: isSmallDevice ? spacing.xs : spacing.sm,
  };
};

export const LandingScreen = ({ navigation }: LandingScreenProps) => {
  const responsiveSpacing = getResponsiveSpacing();
  const features: Feature[] = [
    {
      icon: "message-text",
      title: "Real-time Chat",
      description: "Instant messaging with read receipts",
      gradient: ["#E3F2FD", "#BBDEFB"],
      iconColor: "#1976D2",
    },
    {
      icon: "translate",
      title: "AI Translation",
      description: "Break language barriers seamlessly",
      gradient: ["#F3E5F5", "#E1BEE7"],
      iconColor: "#7B1FA2",
    },
    {
      icon: "lightbulb-on",
      title: "Smart Replies",
      description: "AI-powered suggestions & tone adjustment",
      gradient: ["#FFF3E0", "#FFE0B2"],
      iconColor: "#E65100",
    },
    {
      icon: "account-multiple",
      title: "Group Chat",
      description: "Connect with multiple people at once",
      gradient: ["#E8F5E9", "#C8E6C9"],
      iconColor: "#2E7D32",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#F5F7FF", "#E8F1FF", "#F0E6FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Enhanced Background Doodle Elements */}
        <View style={styles.doodleTopLeft}>
          <View style={styles.doodle1} />
        </View>
        <View style={styles.doodleTopRight}>
          <View style={styles.doodle3} />
        </View>
        <View style={styles.doodleBottomRight}>
          <View style={styles.doodle2} />
        </View>

        <View style={styles.content}>
          {/* Header Section */}
          <View
            style={[
              styles.headerSection,
              {
                gap: responsiveSpacing.headerGap,
                marginBottom: responsiveSpacing.headerMarginBottom,
              },
            ]}
          >
            {/* Logo - Enhanced */}
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

            {/* Title */}
            <Text style={styles.appName}>Unilang</Text>
            <Text style={styles.tagline}>Chat freely, in any language</Text>
          </View>

          {/* Features Grid - Enhanced */}
          <View
            style={[
              styles.featuresContainer,
              { gap: responsiveSpacing.featureCardGap },
            ]}
          >
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                {/* Feature Icon Background */}
                <LinearGradient
                  colors={feature.gradient as [string, string]}
                  style={styles.featureIconBg}
                >
                  <MaterialCommunityIcons
                    name={feature.icon as any}
                    size={28}
                    color={feature.iconColor}
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
        <View
          style={[
            styles.bottomSection,
            {
              paddingVertical: responsiveSpacing.bottomSectionPadding,
              paddingHorizontal: responsiveSpacing.bottomSectionPadding,
            },
          ]}
        >
          {/* Sign In Button - Primary CTA */}
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

          {/* Sign Up Button - Secondary CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate("SignUp")}
            style={styles.signUpButton}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpButtonText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FF",
  },
  gradient: {
    flex: 1,
  },
  // Enhanced Background Doodle Elements
  doodleTopLeft: {
    position: "absolute",
    top: -80,
    left: -60,
    zIndex: 0,
  },
  doodle1: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#3B82F6",
    opacity: 0.06,
  },
  doodleTopRight: {
    position: "absolute",
    top: 100,
    right: -100,
    zIndex: 0,
  },
  doodle3: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#8B5CF6",
    opacity: 0.05,
  },
  doodleBottomRight: {
    position: "absolute",
    bottom: -80,
    right: -40,
    zIndex: 0,
  },
  doodle2: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#3B82F6",
    opacity: 0.04,
  },
  content: {
    flex: 1,
    paddingHorizontal: width < 400 ? spacing.md : spacing.lg,
    paddingTop: height < 700 ? spacing.xl : spacing.xxxl,
    justifyContent: "space-between",
    zIndex: 1,
  },
  headerSection: {
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    ...colorPalette.shadows.medium,
  },
  appName: {
    ...typography.h1,
    color: colorPalette.primary,
    fontSize: width < 400 ? 32 : 36,
    fontWeight: "700",
  },
  tagline: {
    ...typography.body,
    color: colorPalette.neutral[600],
    fontSize: width < 400 ? 14 : 16,
  },
  featuresContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
    marginVertical: height < 700 ? spacing.sm : spacing.md,
  },
  featureCard: {
    width: "48%",
    backgroundColor: colorPalette.white,
    borderRadius: borderRadius.xl,
    padding: width < 400 ? spacing.md : spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colorPalette.neutral[100],
    ...colorPalette.shadows.small,
  },
  featureIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  featureTitle: {
    ...typography.bodyBold,
    color: colorPalette.neutral[950],
    marginBottom: spacing.xs,
    textAlign: "center",
    fontSize: width < 400 ? 12 : 14,
    fontWeight: "600",
  },
  featureDescription: {
    ...typography.caption,
    color: colorPalette.neutral[600],
    textAlign: "center",
    lineHeight: 16,
    fontSize: width < 400 ? 11 : 12,
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
    paddingVertical: height < 700 ? spacing.md : spacing.lg,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  signInButtonText: {
    ...typography.bodyBold,
    color: "#FFFFFF",
    fontSize: width < 400 ? 14 : 16,
    fontWeight: "600",
  },
  signUpButton: {
    paddingVertical: height < 700 ? spacing.md : spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colorPalette.primary,
    borderRadius: borderRadius.lg,
    backgroundColor: colorPalette.background,
  },
  signUpButtonText: {
    ...typography.bodyBold,
    color: colorPalette.primary,
    fontSize: width < 400 ? 14 : 16,
    fontWeight: "600",
  },
});
