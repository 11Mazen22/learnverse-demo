"use client";

import { useMemo, useRef, useState } from "react";
import { applyLocale, useLocale, useTranslation } from "@/lib/i18n/locale";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

/** Device & account locale toggle; keeps signed-in users' `user_settings.locale` synchronized. */
export function LocaleControl() {
  const locale = useLocale();
  const t = useTranslation();
  const account = useVerifiedAccount();
  const supabase = useMemo(() => createClient(), []);
  const { push } = useToast();
  const [syncing, setSyncing] = useState(false);
  const saveSeq = useRef(0);

  const toggleLocale = async () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    const user = account.user;
    applyLocale(nextLocale, true, user?.id ?? null);

    if (!user) return;

    const seq = ++saveSeq.current;
    const accountRevision = account.revision.current;
    setSyncing(true);
    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert(
          {
            user_id: user.id,
            locale: nextLocale,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (seq !== saveSeq.current || accountRevision !== account.revision.current) return;
      if (error) throw error;
    } catch {
      if (seq === saveSeq.current && accountRevision === account.revision.current) {
        push({
          title: t(
            "تم تغيير اللغة على هذا الجهاز، لكن تعذّر تأكيد الحفظ في الحساب.",
            "Language changed on this device, but account sync could not be confirmed.",
          ),
          tone: "warning",
        });
      }
    } finally {
      if (seq === saveSeq.current) setSyncing(false);
    }
  };

  return (
    <button
      type="button"
      className="top-icon"
      lang={locale === "ar" ? "en" : "ar"}
      aria-label={t("التحويل إلى الإنجليزية", "Switch interface language to Arabic")}
      aria-busy={syncing || undefined}
      title={t("تغيير لغة الواجهة", "Switch interface language")}
      onClick={() => void toggleLocale()}
      style={{ fontSize: 12, fontWeight: 800 }}
    >
      {locale === "ar" ? "EN" : "عربي"}
    </button>
  );
}
