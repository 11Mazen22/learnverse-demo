"use client";

import { useEffect, useMemo } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { applyPalette, syncBrowserThemeColor } from "@/components/preferences/palette-gallery";

export function ExperienceBoot() {
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let alive = true;
    try {
      applyPalette(localStorage.getItem("noata-palette"));
      const localTheme = localStorage.getItem("noata-theme");
      if (localTheme === "light" || localTheme === "dark") {
        document.documentElement.dataset.theme = localTheme;
      } else {
        document.documentElement.dataset.theme = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches
          ? "dark"
          : "light";
      }

      syncBrowserThemeColor();
      const localLocale = localStorage.getItem("noata-locale");
      if (localLocale === "ar" || localLocale === "en") {
        document.documentElement.lang = localLocale;
        document.documentElement.dir = localLocale === "ar" ? "rtl" : "ltr";
      }
    } catch {
      /* Device storage can be disabled; OS appearance remains usable. */
    }
    void (async () => {
      try {
        const user = account.user;
        if (!user) return;
        const { data } = await supabase
          .from("user_settings")
          .select("theme,locale,reduced_motion")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!alive || !data) return;

        localStorage.setItem("noata-theme", data.theme);
        localStorage.setItem("noata-locale", data.locale);

        const resolved =
          data.theme === "system"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "dark"
              : "light"
            : data.theme;
        document.documentElement.dataset.theme = resolved;
        syncBrowserThemeColor();
        document.documentElement.lang = data.locale;
        document.documentElement.dir = data.locale === "ar" ? "rtl" : "ltr";
        document.documentElement.dataset.reducedMotion = data.reduced_motion
          ? "true"
          : "false";
      } catch {
        /* Keep the last device preference when account preferences are unavailable. */
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase, account.user]);

  return null;
}
