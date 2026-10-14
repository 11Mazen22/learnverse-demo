"use client";

import { useLocale } from "@/lib/i18n/locale";

export function LocalizedSkipLink() {
  const locale = useLocale();
  return <a className="skip-link" href="#noata-main">
    {locale === "en" ? "Skip to content" : "انتقل إلى المحتوى"}
  </a>;
}
