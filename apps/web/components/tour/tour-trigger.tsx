"use client";

import { useAuraTour } from "./tour-engine";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";

export function TourTrigger() {
  const { replayPageTour, activeTour, hasPageTour } = useAuraTour();
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  if (activeTour) return null;

  return (
    <button
      type="button"
      className="aura-tour-trigger-btn"
      onClick={replayPageTour}
      aria-label={t("بدء جولة إرشادية في هذه الصفحة", "Start a guided walkthrough of this page")}
      title={t("جولة إرشادية في الصفحة", "Page Guide & Walkthrough")}
    >
      <span className="aura-tour-trigger-icon" aria-hidden="true">
        <Icon name="sparkles" size={15} />
      </span>
      <span className="aura-tour-trigger-text">
        {hasPageTour ? t("دليل الصفحة", "Page Guide") : t("جولة سريعة", "Tour")}
      </span>
    </button>
  );
}
