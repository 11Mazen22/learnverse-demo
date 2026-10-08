type LogoProps = { size?: number; className?: string };

/** Scalable rendering of the supplied Noata cap / N / open-book identity. */
export function NoataLogo({ size = 44, className = "" }: LogoProps) {
  return (
    <span
      className={className ? `noata-logo ${className}` : "noata-logo"}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img className="noata-logo-day" src="/noata-mark.svg" width={size} height={size} alt="" />
      <img className="noata-logo-night" src="/noata-mark-light.svg" width={size} height={size} alt="" />
    </span>
  );
}

type BrandProps = {
  size?: number;
  tagline?: string | null;
  compact?: boolean;
  className?: string;
};

/** Consistent Noata lockup: mark + wordmark + optional Arabic tagline. */
export function NoataBrand({
  size = 40,
  tagline = "تعلّم · انمُ · أنجز",
  compact = false,
  className = "",
}: BrandProps) {
  const classes = ["noata-brand", compact && "is-compact", className].filter(Boolean).join(" ");
  return (
    <span className={classes}>
      <span className="noata-brand-mark">
        <NoataLogo size={size} />
      </span>
      <span className="noata-brand-copy">
        <strong lang="en" dir="ltr">
          Noata
        </strong>
        {tagline && <small>{tagline}</small>}
      </span>
    </span>
  );
}
