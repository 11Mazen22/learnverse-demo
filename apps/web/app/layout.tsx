import type { Metadata, Viewport } from "next";
import {cookies} from "next/headers";
import {LocaleProvider} from "@/lib/i18n/locale";
import { ConfirmHost } from "@/components/ui/confirm-dialog";
import { TooltipHost } from "@/components/ui/tooltip-host";

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
import "./design-rebirth.css";
import "./ai-suggestions.css";
import "./ai-interactions.css";
import "./ai-hub.css";
import "./ai-compact.css";
import "./ai-creative-studio.css";
import "./ai-generated-artifact.css";
import "./ai-memory.css";
import "./ai-library.css";
import "./auth-renaissance.css";
import "./ai-reading-renaissance.css";
import "./tooltip-system.css";
import "./staff-studio.css";
import { PwaRegister } from "@/components/pwa-register";
import { ExperienceBoot } from "@/components/preferences/experience-boot";
import { LocalizedSkipLink } from "@/components/ui/localized-skip-link";

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialLocale = (await cookies()).get("noata_locale")?.value === "en" ? "en" : "ar";
  return (
    <html lang={initialLocale} dir={initialLocale === "en" ? "ltr" : "rtl"} suppressHydrationWarning>
      <body>
        <LocaleProvider initialLocale={initialLocale}>
        <LocalizedSkipLink />
        <PwaRegister />
        <ExperienceBoot />
        {children}
        <ConfirmHost />
        <TooltipHost />
        </LocaleProvider>
      </body>
    </html>
  );
}
