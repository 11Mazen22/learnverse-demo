"use client";

import Link from "next/link";
import { NoataBrand } from "@/components/ui/noata-logo";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";

type SidebarHeaderProps = {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateHome?: () => void;
};

export function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  onNavigateHome,
}: SidebarHeaderProps) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  const toggleTooltip = isCollapsed
    ? t("توسيع الشريط الجانبي (Ctrl+B)", "Expand sidebar (Ctrl+B)")
    : t("طي الشريط الجانبي (Ctrl+B)", "Collapse sidebar (Ctrl+B)");

  return (
    <div className={`noata-sidebar-head ${isCollapsed ? "is-collapsed-head" : ""}`}>
      <Link
        href="/"
        className="noata-sidebar-brand"
        aria-label={t("Noäta — الصفحة الرئيسية", "Noäta — Home")}
        onClick={onNavigateHome}
      >
        <NoataBrand size={36} compact={isCollapsed} />
      </Link>

      <button
        type="button"
        className="noata-sidebar-toggle"
        onClick={onToggleCollapse}
        aria-label={isCollapsed ? t("توسيع الشريط الجانبي", "Expand sidebar") : t("طي الشريط الجانبي", "Collapse sidebar")}
        aria-expanded={!isCollapsed}
        data-tooltip={toggleTooltip}
      >
        <span className="noata-sidebar-toggle-icon" aria-hidden="true">
          <Icon name="sidebar" size={16} />
        </span>
      </button>
    </div>
  );
}
