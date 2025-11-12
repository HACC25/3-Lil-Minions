// hooks/useThemeColors.ts
import { ColorScheme } from "../lib/types";

export const useThemeColors = (isLightMode: boolean): ColorScheme => {
  const colors = {
    light: {
      background: "#FFFFFF",
      cardBackground: "#FDFDFF",
      text: "#1A202C",
      textPrimary: "#1A202C",
      textSecondary: "#4A5568",
      inputBackground: "#F7FAFC",
      inputBorder: "#E2E8F0",
      inputFocus: "#3A40C6",
      buttonPrimary: "#3A40C6",
      buttonSecondary: "#3A40C6",
      buttonText: "#FFFFFF",
      buttonTextSecondary: "#fff",
      success: "#10B981",
      successBg: "#ECFDF5",
      accent: "#3A40C6",
      shadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
      borderAccent: "#3A40C6",
      warning: "#F59E0B",
      warningBg: "#FEF3C7",
      sectionBg: "#F9FAFB",
      divider: "#E5E7EB",
    },
    dark: {
      background: "#0F172A",
      cardBackground: "#040411",
      text: "#F8FAFC",
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      inputBackground: "#040411",
      inputBorder: "#475569",
      inputFocus: "#60A5FA",
      buttonPrimary: "#3A40C6",
      buttonSecondary: "#3A40C6",
      buttonText: "#FFFFFF",
      buttonTextSecondary: "#E2E8F0",
      success: "#10B981",
      successBg: "#064E3B",
      accent: "#60A5FA",
      shadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
      borderAccent: "#60A5FA",
      warning: "#F59E0B",
      warningBg: "#92400E",
      sectionBg: "#1E293B",
      divider: "#334155",
    },
  };

  return isLightMode ? colors.light : colors.dark;
};
