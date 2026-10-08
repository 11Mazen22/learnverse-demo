import { safeNextPath } from "@/lib/i18n/auth-errors";

export type AuthFlow = "signup" | "recovery" | "oauth";

export function authCallbackUrl(origin: string, flow: AuthFlow, next = "/") {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("flow", flow);
  url.searchParams.set("next", flow === "recovery" ? "/auth/update-password" : safeNextPath(next));
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
