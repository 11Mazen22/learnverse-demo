/** Server-only provider credentials. Environment variables win; otherwise a
 * narrowly scoped Vault RPC supplies the value to the service role. Values are
 * cached briefly and are never logged or returned to a client.
 */
type RpcReader = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
};
const allowed = new Set(["LANGSEARCH_API_KEY", "NOATA_SEARCH_ENABLED"]);
const cache = new Map<string, { value: string; at: number }>();
const TTL = 300_000;

export function allowedProviderSecret(name: string): boolean {
  return allowed.has(name);
}
export async function readProviderSecret(
  reader: RpcReader,
  name: string,
  options: { now?: number; fresh?: boolean } = {},
): Promise<string> {
  if (!allowedProviderSecret(name)) return "";
  const environment = (globalThis as { Deno?: { env: { get: (key: string) => string | undefined } } }).Deno?.env.get(name);
  if (environment) return environment;
  const now = options.now ?? Date.now();
  const hit = cache.get(name);
  if (!options.fresh && hit && now - hit.at < TTL) return hit.value;
  try {
    const { data, error } = await reader.rpc("noata_provider_secret", { secret_name: name });
    if (error) return "";
    const value = typeof data === "string" ? data.trim() : "";
    cache.set(name, { value, at: now });
    return value;
  } catch {
    // A failed lookup is not a credential. Do not cache an outage for minutes.
    return "";
  }
}
export function clearProviderSecretCache(): void {
  cache.clear();
}
