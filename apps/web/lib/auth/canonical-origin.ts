/**
 * Noata Aura staging authentication uses one stable, approved Vercel branch
 * hostname. PKCE code verifiers are scoped to the browser origin: starting
 * sign-in on an immutable deployment and returning on the branch alias fails.
 *
 * Only the approved staging alias can be injected, and only *.vercel.app
 * preview login pages are redirected. Production/custom hosts are untouched.
 */
export const NOATA_STAGING_AUTH_HOST =
  "noata-git-noata-aura-platform-overhaul-20261008-noata.vercel.app";

export function canonicalAuthOrigin(
  currentOrigin: string,
  configuredOrigin: string | undefined,
): string {
  if (!configuredOrigin) return currentOrigin;
  try {
    const parsed = new URL(configuredOrigin);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== NOATA_STAGING_AUTH_HOST ||
      parsed.port ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) return currentOrigin;
    return parsed.origin;
  } catch {
    return currentOrigin;
  }
}

/**
 * Navigate to the canonical preview BEFORE beginning Supabase sign-in.
 * The PKCE verifier and the eventual email/OAuth callback then share origin.
 * Never redirect localhost, custom domains, or production here.
 */
export function canonicalLoginDestination(
  currentHref: string,
  configuredOrigin: string | undefined,
): string | null {
  try {
    const current = new URL(currentHref);
    if (!current.hostname.endsWith(".vercel.app")) return null;
    const origin = canonicalAuthOrigin(current.origin, configuredOrigin);
    if (origin === current.origin) return null;
    return origin + current.pathname + current.search + current.hash;
  } catch {
    return null;
  }
}
