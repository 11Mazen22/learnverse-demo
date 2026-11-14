import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/** Reusable zero-fabrication empty state with optional action buttons. */
export function EmptyState({
  icon = "inbox",
  title,
  description,
  actions,
  className = "",
}: {
  icon?: IconName;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={["nk-empty", className].filter(Boolean).join(" ")}>
      <span className="nk-empty-icon" aria-hidden="true">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="nk-empty-title">{title}</h3>
      {description && <p className="nk-empty-desc">{description}</p>}
      {actions && <div className="nk-empty-actions">{actions}</div>}
    </div>
  );
}
