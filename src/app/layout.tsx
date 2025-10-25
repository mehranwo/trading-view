import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BTC/USDT Trading Terminal | Real-time Crypto Trading",
  description: "Professional trading terminal with real-time BTC/USDT price charts, L2 order book depth, and simulated order execution on Binance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
