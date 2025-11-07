import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      setTheme: (theme) => {
        set({ theme });
        // Aplicar tema no HTML
        if (typeof window !== "undefined") {
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(theme);
        }
      },
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === "light" ? "dark" : "light";
          // Aplicar tema no HTML
          if (typeof window !== "undefined") {
            const root = window.document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(newTheme);
          }
          return { theme: newTheme };
        });
      },
    }),
    {
      name: "plano-mestre-theme",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Aplicar tema ao reidratar
        if (state && typeof window !== "undefined") {
          const root = window.document.documentElement;
          root.classList.remove("light", "dark");
          root.classList.add(state.theme);
        }
      },
    }
  )
);

