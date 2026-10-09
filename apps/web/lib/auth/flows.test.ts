import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { safeNextPath } from "../i18n/auth-errors.ts";
import {
  authCallbackUrl, normalizedAuthFlow,
  recoveryGrantValue, validRecoveryGrant, RECOVERY_GRANT_LIFETIME_MS,
  authCompletionValue, validAuthCompletion,
} from "./flows.ts";

test("email verification, OAuth and recovery each get their own exact safe callback",()=>{
  assert.equal(authCallbackUrl("https://noata.example","recovery","/ai"),
    "https://noata.example/auth/callback?flow=recovery&next=%2Fauth%2Fupdate-password");
  assert.equal(new URL(authCallbackUrl("https://noata.example","signup","/progress")).searchParams.get("next"),"/progress");
  assert.equal(new URL(authCallbackUrl("https://noata.example","oauth","//untrusted.example")).searchParams.get("next"),"/");
  assert.equal(new URL(authCallbackUrl("https://noata.example","signup","/\\evil")).searchParams.get("next"),"/");
});
test("preview redirect proxy preserves routing and flow without accepting untrusted hosts", () => {
  const proxy = "https://v0.app/api/supabase/callback?session=fixture";
  const callback = new URL(authCallbackUrl("https://preview.example", "recovery", "/ai", proxy));
  assert.equal(callback.origin, "https://v0.app");
  assert.equal(callback.searchParams.get("session"), "fixture");
  assert.equal(callback.searchParams.get("flow"), "recovery");
  assert.equal(callback.searchParams.get("next"), "/auth/update-password");
  for (const invalid of ["https://attacker.invalid", "https://v0.app.attacker.invalid", "https://name:password@v0.app/callback", "http://v0.app/callback"]) {
    assert.throws(() => authCallbackUrl("https://preview.example", "signup", "/", invalid));
  }
  assert.equal(new URL(authCallbackUrl("https://noata.example", "signup", "/\n//attacker.invalid")).searchParams.get("next"), "/");
});
test("login next-path rejects browser-normalized external redirects", () => {
  for (const invalid of ["//attacker.invalid", "/\\\\attacker.invalid", "/\n/attacker.invalid", "/\t/attacker.invalid", "javascript:alert(1)"])
    assert.equal(safeNextPath(invalid), "/");
  assert.equal(safeNextPath("/ai?chat=123"), "/ai?chat=123");
});
test("callback flow cannot be forced to unknown or arbitrary action",()=>{
  assert.equal(normalizedAuthFlow("recovery"),"recovery");
  assert.equal(normalizedAuthFlow("oauth"),"oauth");
  assert.equal(normalizedAuthFlow("signup"),"signup");
  assert.equal(normalizedAuthFlow("reset-password"),null);
  assert.equal(normalizedAuthFlow(null),null);
});
test("recovery must be bound to same user, short-lived and not accepted twice when cleared",()=>{
  const now=1_800_000_000_000;
  const grant=recoveryGrantValue("user-a",now);
  assert.equal(validRecoveryGrant(grant,"user-a",now+20_000),true);
  assert.equal(validRecoveryGrant(grant,"user-b",now+20_000),false);
  assert.equal(validRecoveryGrant(grant,"user-a",now+RECOVERY_GRANT_LIFETIME_MS+1),false);
  assert.equal(validRecoveryGrant(grant,"user-a",now-1),false);
  assert.equal(validRecoveryGrant(null,"user-a",now),false);
  assert.equal(validRecoveryGrant("not-json","user-a",now),false);
  assert.equal(validRecoveryGrant('{"userId":"user-a","issuedAt":"tomorrow"}',"user-a",now),false);
});

test("success page requires a matching recently confirmed server-side action receipt", () => {
  const now=1_800_000_000_000;
  const receipt=authCompletionValue("password-updated","u1",now);
  assert.equal(validAuthCompletion(receipt,"password-updated","u1",now+1000),true);
  assert.equal(validAuthCompletion(receipt,"verified","u1",now+1000),false);
  assert.equal(validAuthCompletion(receipt,"password-updated","u2",now+1000),false);
  assert.equal(validAuthCompletion(receipt,"password-updated","u1",now+11*60*1000),false);
  assert.equal(validAuthCompletion(null,"password-updated","u1",now),false);
});

test("PKCE callback never strips the code through Next-patched history before terminal navigation", () => {
  const source = readFileSync("apps/web/app/auth/callback/page.tsx", "utf8");
  assert.equal(source.includes("window.history.replaceState("), false);
  assert.equal(source.includes("window.history.pushState("), false);
  assert.ok(source.includes("exchangeCodeForSession(code)"));
  assert.ok(source.includes('window.location.replace("/auth/update-password")'));
  assert.ok(source.includes('window.location.replace("/auth/complete?type=verified")'));
  assert.ok(source.includes('window.location.replace("/auth/error?reason=invalid")'));
});

test("Supabase browser transport cannot auto-redeem the PKCE code before the explicit callback", () => {
  const client = readFileSync("apps/web/lib/supabase/client.ts", "utf8");
  assert.match(client, /auth:\s*\{\s*detectSessionInUrl:\s*false\s*\}/);
  const callback = readFileSync("apps/web/app/auth/callback/page.tsx", "utf8");
  assert.match(callback, /exchangeCodeForSession\(code\)/);
});
