import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

// Two families, both loaded as VARIABLE fonts.
//
// Passing a `weight` array makes next/font fetch one static instance per
// weight — the previous build shipped three families x 5-7 weights. Omitting
// `weight` gets a single variable file per family that covers the whole range,
// which is what the Next font docs recommend. Payload matters here: the
// audience is mobile-money users on mid-range Android.
//
// Inter replaces Outfit for display too. Outfit is geometric and loses
// legibility at the 11-13px this dense UI lives at; Inter was drawn for it.
const inter = Inter({
  variable: "--font-sans-src",
  subsets: ["latin"],
  display: "swap",
});

// Mono is not decorative here — odds and money need tabular figures so
// columns align and digits don't reflow as prices move.
const jetbrains = JetBrains_Mono({
  variable: "--font-mono-src",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Betlixx — Premium Sports Betting",
  description:
    "Betlixx — premium international sports betting. Live odds, mobile-money payouts, verified tickets.",
  manifest: "/manifest.webmanifest",
  applicationName: "Betlixx",
  appleWebApp: {
    capable: true,
    title: "Betlixx",
    // "default" = dark status-bar text on a light bar. The previous
    // "black-translucent" made the bar transparent and drew the clock and
    // battery in WHITE over the page itself — invisible now that the page
    // behind it is white, and it also let content slide under the notch.
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrains.variable} antialiased`}
    >
      <body suppressHydrationWarning>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
