import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const colors = {
  primary: "#3B82F6", // Modern blue
  secondary: "#8B5CF6", // Purple accent
  accent: "#EC4899", // Pink accent
  background: "#FFFFFF",
  surface: "#F8FAFC",
  tertiary: "#06B6D4", // Cyan
  error: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
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
  gradientPurple: ["#8B5CF6", "#6D28D9"],
  gradientPink: ["#EC4899", "#BE185D"],
  gradientCyan: ["#06B6D4", "#0369A1"],

  // Individual colors
  ...colors,

  // Neutral palette
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

export default lightTheme;
