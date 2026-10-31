"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";

type SidebarItemProps = {
  href: string;
  icon: string;
  labelAr: string;
  labelEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
  isCollapsed: boolean;
  tag?: string | null;
  tagVariant?: "accent" | "success" | "warning";
  isAiSpecial?: boolean;
  isNested?: boolean;
  onClick?: () => void;
};

export function SidebarItem({
  href,
  icon,
  labelAr,
  labelEn,
  descriptionAr,
  descriptionEn,
  isActive,
  isCollapsed,
  tag,
  tagVariant = "accent",
  isAiSpecial = false,
  isNested = false,
  onClick,
}: SidebarItemProps) {
  const locale = useLocale();
  const label = localized(locale, labelAr, labelEn);
  const description = descriptionAr && descriptionEn ? localized(locale, descriptionAr, descriptionEn) : null;
  const tooltipText = description ? `${label} — ${description}` : label;

  return (
    <Link
      href={href}
      className={[
        "noata-nav-item",
        isActive && "is-active",
        isAiSpecial && "is-ai-special",
        isNested && "is-nested",
        isCollapsed && "is-collapsed-item",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-current={isActive ? "page" : undefined}
      data-tooltip={isCollapsed ? tooltipText : undefined}
      aria-label={isCollapsed ? label : undefined}
      onClick={onClick}
    >
      <span className="noata-nav-indicator" aria-hidden="true" />

      <span className="noata-nav-icon-wrap" aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>

      <span className="noata-nav-content">
        <span className="noata-nav-label-row">
          <span className="noata-nav-label">{label}</span>
          {tag && (
            <span className={`noata-nav-badge noata-nav-badge--${tagVariant}`}>
              {tag}
            </span>
          )}
        </span>
        {description && !isNested && (
          <span className="noata-nav-desc">{description}</span>
        )}
      </span>
    </Link>
  );
}
