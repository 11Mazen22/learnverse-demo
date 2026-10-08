import test from "node:test";
import assert from "node:assert/strict";
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
