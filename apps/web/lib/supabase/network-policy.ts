export const APPROVED_STAGING_REF = "vpfpjvhafkmygetjkfcp";
export const APPROVED_PRODUCTION_REF = "jdkfqdzgphzqbbzmerzr";
export const CONFIGURATION_ERROR_CODE = "SUPABASE_CONFIGURATION_INVALID";
export const CONFIGURATION_ERROR_MESSAGE = "إعدادات اتصال Noata غير معتمدة أو غير مكتملة. لم تُرسل بياناتك إلى أي مشروع؛ يُرجى تصحيح الربط قبل المحاولة.";

export type SupabaseConfiguration = Readonly<{
  origin: string | null;
  key: string;
  error: string | null;
}>;
export type SupabaseEnvironment = {
  url?: string;
  key?: string;
  deploymentEnvironment?: string;
  productionProjectRef?: string;
};

function validPublicKey(key: string, ref: string): boolean {
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return true;
  const parts = key.split(".");
  if (parts.length !== 3 || !parts.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return false;
  try {
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, "=")));
    return claims.role === "anon" && (!claims.ref || claims.ref === ref);
  } catch {
    return false;
  }
}

export function resolveSupabaseConfiguration(env: SupabaseEnvironment): SupabaseConfiguration {
  const denied = () => Object.freeze({ origin: null, key: "", error: CONFIGURATION_ERROR_MESSAGE });
  const environment = env.deploymentEnvironment ?? "development";
  if (!["development", "preview", "production", "test"].includes(environment)) return denied();
  const production = environment === "production";
  // Production is opt-in at deployment configuration, never inferred from a URL
  // or NODE_ENV (which is also production for ordinary staging builds).
  if (production && env.productionProjectRef !== APPROVED_PRODUCTION_REF) return denied();
  const ref = production ? APPROVED_PRODUCTION_REF : APPROVED_STAGING_REF;
  if (!env.url || !env.key || env.url.trim() !== env.url || env.key.trim() !== env.key) return denied();
  try {
    const url = new URL(env.url);
    if (url.origin !== `https://${ref}.supabase.co` || url.protocol !== "https:" ||
        url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
        !validPublicKey(env.key, ref)) return denied();
    return Object.freeze({ origin: url.origin, key: env.key, error: null });
  } catch {
    return denied();
  }
}

export function authorizedSupabaseUrl(input: unknown, config: SupabaseConfiguration): boolean {
  if (!config.origin || config.error || !config.key) return false;
  try {
    const target = new URL(input instanceof Request ? input.url : String(input));
    return target.origin === config.origin && target.protocol === "https:" &&
      !target.username && !target.password && !target.hash &&
      /^\/(auth|rest|storage|functions)\/v1\//.test(target.pathname);
  } catch {
    return false;
  }
}

export function blockedSupabaseResponse(): Response {
  return Response.json({ message: CONFIGURATION_ERROR_MESSAGE, code: CONFIGURATION_ERROR_CODE },
    { status: 503, headers: { "Cache-Control": "no-store" } });
}

export function createGuardedSupabaseFetch(
  configuration: SupabaseConfiguration,
  transport: typeof fetch = (...args) => fetch(...args),
): typeof fetch {
  return async (input, init) => {
    if (!authorizedSupabaseUrl(input, configuration)) return blockedSupabaseResponse();
    // Automatic redirects would bypass the origin check and forward an apikey
    // (including Storage signed tokens) to a destination we never authorized.
    return transport(input, { ...init, redirect: "error" });
  };
}
