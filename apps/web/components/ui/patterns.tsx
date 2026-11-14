import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/** Tier 4 standardized workspace page header with eyebrow, meta tags, and actions. */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={["nk-page-header", className].filter(Boolean).join(" ")}>
      <div className="nk-page-header-copy">
        {eyebrow && <span className="nk-page-header-eyebrow">{eyebrow}</span>}
        <h1 className="nk-page-header-title">{title}</h1>
        {description && <p className="nk-page-header-desc">{description}</p>}
        {meta && <div className="nk-page-header-meta">{meta}</div>}
      </div>
      {actions && <div className="nk-page-header-actions">{actions}</div>}
    </header>
  );
}

/** Tier 4 fluid Bento metric/panel grid collapsing safely from desktop to 320px viewports. */
export function BentoGrid({
  wide = false,
  className = "",
  children,
}: {
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={["nk-bento-grid", wide ? "nk-bento-grid--wide" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/** Tier 4 KPI metric tile with tabular numerals, semantic icon box, and optional link target. */
export function StatTile({
  label,
  value,
  hint,
  icon = "chart",
  href,
  trailing,
  className = "",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconName;
  href?: string;
  trailing?: ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <div className="nk-stat-tile-head">
        <span className="nk-stat-tile-label">{label}</span>
        <span className="nk-stat-tile-icon" aria-hidden="true">
          <Icon name={icon} size={17} />
        </span>
      </div>
      <strong className="nk-stat-tile-value">{value}</strong>
      {(hint || trailing) && (
        <div className="nk-stat-tile-foot">
          <span>{hint}</span>
          {trailing}
        </div>
      )}
    </>
  );

  const classes = ["nk-stat-tile", className].filter(Boolean).join(" ");
  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }
  return <div className={classes}>{inner}</div>;
}

/** Tier 4 two-column reading workspace combining scrollable primary content with a sticky rail. */
export function SplitReaderShell({
  main,
  rail,
  railPosition = "end",
  className = "",
}: {
  main: ReactNode;
  rail: ReactNode;
  railPosition?: "start" | "end";
  className?: string;
}) {
  return (
    <div
      className={[
        "nk-split-reader",
        railPosition === "start" ? "nk-split-reader--rail-start" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {railPosition === "start" && (
        <aside className="nk-split-reader-rail">{rail}</aside>
      )}
      <div className="nk-split-reader-main">{main}</div>
      {railPosition === "end" && (
        <aside className="nk-split-reader-rail">{rail}</aside>
      )}
    </div>
  );
}

/** Tier 4 distraction-free study studio layout for flashcard, quiz, and review modes. */
export function StudyStageCanvas({
  header,
  children,
  footer,
  className = "",
}: {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={["nk-study-stage", className].filter(Boolean).join(" ")}>
      {header && <div className="nk-study-stage-header">{header}</div>}
      <div className="nk-study-stage-surface">{children}</div>
      {footer && <div className="nk-study-stage-footer">{footer}</div>}
    </section>
  );
}

/** Tier 4 responsive filter/search control bar for study queues, courses, and admin views. */
export function FilterToolbar({
  start,
  end,
  className = "",
}: {
  start: ReactNode;
  end?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["nk-filter-toolbar", className].filter(Boolean).join(" ")}>
      <div className="nk-filter-toolbar-group">{start}</div>
      {end && <div className="nk-page-header-actions">{end}</div>}
    </div>
  );
}

/** Tier 4 structured admin/teacher console section pairing header, actions, and table/list body. */
export function StaffConsoleSection({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["nk-staff-section", className].filter(Boolean).join(" ")}>
      <div className="nk-staff-section-head">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {actions && <div className="nk-page-header-actions">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
