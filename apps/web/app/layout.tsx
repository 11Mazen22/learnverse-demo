import type { Metadata, Viewport } from "next";
import {cookies} from "next/headers";
import {LocaleProvider} from "@/lib/i18n/locale";
import {VerifiedAccountProvider} from "@/lib/supabase/use-verified-account";
import { ConfirmHost } from "@/components/ui/confirm-dialog";
import { TooltipHost } from "@/components/ui/tooltip-host";
import { ToastProvider } from "@/components/ui/toast";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#071327" },
  ],
};
import "./styles/layers.css";
import "./styles/tokens.css";
import "./globals.css";
import "./marketing.css";
import "./marketing-premium.css";
import "./premium-home.css";
import "./aura-finish.css";
import "./curriculum-hub.css";
import "./lesson-experience.css";
import "./study-experience.css";
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
import "./ai-flow.css";
import "./styles/ui.css";
import "./styles/patterns.css";
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

const NOATA_PREHYDRATION_BOOT_SCRIPT = `(() => {
  try {
    var r = document.documentElement;
    var scope = localStorage.getItem("noata:active-account-scope") || "guest";
    var isGuest = scope === "guest";
    var getScoped = function (prefix, legacy) {
      var v = localStorage.getItem(prefix + scope);
      if (v !== null) return v;
      return isGuest && legacy ? localStorage.getItem(legacy) : null;
    };
    var p = getScoped("noata:palette:", "noata-palette");
    var pal = ["classic","aura","ocean","forest","sunset","rose","midnight","custom"].indexOf(p) !== -1 ? p : "classic";
    r.dataset.palette = pal;
    r.dataset.modeConstraint = pal === "midnight" ? "dark" : "none";
    var m = getScoped("noata:theme:", "noata-theme");
    var d = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var t = pal === "midnight" ? "dark" : (m === "dark" ? "dark" : m === "light" ? "light" : (d ? "dark" : "light"));
    r.dataset.theme = t;
    r.style.colorScheme = t;
    var mot = getScoped("noata:motion:", "noata-ai-motion-v1");
    var srvMot = localStorage.getItem("noata:server-reduced-motion:" + scope);
    if (mot === "off") {
      r.dataset.noataMotion = "off";
      r.dataset.reducedMotion = "true";
    } else if (mot === "reduce" || (mot !== "full" && srvMot === "true")) {
      r.dataset.noataMotion = "reduce";
      r.dataset.reducedMotion = "true";
    } else if (mot === "full") {
      r.dataset.noataMotion = "full";
      r.dataset.reducedMotion = srvMot === "true" ? "true" : "false";
    } else if (srvMot === "false") {
      r.dataset.reducedMotion = "false";
    }
    var spRaw = localStorage.getItem("noata:shell-prefs:" + scope);
    if (spRaw) {
      try {
        var sp = JSON.parse(spRaw);
        if (sp && typeof sp === "object") {
          if (typeof sp.widthPx === "number" && isFinite(sp.widthPx)) {
            var w = Math.max(248, Math.min(420, Math.round(sp.widthPx)));
            r.style.setProperty("--sidebar-user-w", w + "px");
          }
          if (sp.collapsed === true) {
            r.dataset.sidebarCollapsed = "true";
          } else {
            r.removeAttribute("data-sidebar-collapsed");
          }
        }
      } catch (e2) {}
    } else if (isGuest && localStorage.getItem("noata_sidebar_collapsed") === "1") {
      r.dataset.sidebarCollapsed = "true";
    }
  } catch (e) {}
})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialLocale = (await cookies()).get("noata_locale")?.value === "en" ? "en" : "ar";
  return (
    <html lang={initialLocale} dir={initialLocale === "en" ? "ltr" : "rtl"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NOATA_PREHYDRATION_BOOT_SCRIPT }} />
      </head>
      <body>
        <LocaleProvider initialLocale={initialLocale}>
        <VerifiedAccountProvider>
        <AuraTourProvider>
        <ToastProvider>
        <LocalizedSkipLink />
        <PwaRegister />
        <ExperienceBoot />
        {children}
        <ConfirmHost />
        <TooltipHost />
        </ToastProvider>
        </AuraTourProvider>
        </VerifiedAccountProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
