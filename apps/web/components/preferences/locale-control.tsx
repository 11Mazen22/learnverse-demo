"use client";
import { applyLocale, useLocale, useTranslation } from "@/lib/i18n/locale";

/** Device preference; authenticated account preferences are saved in Settings. */
export function LocaleControl() {
  const locale = useLocale(), t = useTranslation();
  return <button type="button" className="top-icon" lang={locale === "ar" ? "en" : "ar"}
    aria-label={t("التحويل إلى الإنجليزية على هذا الجهاز", "Switch this device to Arabic")}
    title={t("لغة هذا الجهاز", "Language on this device")}
    onClick={() => applyLocale(locale === "ar" ? "en" : "ar")}
    style={{fontSize:13,fontWeight:800,minWidth:42}}>
    {locale === "ar" ? "EN" : "عربي"}
  </button>;
}
