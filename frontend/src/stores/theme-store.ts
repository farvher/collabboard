import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  initialize: () => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: "light",

  setTheme: (theme) => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });

    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  },

  initialize: () => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("theme") as Theme | null;
    const theme = stored || "system";
    const resolved = theme === "system" ? getSystemTheme() : theme;

    applyTheme(resolved);
    set({ theme, resolvedTheme: resolved });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      const current = get().theme;
      if (current === "system") {
        const newResolved = e.matches ? "dark" : "light";
        applyTheme(newResolved);
        set({ resolvedTheme: newResolved });
      }
    });
  },
}));
