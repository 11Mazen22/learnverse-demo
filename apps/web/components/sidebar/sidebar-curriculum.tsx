"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";
import { CORE_CURRICULUM_SUBJECTS } from "@/lib/shell/navigation";
import { SidebarGroup } from "./sidebar-group";

type SidebarCurriculumProps = {
  active: string;
  isCollapsedSidebar: boolean;
  onNavigate?: (href: string) => void;
};

function SidebarCurriculumList({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: (href: string) => void;
}) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const activeSubject = active.startsWith("/learn") ? searchParams.get("subject") : null;

  return (
    <div className="noata-curriculum-list" role="list">
      {CORE_CURRICULUM_SUBJECTS.map((sub) => {
        const title = localized(locale, sub.titleAr, sub.titleEn);
        const href = `/learn?subject=${sub.slug}`;
        const isItemActive =
          active === href || (active.startsWith("/learn") && activeSubject === sub.slug);

        return (
          <div role="listitem" key={sub.key}>
            <Link
              href={href}
              className={`noata-curriculum-item ${isItemActive ? "is-active" : ""}`}
              aria-current={isItemActive ? "page" : undefined}
              data-accent={sub.accent}
              onClick={() => onNavigate?.(href)}
            >
              <span className="noata-curriculum-dot" aria-hidden="true" />
              <span className="noata-curriculum-icon" aria-hidden="true">
                <Icon name={sub.icon} size={15} />
              </span>
              <span className="noata-curriculum-text">
                <span className="noata-curriculum-title">{title}</span>
                {sub.dualLanguage && (
                  <span className="noata-curriculum-track-pills">
                    <span className="noata-track-pill" lang="ar">عربي</span>
                    <span className="noata-track-pill">EN</span>
                  </span>
                )}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export function SidebarCurriculum({
  active,
  isCollapsedSidebar,
  onNavigate,
}: SidebarCurriculumProps) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);

  const isLearnActive = active.startsWith("/learn");

  if (isCollapsedSidebar) {
    return (
      <Link
        href="/learn"
        className={`noata-nav-item nav-link is-collapsed-item ${isLearnActive ? "is-active" : ""}`}
        aria-current={isLearnActive ? "page" : undefined}
        data-tooltip={t("المناهج والمقررات الستة", "Core Curriculum (6 Subjects)")}
        aria-label={t("المناهج الدراسية", "Curriculum")}
        onClick={() => onNavigate?.("/learn")}
      >
        <span className="noata-nav-indicator" aria-hidden="true" />
        <span className="noata-nav-icon-wrap" aria-hidden="true">
          <Icon name="book" size={18} />
        </span>
      </Link>
    );
  }

  return (
    <SidebarGroup
      id="curriculum-subjects"
      titleAr="المواد ومسارات المحتوى"
      titleEn="Core Curriculum"
      icon="book"
      badge={t("6 مواد", "6 Subjects")}
      collapsible={true}
      defaultExpanded={true}
      hasActiveChild={isLearnActive}
      isCollapsedSidebar={isCollapsedSidebar}
    >
      <Suspense fallback={null}>
        <SidebarCurriculumList active={active} onNavigate={onNavigate} />
      </Suspense>
    </SidebarGroup>
  );
}
