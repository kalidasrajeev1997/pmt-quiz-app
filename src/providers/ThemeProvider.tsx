import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "pmt-quiz-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      // Ignore localStorage access failure
    }
    if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore localStorage access failure
    }
  }, [theme, storageKey]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
