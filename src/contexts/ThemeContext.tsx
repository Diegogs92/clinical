"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

declare global {
  interface Window {
    __theme?: "light" | "dark" | "auto";
  }
}

export type ThemeMode = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  enableAutoSwitch: (enabled: boolean) => void;
  autoSwitchEnabled: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const getTimeBasedTheme = (): ResolvedTheme => {
  const hour = new Date().getHours();
  // Dark mode from 8 PM to 6 AM
  return hour >= 20 || hour < 6 ? "dark" : "light";
};

const getPreferredTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "auto";
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light" || stored === "auto") {
    return stored as ThemeMode;
  }
  return "auto";
};

const resolveTheme = (mode: ThemeMode, autoSwitchEnabled: boolean): ResolvedTheme => {
  if (mode === "auto") {
    return autoSwitchEnabled ? getTimeBasedTheme() : getSystemTheme();
  }
  return mode;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "auto";
    return window.__theme || getPreferredTheme();
  });

  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("autoSwitchEnabled") === "true";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    return resolveTheme(theme, autoSwitchEnabled);
  });

  // Update resolved theme when mode or auto-switch changes
  useEffect(() => {
    const newResolvedTheme = resolveTheme(theme, autoSwitchEnabled);
    setResolvedTheme(newResolvedTheme);
  }, [theme, autoSwitchEnabled]);

  // Apply theme to DOM
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const isDark = resolvedTheme === "dark";

    // Smooth transition
    root.style.transition = "background-color 0.3s ease, color 0.3s ease";
    root.classList.toggle("dark", isDark);

    localStorage.setItem("theme", theme);
    window.__theme = theme;

    // Remove transition after animation completes
    const timer = setTimeout(() => {
      root.style.transition = "";
    }, 300);

    return () => clearTimeout(timer);
  }, [resolvedTheme, theme]);

  // Listen to system theme changes
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "auto" || autoSwitchEnabled) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "auto" && !autoSwitchEnabled) {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, autoSwitchEnabled]);

  // Auto-switch based on time of day
  useEffect(() => {
    if (!autoSwitchEnabled || theme !== "auto") return;

    // Check every minute if theme should change based on time
    const interval = setInterval(() => {
      const timeBasedTheme = getTimeBasedTheme();
      if (timeBasedTheme !== resolvedTheme) {
        setResolvedTheme(timeBasedTheme);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoSwitchEnabled, theme, resolvedTheme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      // Cycle through: light -> dark -> auto
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  const enableAutoSwitch = (enabled: boolean) => {
    setAutoSwitchEnabled(enabled);
    localStorage.setItem("autoSwitchEnabled", enabled.toString());
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      enableAutoSwitch,
      autoSwitchEnabled
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
