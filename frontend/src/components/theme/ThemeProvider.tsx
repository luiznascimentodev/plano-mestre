"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useThemeStore();

  useEffect(() => {
    // Aplicar tema inicial no HTML
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}

