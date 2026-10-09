import { test } from "node:test";
import assert from "node:assert/strict";
import { APPROVED_STAGING_REF, APPROVED_PRODUCTION_REF, resolveSupabaseConfiguration,
  createGuardedSupabaseFetch, authorizedSupabaseUrl, CONFIGURATION_ERROR_CODE } from "./network-policy.ts";

const url = `https://${APPROVED_STAGING_REF}.supabase.co`;
const key = "sb_publishable_network_isolation_fixture_only";
const configured = (overrides = {}) => resolveSupabaseConfiguration({ url, key, deploymentEnvironment: "preview", ...overrides });
const jwt = (claims: object) => "eyJhbGciOiJIUzI1NiJ9." + Buffer.from(JSON.stringify(claims)).toString("base64url") + ".fixture";

for (const environment of ["development", "preview", "test"]) {
  test(`approved staging is available in ${environment}, without an origin fallback`, () => {
    assert.equal(configured({ deploymentEnvironment: environment }).origin, url);
    assert.equal(configured({ deploymentEnvironment: environment }).error, null);
    assert.equal(configured({ url: url + "/" }).origin, url);
  });
}
test("production is independently configured and never authorized by NODE_ENV or a preview URL", () => {
  const productionUrl = `https://${APPROVED_PRODUCTION_REF}.supabase.co`;
  assert.equal(configured({ deploymentEnvironment: "production", url: productionUrl }).origin, null);
  const production = configured({ deploymentEnvironment: "production", url: productionUrl, productionProjectRef: APPROVED_PRODUCTION_REF });
  assert.equal(production.origin, productionUrl);
  assert.equal(configured({ url: productionUrl, productionProjectRef: APPROVED_PRODUCTION_REF }).origin, null);
  assert.equal(configured({ deploymentEnvironment: "production", productionProjectRef: APPROVED_PRODUCTION_REF }).origin, null);
  assert.equal(authorizedSupabaseUrl(url + "/rest/v1/profiles", production), false);
});
for (const invalid of [undefined, "", "not-a-url", url + "/rest/v1", url + "?foo=bar", url + "#fragment", " " + url,
  url.replace("https:", "http:"), url.replace(".co", ".co.attacker.invalid"), url.replace("https://", "https://name:pass@"),
  url + ":444", "https://qvfywwpoktmbjsunqizr.supabase.co", `https://${APPROVED_PRODUCTION_REF}.supabase.co`, "https://localhost"]) {
  test(`invalid origin fails closed: ${String(invalid)}`, async () => {
    const config = configured({ url: invalid });
    assert.equal(config.origin, null);
    assert.equal(config.key, "");
    let networkCalls = 0;
    const guarded = createGuardedSupabaseFetch(config, async () => { networkCalls++; return new Response(); });
    assert.equal((await guarded(url + "/auth/v1/token")).status, 403);
    assert.equal(networkCalls, 0);
  });
}
for (const invalid of [undefined, "", "anon", "sb_secret_private_never_public", key + " ",
  jwt({ role: "service_role", ref: APPROVED_STAGING_REF }), jwt({ role: "anon", ref: "qvfywwpoktmbjsunqizr" }), "broken.jwt.value"]) {
  test("missing, malformed, privileged and mismatched public keys fail closed", () => assert.equal(configured({ key: invalid }).origin, null));
}
test("compatible legacy anon JWT is accepted, never service-role JWT", () => {
  assert.equal(configured({ key: jwt({ role: "anon", ref: APPROVED_STAGING_REF }) }).origin, url);
});

for (const path of ["/rest/v1/profiles", "/rest/v1/rpc/submit_attempt", "/auth/v1/token?grant_type=password",
  "/auth/v1/user", "/auth/v1/.well-known/jwks.json", "/auth/v1/authorize?provider=google", "/storage/v1/object/noata-uploads/user/file",
  "/storage/v1/object/sign/noata-documents/user/source.pdf?token=fixture", "/functions/v1/noata-ai-v2"]) {
  test(`authorized transport preserves request but disables redirect escape: ${path}`, async () => {
    const controller = new AbortController();
    const request = new Request(url + path, { method: "POST", body: "fixture", headers: { apikey: key }, signal: controller.signal });
    let calls = 0;
    const guarded = createGuardedSupabaseFetch(configured(), async (input, init) => {
      calls++;
      assert.equal(input, request);
      assert.equal(init?.redirect, "error");
      assert.equal(init?.signal, controller.signal);
      assert.equal((input as Request).headers.get("apikey"), key);
      assert.equal(await (input as Request).text(), "fixture");
      return Response.json({ ok: true });
    });
    assert.equal((await guarded(request, { signal: controller.signal, redirect: "follow" })).status, 200);
    assert.equal(calls, 1);
  });
}
test("foreign, malformed, credentialed and non-service destinations never reach fetch", async () => {
  let calls = 0;
  const guarded = createGuardedSupabaseFetch(configured(), async () => { calls++; return new Response(); });
  for (const target of ["/relative", "bad url", "https://qvfywwpoktmbjsunqizr.supabase.co/functions/v1/noata-ai-v2",
    `https://${APPROVED_PRODUCTION_REF}.supabase.co/auth/v1/token`, "https://external.invalid/storage/v1/object",
    url + "/unrecognized", url + "/auth/v1/user#x", url.replace("https://", "https://user:password@") + "/auth/v1/token",
    url.replace(".co", ".co.attacker.invalid") + "/rest/v1/profiles"]) {
    const response = await guarded(target);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, CONFIGURATION_ERROR_CODE);
  }
  assert.equal(calls, 0);
});
test("invalid deployment environment fails closed", () => assert.equal(configured({ deploymentEnvironment: "prod" }).origin, null));
