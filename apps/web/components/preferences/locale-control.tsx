"use client";

import { useMemo } from "react";
import { applyLocale, useLocale, useTranslation } from "@/lib/i18n/locale";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";

/** Device preference; authenticated account preferences are synchronized automatically. */
export function LocaleControl() {
  const locale = useLocale();
  const t = useTranslation();
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    applyLocale(nextLocale);

    // Keep user's database settings in sync so appearance changes never revert the language
    const user = account.user;
    if (user) {
      void supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            locale: nextLocale,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    }
  };

  return (
    <button
      type="button"
      className="top-icon"
      lang={locale === "ar" ? "en" : "ar"}
      aria-label={t("التحويل إلى الإنجليزية على هذا الجهاز", "Switch this device to Arabic")}
      title={t("لغة هذا الجهاز", "Language on this device")}
      onClick={toggleLocale}
      style={{ fontSize: 13, fontWeight: 800, minWidth: 42 }}
    >
      {locale === "ar" ? "EN" : "عربي"}
    </button>
  );
}
