import type { Metadata, Viewport } from "next";
import {cookies} from "next/headers";
import {LocaleProvider} from "@/lib/i18n/locale";
import {VerifiedAccountProvider} from "@/lib/supabase/use-verified-account";
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
import "./marketing.css";
import "./marketing-premium.css";
import "./premium-home.css";
import "./aura-finish.css";
import "./curriculum-hub.css";
import "./dashboard-renaissance.css";
import "./auth-ux.css";
import "./palette.css";
import "./brand-system.css";
import "./contextual-coach.css";
import "./design-rebirth.css";
import "./sidebar-rebirth.css";
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
import "./tour-system.css";
import { PwaRegister } from "@/components/pwa-register";
import { ExperienceBoot } from "@/components/preferences/experience-boot";
import { LocalizedSkipLink } from "@/components/ui/localized-skip-link";
import { AuraTourProvider } from "@/components/tour/tour-engine";

export const metadata: Metadata = {
  metadataBase: new URL("https://noata.enterpriseworkhub.online"),
  title: {
    default: "Noäta",
    template: "%s · Noäta",
  },
  description:
    "نقطة (Noäta) — منصة تعلّم عربية ذكية: دروس، مراجعة، مصحف موثّق، ومساعد Noäta AI يرافقك خطوة بخطوة.",
  applicationName: "Noäta",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: {
    capable: true,
    title: "Noäta",
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
        <VerifiedAccountProvider>
        <AuraTourProvider>
        <LocalizedSkipLink />
        <PwaRegister />
        <ExperienceBoot />
        {children}
        <ConfirmHost />
        <TooltipHost />
        </AuraTourProvider>
        </VerifiedAccountProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
