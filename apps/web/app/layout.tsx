import type { Metadata, Viewport } from "next";
import { ConfirmHost } from "@/components/ui/confirm-dialog";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#071327" },
  ],
};
import "katex/dist/katex.min.css";
import "./globals.css";
import "./aura-finish.css";
import "./auth-ux.css";
import "./palette.css";
import "./brand-system.css";
import "./contextual-coach.css";
import { PwaRegister } from "@/components/pwa-register";
import { ExperienceBoot } from "@/components/preferences/experience-boot";

export const metadata: Metadata = {
  metadataBase: new URL("https://noata.enterpriseworkhub.online"),
  title: {
    default: "Noata",
    template: "%s · Noata",
  },
  description:
    "نوتة — منصة تعلّم عربية ذكية: دروس، مراجعة، مصحف موثّق، ومساعد Noata AI يرافقك خطوة بخطوة.",
  applicationName: "Noata",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: {
    capable: true,
    title: "Noata",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <a className="skip-link" href="#noata-main">
          انتقل إلى المحتوى
        </a>
        <PwaRegister />
        <ExperienceBoot />
        {children}
        <ConfirmHost />
      </body>
    </html>
  );
}
