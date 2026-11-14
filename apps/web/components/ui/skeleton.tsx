import type { CSSProperties } from "react";

/** Decorative loading placeholder disabled automatically under reduced-motion settings. */
export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  style,
}: {
  variant?: "text" | "circle" | "card" | "rect";
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: CSSProperties;
}) {
  const classes = [
    "nk-skeleton",
    variant === "text" ? "nk-skeleton--text" : "",
    variant === "circle" ? "nk-skeleton--circle" : "",
    variant === "card" ? "nk-skeleton--card" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      aria-hidden="true"
      style={{ width, height, ...style }}
    />
  );
}

/** Accessible busy region grouping multiple `Skeleton` lines with a localized screen-reader status. */
export function SkeletonGroup({
  label,
  lines = 3,
  className = "",
}: {
  label: string;
  lines?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{ display: "grid", gap: "var(--space-3)" }}
    >
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          variant="text"
          width={idx === lines - 1 ? "68%" : "100%"}
        />
      ))}
    </div>
  );
}
