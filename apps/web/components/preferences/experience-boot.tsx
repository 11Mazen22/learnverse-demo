"use client";

import { useEffect, useMemo } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { applyPalette, syncBrowserThemeColor } from "@/components/preferences/palette-gallery";
import { resolveAppearance, safeAppearance } from "@/lib/appearance/mode";
import {applyCustomDesign,isDesignRecord} from "@/lib/appearance/theme";
import { applyLocale } from "@/lib/i18n/locale";

export function ExperienceBoot() {
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let alive = true;
    try {
      applyPalette(localStorage.getItem("noata-palette"));
      const localTheme = localStorage.getItem("noata-theme");
      document.documentElement.dataset.theme = resolveAppearance(
        safeAppearance(localTheme), document.documentElement.dataset.palette,
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );

      syncBrowserThemeColor();
      const localLocale = localStorage.getItem("noata-locale");
      if (localLocale === "ar" || localLocale === "en") {
        applyLocale(localLocale, false);
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
          .select("theme,locale,reduced_motion,palette,active_design_id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!alive || !data) return;

        localStorage.setItem("noata-theme", data.theme);
        localStorage.setItem("noata-locale", data.locale);

        document.documentElement.dataset.theme = resolveAppearance(
          safeAppearance(data.theme),document.documentElement.dataset.palette,
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
        syncBrowserThemeColor();
        if (typeof data.palette === "string" &&
            ["classic","aura","ocean","forest","sunset","rose","midnight"].includes(data.palette)) {
          applyPalette(data.palette);
          try { localStorage.setItem("noata-palette", data.palette); } catch { /* device storage is optional */ }
          window.dispatchEvent(new Event("noata-palette-change"));
        }
        if (data.active_design_id) {
          const response=await supabase.from("user_theme_designs")
            .select("id,user_id,name,description,tokens,visible")
            .eq("id",data.active_design_id).eq("user_id",user.id).maybeSingle();
          if (alive && isDesignRecord(response.data) && response.data.user_id===user.id) {
            applyCustomDesign(response.data.tokens);
            document.documentElement.dataset.theme=resolveAppearance(
              safeAppearance(data.theme),"custom",window.matchMedia("(prefers-color-scheme: dark)").matches
            );
            syncBrowserThemeColor();
            window.dispatchEvent(new Event("noata-custom-theme-change"));
          }
        }
        applyLocale(data.locale === "en" ? "en" : "ar", false);
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
