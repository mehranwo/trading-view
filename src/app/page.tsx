/**
 * Main trading app page
 */

"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { LatencyBadge } from "@/components/LatencyBadge";
import { useThemeStore } from "@/state/useThemeStore";

const TradingTerminal = dynamic(
  () =>
    import("@/components/TradingTerminal").then((mod) => mod.TradingTerminal),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-linear-to-br from-blue-500/10 to-transparent">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-4 shadow-lg"></div>
            <div
              className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-500/20 border-t-purple-500 mx-auto mb-4 animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <p className="text-gray-500 font-semibold text-lg">
            Loading trading terminal...
          </p>
          <div className="flex gap-1 justify-center mt-3">
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const isDarkMode = theme === "dark";

  // Initialize theme on mount
  useEffect(() => {
    // Apply theme to DOM (Zustand persist already loaded the value)
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 shadow-lg">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="px-2 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold shadow-lg">
              BTC
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Crypto Trading Terminal
              </h1>
              <p className="text-sm text-white/80 drop-shadow">
                Real-time BTC/USDT trading on Binance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="glass rounded-lg px-4 py-2">
              <ConnectionStatus />
            </div>
            <div className="glass rounded-lg px-4 py-2">
              <LatencyBadge />
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg glass hover:bg-white/20 transition-smooth backdrop-blur-md shadow-lg btn-hover-effect group"
              aria-label="Toggle theme"
            >
              <span className="text-xl group-hover:scale-110 transition-transform inline-block">
                {isDarkMode ? "dark" : "light"}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto">
          <TradingTerminal isDarkMode={isDarkMode} />
        </div>
      </main>
    </div>
  );
}
