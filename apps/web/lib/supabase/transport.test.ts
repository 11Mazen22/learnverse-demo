import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { readFile } from "node:fs/promises";
import { resolveSupabaseConfiguration, createGuardedSupabaseFetch, APPROVED_STAGING_REF } from "./network-policy.ts";
const origin = `https://${APPROVED_STAGING_REF}.supabase.co`;
const key = "sb_publishable_network_isolation_fixture_only";

for (const valid of [false, true]) {
  test(`actual SDK Auth, REST, RPC, Storage and Edge Functions ${valid ? "use approved transport" : "make zero network calls"}`, async () => {
    const seen: string[] = [];
    const configuration = resolveSupabaseConfiguration({ url: valid ? origin : "https://qvfywwpoktmbjsunqizr.supabase.co", key });
    const guarded = createGuardedSupabaseFetch(configuration, async (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      assert.equal(url.origin, origin);
      assert.equal(init?.redirect, "error");
      seen.push(url.pathname);
      return Response.json(url.pathname.startsWith("/auth/") ? { id: "00000000-0000-0000-0000-000000000001" } : []);
    });
    const db = createClient(configuration.origin ?? "https://supabase.disabled.invalid", configuration.key || "disabled", {
      global: { fetch: guarded }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    await db.auth.getUser("test_access_token");
    await db.from("profiles").select("id").retry(false);
    await db.rpc("submit_attempt").retry(false);
    await db.storage.from("noata-uploads").list();
    await db.functions.invoke("noata-ai-v2", { body: { action: "readiness" } });
    const server = createServerClient(configuration.origin ?? "https://supabase.disabled.invalid", configuration.key || "disabled", {
      global: { fetch: guarded }, cookies: { getAll: () => [], setAll: () => {} },
    });
    await server.auth.getUser("test_access_token");
    if (valid) assert.deepEqual(seen, ["/auth/v1/user", "/rest/v1/profiles", "/rest/v1/rpc/submit_attempt",
      "/storage/v1/object/list/noata-uploads", "/functions/v1/noata-ai-v2", "/auth/v1/user"]);
    else assert.deepEqual(seen, []);
  });
}

test("browser, server, proxy, direct streaming and signed document access retain guard wiring", async () => {
  const root = new URL("../../", import.meta.url);
  for (const file of ["lib/supabase/client.ts", "lib/supabase/server.ts", "lib/supabase/proxy.ts"]) {
    const source = await readFile(new URL(file, root), "utf8");
    assert.match(source, /fetch: (?:async|supabaseFetch)/);
    assert.match(source, /supabaseSdkConfiguration/);
  }
  const workspace = await readFile(new URL("components/ai/use-ai-workspace.ts", root), "utf8");
  assert.match(workspace, /await supabaseFetch\(\s*SUPABASE_URL/);
  assert.doesNotMatch(workspace, /await fetch\(\s*SUPABASE_URL/);
  const preview = await readFile(new URL("components/ai/original-document-preview.tsx", root), "utf8");
  assert.match(preview, /await supabaseFetch\(signed/);
  const login = await readFile(new URL("app/login/page.tsx", root), "utf8");
  assert.match(login, /skipBrowserRedirect: true/);
  assert.match(login, /isAuthorizedSupabaseUrl\(data.url\)/);
});
