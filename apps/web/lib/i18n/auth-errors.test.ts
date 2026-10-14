import test from "node:test";
import assert from "node:assert/strict";
import { localizeAuthError, safeNextPath } from "./auth-errors.ts";

test("English auth errors cover provider codes, messages and outages without Arabic leakage", () => {
  for (const error of [
    { code: "invalid_credentials" }, { code: "email_not_confirmed" },
    { code: "STAGING_CONFIGURATION_MISMATCH" }, { code: "weak_password" },
    { message: "Invalid login credentials" }, { message: "Failed to fetch" },
    { status: 429 }, { status: 503 }, { status: 500 }, null,
  ]) {
    const copy = localizeAuthError(error, "en");
    assert.ok(copy.length > 15);
    assert.equal(/[\u0600-\u06ff]/.test(copy), false);
  }
  assert.match(localizeAuthError({code:"weak_password"},"en"), /12/);
  assert.match(localizeAuthError({code:"invalid_credentials"}), /البريد/);
});

test("localization preserves the redirect safety boundary", () => {
  for(const path of ["//example.com", "https://example.com", "/\\example.com", "/\nadmin"])
    assert.equal(safeNextPath(path), "/");
  assert.equal(safeNextPath("/learn?course=1"), "/learn?course=1");
});
