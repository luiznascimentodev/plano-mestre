import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import GlobalPomodoroTimer from "@/components/timer/GlobalPomodoroTimer";
import ThemeProvider from "@/components/theme/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plano Mestre",
  description: "Revolucione seus estudos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}

          {/* Timer Global Pomodoro */}
          <GlobalPomodoroTimer />
        </ThemeProvider>
      </body>
    </html>
  );
}
