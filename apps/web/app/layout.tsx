import type { Metadata } from "next";
import "./globals.css";
import {PwaRegister} from "@/components/pwa-register";
import {ExperienceBoot} from "@/components/preferences/experience-boot";

export const metadata: Metadata = {
  metadataBase: new URL("https://noata.enterpriseworkhub.online"),
  title: {
    default: "Noata",
    template: "%s · Noata"
  },
  description: "Learn. Grow. Achieve — an AI-native gamified learning platform.",
  applicationName: "Noata",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Noata", statusBarStyle: "black-translucent" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body><PwaRegister/><ExperienceBoot/>{children}</body>
    </html>
  );
}
