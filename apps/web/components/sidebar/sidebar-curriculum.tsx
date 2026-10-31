"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";
import { SidebarGroup } from "./sidebar-group";

export type CurriculumSubject = {
  key: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  shortTitleAr: string;
  shortTitleEn: string;
  accent: string;
  icon: string;
  dualLanguage: boolean;
};

const CORE_SUBJECTS: readonly CurriculumSubject[] = [
  {
    key: "integrated-science",
    slug: "integrated-science",
    titleAr: "العلوم المتكاملة",
    titleEn: "Integrated Science",
    shortTitleAr: "علوم",
    shortTitleEn: "Science",
    accent: "cyan",
    icon: "microscope",
    dualLanguage: true,
  },
  {
    key: "mathematics",
    slug: "mathematics",
    titleAr: "الرياضيات",
    titleEn: "Mathematics",
    shortTitleAr: "رياضيات",
    shortTitleEn: "Math",
    accent: "indigo",
    icon: "compass",
    dualLanguage: true,
  },
  {
    key: "history",
    slug: "history",
    titleAr: "تاريخ",
    titleEn: "History",
    shortTitleAr: "تاريخ",
    shortTitleEn: "History",
    accent: "amber",
    icon: "landmark",
    dualLanguage: false,
  },
  {
    key: "arabic-language",
    slug: "arabic-language",
    titleAr: "اللغة العربية",
    titleEn: "Arabic Language",
    shortTitleAr: "عربي",
    shortTitleEn: "Arabic",
    accent: "rose",
    icon: "feather",
    dualLanguage: false,
  },
  {
    key: "english",
    slug: "english",
    titleAr: "اللغة الإنجليزية",
    titleEn: "English Language",
    shortTitleAr: "إنجليزي",
    shortTitleEn: "English",
    accent: "teal",
    icon: "globe",
    dualLanguage: false,
  },
  {
    key: "philosophy-logic",
    slug: "philosophy-logic",
    titleAr: "الفلسفة والمنطق",
    titleEn: "Philosophy & Logic",
    shortTitleAr: "فلسفة",
    shortTitleEn: "Philosophy",
    accent: "violet",
    icon: "lightbulb",
    dualLanguage: false,
  },
];

type SidebarCurriculumProps = {
  active: string;
  isCollapsedSidebar: boolean;
  onNavigate?: (href: string) => void;
};

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
        className={`noata-nav-item is-collapsed-item ${isLearnActive ? "is-active" : ""}`}
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
      <div className="noata-curriculum-list" role="list">
        {CORE_SUBJECTS.map((sub) => {
          const title = localized(locale, sub.titleAr, sub.titleEn);
          const href = `/learn?subject=${sub.slug}`;
          const isItemActive = active === href || (active === "/learn" && false);

          return (
            <Link
              key={sub.key}
              href={href}
              className={`noata-curriculum-item ${isItemActive ? "is-active" : ""}`}
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
                    <span className="noata-track-pill">عربي</span>
                    <span className="noata-track-pill">EN</span>
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </SidebarGroup>
  );
}
