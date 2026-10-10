import { createGuardedSupabaseFetch, resolveSupabaseConfiguration, authorizedSupabaseUrl } from "./network-policy.ts";

export const supabaseConfiguration = resolveSupabaseConfiguration({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  deploymentEnvironment: process.env.NEXT_PUBLIC_NOATA_DEPLOYMENT_ENV,
  productionProjectRef: process.env.NEXT_PUBLIC_NOATA_PRODUCTION_PROJECT_REF,
});
export const SUPABASE_URL = supabaseConfiguration.origin ?? "";
export const SUPABASE_PUBLISHABLE_KEY = supabaseConfiguration.key;

// The SDK requires nonempty constructor arguments even to show a local error.
// This reserved .invalid origin is NOT a fallback backend: the guarded transport
// refuses every request, and OAuth navigation is separately checked below.
export const supabaseSdkConfiguration = {
  url: SUPABASE_URL || "https://supabase.disabled.invalid",
  key: SUPABASE_PUBLISHABLE_KEY || "disabled",
};
export const supabaseFetch = createGuardedSupabaseFetch(supabaseConfiguration);
export const isAuthorizedSupabaseUrl = (url: unknown) => authorizedSupabaseUrl(url, supabaseConfiguration);
