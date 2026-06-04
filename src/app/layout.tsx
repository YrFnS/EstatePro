import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { LayoutShell } from "@/components/layout-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "EstatePro - Find Your Dream Home",
  description:
    "Discover the perfect property with EstatePro. Buy, sell, or rent with confidence on our comprehensive real estate platform.",
  keywords: [
    "real estate",
    "property",
    "buy",
    "sell",
    "rent",
    "home",
    "EstatePro",
  ],
  authors: [{ name: "EstatePro" }],
  icons: {
    icon: "/logo.svg",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EstatePro",
  },
};

export const viewport: Viewport = {
  themeColor: "#D4A853",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexArabic.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <LayoutShell>
            {children}
          </LayoutShell>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
