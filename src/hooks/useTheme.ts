import { createContext, useContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const defaultThemeContext: ThemeContextValue = {
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
};

export const ThemeContext =
  createContext<ThemeContextValue>(defaultThemeContext);

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
