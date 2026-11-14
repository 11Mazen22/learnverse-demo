import type { HTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger";

/** Semantic status pill with paired high-contrast background and ink tokens. */
export function Badge({
  tone = "neutral",
  icon,
  children,
  className = "",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: IconName;
  children: ReactNode;
}) {
  return (
    <span
      className={["nk-badge", `nk-badge--${tone}`, className].filter(Boolean).join(" ")}
      {...rest}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}
