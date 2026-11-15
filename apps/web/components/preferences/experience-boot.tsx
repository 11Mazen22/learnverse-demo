"use client";

import { useEffect, useMemo } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { applyPalette, syncBrowserThemeColor } from "@/components/preferences/palette-gallery";
import { resolveAppearance, safeAppearance } from "@/lib/appearance/mode";
import { applyCustomDesign, isDesignRecord } from "@/lib/appearance/theme";
import { applyLocale } from "@/lib/i18n/locale";

import {
  LOCALE_PREF_PREFIX,
  PALETTE_PREF_PREFIX,
  SERVER_REDUCED_MOTION_PREFIX,
  THEME_PREF_PREFIX,
  readScopedDevicePreference,
  readScopedMotionPreference,
  readServerReducedMotionFlag,
  setActiveAccountScope,
  syncMotionDomAttributes,
  writeScopedDevicePreference,
} from "@/lib/appearance/device-preferences";

export function ExperienceBoot() {
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (account.loading) return;

    let alive = true;
    const scopeUserId = account.user?.id ?? null;
    setActiveAccountScope(scopeUserId);

    try {
      applyPalette(
        readScopedDevicePreference(PALETTE_PREF_PREFIX, {
          userId: scopeUserId,
          legacyKey: "noata-palette",
        }),
        scopeUserId,
      );
      const localTheme = readScopedDevicePreference(THEME_PREF_PREFIX, {
        userId: scopeUserId,
        legacyKey: "noata-theme",
      });
      document.documentElement.dataset.theme = resolveAppearance(
        safeAppearance(localTheme),
        document.documentElement.dataset.palette,
        window.matchMedia("(prefers-color-scheme: dark)").matches,
      );

      syncBrowserThemeColor();
      const localLocale = readScopedDevicePreference(LOCALE_PREF_PREFIX, {
        userId: scopeUserId,
        legacyKey: "noata-locale",
      });
      if (localLocale === "ar" || localLocale === "en") {
        applyLocale(localLocale, false, scopeUserId);
      }

      syncMotionDomAttributes({
        mode: readScopedMotionPreference(scopeUserId),
        serverReducedMotion: readServerReducedMotionFlag(scopeUserId),
      });
    } catch {
      /* Device storage can be disabled; OS appearance remains usable. */
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleOsSchemeChange = () => {
      try {
        const storedTheme = readScopedDevicePreference(THEME_PREF_PREFIX, {
          userId: scopeUserId,
          legacyKey: "noata-theme",
        });
        if (storedTheme && storedTheme !== "system") return;
      } catch {
        /* Proceed with system fallback when localStorage is unavailable. */
      }
      const palette = document.documentElement.dataset.palette;
      const customConstraint =
        document.documentElement.dataset.modeConstraint === "dark-only" ||
        document.documentElement.dataset.modeConstraint === "light-only"
          ? document.documentElement.dataset.modeConstraint
          : undefined;
      document.documentElement.dataset.theme = resolveAppearance(
        "system",
        palette,
        media.matches,
        customConstraint,
      );
      syncBrowserThemeColor();
    };
    media.addEventListener("change", handleOsSchemeChange);

    void (async () => {
      try {
        const user = account.user;
        if (!user) return;
        const { data } = await supabase
          .from("user_settings")
          .select("theme,locale,reduced_motion,palette,active_design_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!alive || !data) return;

        if (
          typeof data.palette === "string" &&
          ["classic", "aura", "ocean", "forest", "sunset", "rose", "midnight"].includes(data.palette)
        ) {
          applyPalette(data.palette, user.id);
          writeScopedDevicePreference(PALETTE_PREF_PREFIX, data.palette, { userId: user.id });
          window.dispatchEvent(new Event("noata-palette-change"));
        }

        writeScopedDevicePreference(THEME_PREF_PREFIX, data.theme, { userId: user.id });

        document.documentElement.dataset.theme = resolveAppearance(
          safeAppearance(data.theme),
          document.documentElement.dataset.palette,
          window.matchMedia("(prefers-color-scheme: dark)").matches,
        );
        syncBrowserThemeColor();

        if (data.active_design_id) {
          const response = await supabase
            .from("user_theme_designs")
            .select("id,user_id,name,description,tokens,visible")
            .eq("id", data.active_design_id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (alive && isDesignRecord(response.data) && response.data.user_id === user.id) {
            applyCustomDesign(response.data.tokens);
            document.documentElement.dataset.theme = resolveAppearance(
              safeAppearance(data.theme),
              "custom",
              window.matchMedia("(prefers-color-scheme: dark)").matches,
            );
            syncBrowserThemeColor();
            window.dispatchEvent(new Event("noata-custom-theme-change"));
          }
        }

        const localPreference = readScopedDevicePreference(LOCALE_PREF_PREFIX, {
          userId: user.id,
        });

        if (data.locale === "ar" || data.locale === "en") {
          if (!localPreference) {
            applyLocale(data.locale, true, user.id);
          } else if ((localPreference === "ar" || localPreference === "en") && data.locale !== localPreference) {
            void supabase
              .from("user_settings")
              .update({ locale: localPreference, updated_at: new Date().toISOString() })
              .eq("user_id", user.id);
          }
        } else if (localPreference === "ar" || localPreference === "en") {
          applyLocale(localPreference, false, user.id);
        }

        const serverReduced = data.reduced_motion === true;
        writeScopedDevicePreference(
          SERVER_REDUCED_MOTION_PREFIX,
          serverReduced ? "true" : "false",
          { userId: user.id },
        );
        syncMotionDomAttributes({
          mode: readScopedMotionPreference(user.id),
          serverReducedMotion: serverReduced,
        });
      } catch {
        /* Keep the last device preference when account preferences are unavailable. */
      }
    })();

    return () => {
      alive = false;
      media.removeEventListener("change", handleOsSchemeChange);
    };
  }, [supabase, account.user, account.loading]);

  return null;
}
