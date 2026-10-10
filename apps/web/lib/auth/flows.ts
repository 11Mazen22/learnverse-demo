/** Pure auth flow helpers, safe in browser, CI and server contexts. */
export type AuthFlow = "signup" | "recovery" | "oauth";

export function authCallbackUrl(origin: string, flow: AuthFlow, next = "/", redirectProxy?: string) {
  const url = new URL(redirectProxy || "/auth/callback", origin);
  if (redirectProxy && (url.protocol !== "https:" || url.username || url.password || url.hash ||
      !["v0.dev", "v0.app"].some(host => url.hostname === host || url.hostname.endsWith("." + host))))
    throw new Error("Invalid authentication redirect proxy");
  url.searchParams.set("flow", flow);
  const allowed = next.startsWith("/") && !next.startsWith("//") && !/[\\\u0000-\u0020\u007f]/.test(next);
  url.searchParams.set("next", flow === "recovery" ? "/auth/update-password" : allowed ? next : "/");
  return url.toString();
}

export function normalizedAuthFlow(raw: string | null): AuthFlow | null {
  return raw === "signup" || raw === "recovery" || raw === "oauth" ? raw : null;
}

export const RECOVERY_GRANT_KEY = "noata-auth-recovery-v1";
export const RECOVERY_GRANT_LIFETIME_MS = 15 * 60 * 1000;

export function recoveryGrantValue(userId: string, now: number) {
  return JSON.stringify({ userId, issuedAt: now });
}

export function validRecoveryGrant(value: string | null, userId: string, now: number): boolean {
  if (!value || !userId) return false;
  try {
    const payload: unknown = JSON.parse(value);
    if (!payload || typeof payload !== "object") return false;
    const { userId: actual, issuedAt } = payload as Record<string, unknown>;
    return actual === userId && typeof issuedAt === "number" &&
      Number.isFinite(issuedAt) && issuedAt <= now &&
      now - issuedAt <= RECOVERY_GRANT_LIFETIME_MS;
  } catch {
    return false;
  }
}

/** A short-lived display receipt; never used as proof of backend authorization. */
export const AUTH_COMPLETION_KEY = "noata-auth-completion-v1";
export type AuthCompletionType = "verified" | "password-updated";
export function authCompletionValue(type: AuthCompletionType, userId: string, now: number) {
  return JSON.stringify({ type, userId, issuedAt: now });
}
export function validAuthCompletion(
  value: string | null, type: AuthCompletionType, userId: string, now: number,
): boolean {
  if (!value || !userId) return false;
  try {
    const payload: unknown = JSON.parse(value);
    if (!payload || typeof payload !== "object") return false;
    const fields = payload as Record<string, unknown>;
    return fields.type === type && fields.userId === userId &&
      typeof fields.issuedAt === "number" && Number.isFinite(fields.issuedAt) &&
      fields.issuedAt <= now && now - fields.issuedAt <= 10 * 60 * 1000;
  } catch {
    return false;
  }
}
