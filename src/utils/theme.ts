import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const colors = {
  primary: "#3B82F6", // Modern blue
  primaryDark: "#2563EB", // Darker blue for pressed states
  primaryLight: "#60A5FA", // Lighter blue for hover states
  secondary: "#8B5CF6", // Purple accent
  secondaryDark: "#7C3AED",
  accent: "#EC4899", // Pink accent
  accentDark: "#DB2777",
  background: "#FFFFFF",
  backgroundSecondary: "#F9FAFB",
  surface: "#F8FAFC",
  surfaceElevated: "#FFFFFF",
  tertiary: "#06B6D4", // Cyan
  tertiaryDark: "#0891B2",
  error: "#EF4444",
  errorDark: "#DC2626",
  success: "#10B981",
  successDark: "#059669",
  warning: "#F59E0B",
  warningDark: "#D97706",
  info: "#3B82F6",
  infoDark: "#2563EB",
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    surfaceVariant: "#E2E8F0",
    onSurfaceVariant: "#475569",
    outline: "#CBD5E1",
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    tertiary: colors.tertiary,
    background: "#0F172A",
    surface: "#1E293B",
    error: colors.error,
  },
};

export const colorPalette = {
  // Gradients
  gradientBlue: ["#3B82F6", "#1D4ED8"],
  gradientBlueSoft: ["#60A5FA", "#3B82F6"],
  gradientPurple: ["#8B5CF6", "#6D28D9"],
  gradientPurpleSoft: ["#A78BFA", "#8B5CF6"],
  gradientPink: ["#EC4899", "#BE185D"],
  gradientPinkSoft: ["#F472B6", "#EC4899"],
  gradientCyan: ["#06B6D4", "#0369A1"],
  gradientCyanSoft: ["#22D3EE", "#06B6D4"],
  gradientGreen: ["#10B981", "#059669"],
  gradientOrange: ["#F59E0B", "#D97706"],
  gradientMesh: ["#667EEA", "#764BA2", "#F093FB"],

  // Individual colors
  ...colors,

  // Neutral palette (enhanced)
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    150: "#F0F0F0",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
    950: "#0A0A0A",
  },

  // Semantic colors
  semantic: {
    messageSent: "#3B82F6",
    messageReceived: "#F3F4F6",
    messageReceivedText: "#111827",
    online: "#10B981",
    offline: "#EF4444",
    away: "#F59E0B",
    typing: "#8B5CF6",
    unread: "#EF4444",
    translationBg: "#EFF6FF",
    slangBadge: "#FEF3C7",
    smartReply: "#F0F9FF",
  },

  // Shadows
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 8,
    },
    messageBubble: {
      shadowColor: "#3B82F6",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
  },
};

// Spacing system (8pt grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

// Border radius system
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Typography system
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  captionMedium: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  smallMedium: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
  },
  tiny: {
    fontSize: 10,
    fontWeight: "400" as const,
    lineHeight: 14,
  },
};

export default lightTheme;
