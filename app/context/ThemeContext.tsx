// app/context/ThemeContext.tsx - Theme Context with Color Palettes and Dark Mode
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { updateUserTheme } from "../../services/api";
import { useSmartKitchen } from "./SmartKitchenContext";

// Color Palettes
export const COLOR_PALETTES = {
  pink: {
    name: "Pink",
    emoji: "🌸",
    primary: "#E91E63",
    primaryLight: "#FCE4EC",
    primaryDark: "#C2185B",
    gradient1: "#E91E63",
    gradient2: "#F48FB1",
    accent: "#FF4081",
  },
  blue: {
    name: "Blue",
    emoji: "💙",
    primary: "#2196F3",
    primaryLight: "#E3F2FD",
    primaryDark: "#1565C0",
    gradient1: "#2196F3",
    gradient2: "#64B5F6",
    accent: "#448AFF",
  },
  green: {
    name: "Green",
    emoji: "🌿",
    primary: "#4CAF50",
    primaryLight: "#E8F5E9",
    primaryDark: "#2E7D32",
    gradient1: "#4CAF50",
    gradient2: "#81C784",
    accent: "#69F0AE",
  },
  yellow: {
    name: "Yellow",
    emoji: "☀️",
    primary: "#FF9800",
    primaryLight: "#FFF3E0",
    primaryDark: "#EF6C00",
    gradient1: "#FF9800",
    gradient2: "#FFB74D",
    accent: "#FFD740",
  },
  purple: {
    name: "Purple",
    emoji: "💜",
    primary: "#9C27B0",
    primaryLight: "#F3E5F5",
    primaryDark: "#6A1B9A",
    gradient1: "#9C27B0",
    gradient2: "#BA68C8",
    accent: "#E040FB",
  },
};

export type PaletteKey = keyof typeof COLOR_PALETTES;

// Light/Dark mode themes
export const getTheme = (palette: PaletteKey, isDark: boolean) => {
  const colors = COLOR_PALETTES[palette];
  
  if (isDark) {
    return {
      ...colors,
      background: "#121212",
      cardBg: "#1E1E1E",
      text: "#FFFFFF",
      textSecondary: "#A0A0A0",
      border: "#2C2C2C",
      success: "#4CAF50",
      error: "#F44336",
      inputBg: "#2C2C2C",
      isDark: true,
    };
  }
  
  return {
    ...colors,
    background: palette === "pink" ? "#FFF8FA" : 
                palette === "blue" ? "#F5F9FF" :
                palette === "green" ? "#F5FFF5" :
                palette === "yellow" ? "#FFFDF5" :
                "#FDF5FF",
    cardBg: "#FFFFFF",
    text: "#1A1A2E",
    textSecondary: "#6B7280",
    border: palette === "pink" ? "#F3E8EB" :
            palette === "blue" ? "#E3EDF7" :
            palette === "green" ? "#E3F3E3" :
            palette === "yellow" ? "#F7F3E3" :
            "#F3E3F7",
    success: "#10B981",
    error: "#DC2626",
    inputBg: "#FFFBFC",
    isDark: false,
  };
};

export type Theme = ReturnType<typeof getTheme>;

interface ThemeContextType {
  palette: PaletteKey;
  isDarkMode: boolean;
  theme: Theme;
  setPalette: (palette: PaletteKey) => void;
  setDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useSmartKitchen();
  const [palette, setPaletteState] = useState<PaletteKey>("pink");
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from user data or local storage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // First, try to load from user data (per-user theme)
        if (user?.theme_palette && COLOR_PALETTES[user.theme_palette as PaletteKey]) {
          setPaletteState(user.theme_palette as PaletteKey);
          setIsDarkModeState(user.theme_dark_mode || false);
        } else {
          // Fallback to local storage
          const savedPalette = await AsyncStorage.getItem("@theme_palette");
          const savedDarkMode = await AsyncStorage.getItem("@theme_dark_mode");
          
          if (savedPalette && COLOR_PALETTES[savedPalette as PaletteKey]) {
            setPaletteState(savedPalette as PaletteKey);
          }
          if (savedDarkMode !== null) {
            setIsDarkModeState(savedDarkMode === "true");
          }
        }
      } catch (error) {
        console.error("Error loading theme preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, [user]);

  const setPalette = async (newPalette: PaletteKey) => {
    setPaletteState(newPalette);
    try {
      await AsyncStorage.setItem("@theme_palette", newPalette);
      // Save to backend if user is logged in
      if (user) {
        try {
          const updatedUser = await updateUserTheme(newPalette, isDarkMode);
          // Update user in context
          updateUser(updatedUser);
        } catch (error) {
          console.error("Error saving palette to backend:", error);
        }
      }
    } catch (error) {
      console.error("Error saving palette:", error);
    }
  };

  const setDarkMode = async (isDark: boolean) => {
    setIsDarkModeState(isDark);
    try {
      await AsyncStorage.setItem("@theme_dark_mode", isDark.toString());
      // Save to backend if user is logged in
      if (user) {
        try {
          const updatedUser = await updateUserTheme(palette, isDark);
          // Update user in context
          updateUser(updatedUser);
        } catch (error) {
          console.error("Error saving dark mode to backend:", error);
        }
      }
    } catch (error) {
      console.error("Error saving dark mode:", error);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!isDarkMode);
  };

  const theme = getTheme(palette, isDarkMode);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        palette,
        isDarkMode,
        theme,
        setPalette,
        setDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

