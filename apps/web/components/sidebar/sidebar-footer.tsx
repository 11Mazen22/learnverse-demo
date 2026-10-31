"use client";

import Link from "next/link";
import { localized, useLocale } from "@/lib/i18n/locale";
import { SidebarItem } from "./sidebar-item";

type SidebarFooterProps = {
  active: string;
  isCollapsed: boolean;
  onNavigate: (href: string) => void;
};

export function SidebarFooter({
  active,
  isCollapsed,
  onNavigate,
}: SidebarFooterProps) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  const isSettingsActive = active === "/settings";
  const isHelpActive = active === "/help";

  return (
    <div className={`noata-sidebar-foot ${isCollapsed ? "is-collapsed-foot" : ""}`}>
      {/* Utilities */}
      <nav
        aria-label={t("التفضيلات والدعم", "Preferences and support")}
        className="noata-sidebar-utility-nav"
      >
        <SidebarItem
          href="/settings"
          icon="settings"
          labelAr="الإعدادات والمظهر"
          labelEn="Settings & Theme"
          descriptionAr="تخصيص كامل للألوان والتجربة"
          descriptionEn="Full theme & experience control"
          isActive={isSettingsActive}
          isCollapsed={isCollapsed}
          onClick={() => onNavigate("/settings")}
        />

        <SidebarItem
          href="/help"
          icon="help"
          labelAr="مركز المساعدة"
          labelEn="Help Center"
          descriptionAr="إرشادات ودعم مستمر"
          descriptionEn="Guidance and support"
          isActive={isHelpActive}
          isCollapsed={isCollapsed}
          onClick={() => onNavigate("/help")}
        />
      </nav>

      {/* Legal Links (Expanded Only) */}
      {!isCollapsed && (
        <div className="noata-sidebar-legal" role="contentinfo">
          <Link href="/privacy" className="noata-legal-link">
            {t("الخصوصية", "Privacy")}
          </Link>
          <span className="noata-legal-sep" aria-hidden="true">·</span>
          <Link href="/terms" className="noata-legal-link">
            {t("الشروط", "Terms")}
          </Link>
        </div>
      )}
    </div>
  );
}
