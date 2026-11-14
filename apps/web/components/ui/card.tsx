import type { HTMLAttributes, ReactNode } from "react";

export type CardSurface = "default" | "elevated" | "soft" | "tinted";
export type CardPadding = "none" | "sm" | "md" | "lg";

/** Tier 3 structural container adhering to Noäta semantic surfaces and border tokens. */
export function Card({
  surface = "default",
  padding = "md",
  interactive = false,
  className = "",
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  surface?: CardSurface;
  padding?: CardPadding;
  interactive?: boolean;
  children: ReactNode;
}) {
  const classes = [
    "nk-card",
    surface !== "default" ? `nk-card--surface-${surface}` : "",
    `nk-card--pad-${padding}`,
    interactive ? "nk-card--interactive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
