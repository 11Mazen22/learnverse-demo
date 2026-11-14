import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  iconStart?: IconName;
  iconEnd?: IconName;
  children?: ReactNode;
};

/** Tier 3 primary action trigger aligned with 44px touch targets and focus tokens. */
export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  iconStart,
  iconEnd,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "nk-btn",
    `nk-btn--${variant}`,
    size !== "md" ? `nk-btn--${size}` : "",
    fullWidth ? "nk-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span className="nk-btn-spinner" aria-hidden="true" />
      ) : (
        iconStart && <Icon name={iconStart} size={size === "sm" ? 15 : 17} />
      )}
      {children}
      {!loading && iconEnd && (
        <Icon name={iconEnd} size={size === "sm" ? 15 : 17} />
      )}
    </button>
  );
}

/** Accessible 44x44 minimum square icon button requiring an explicit accessible label. */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  icon: IconName;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const classes = [
    "nk-btn",
    "nk-btn--icon",
    `nk-btn--${variant}`,
    size !== "md" ? `nk-btn--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 19} />
    </button>
  );
}
