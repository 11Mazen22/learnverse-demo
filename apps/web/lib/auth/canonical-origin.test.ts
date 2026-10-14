import test from "node:test";
import assert from "node:assert/strict";
import { canonicalAuthOrigin, canonicalLoginDestination, NOATA_STAGING_AUTH_HOST } from "./canonical-origin.ts";

const STAGING = "https://" + NOATA_STAGING_AUTH_HOST;
const IMMUTABLE = "https://noata-3sc29ozin-noata.vercel.app";

test("preview login starts on stable approved branch host while preserving safe route and next path", () => {
  assert.equal(
    canonicalLoginDestination(IMMUTABLE + "/login?next=%2Fai", STAGING),
    STAGING + "/login?next=%2Fai",
  );
  assert.equal(canonicalLoginDestination(STAGING + "/login", STAGING), null);
  assert.equal(canonicalAuthOrigin(IMMUTABLE, STAGING), STAGING);
});

test("local, production, and custom domain auth sessions never change origin", () => {
  for (const origin of [
    "http://localhost:3000",
    "https://noata.example.com",
    "https://real-noata-domain.com",
  ]) {
    assert.equal(canonicalLoginDestination(origin + "/login", STAGING), null);
  }
});

test("invalid or unapproved host cannot replace approved staging callback", () => {
  for (const url of [
    undefined,
    "http://" + NOATA_STAGING_AUTH_HOST,
    STAGING + ".malicious.invalid",
    STAGING + "/redirect",
    STAGING + "/?next=/",
    "https://other-project.vercel.app",
    "javascript:alert(1)",
  ]) {
    assert.equal(canonicalAuthOrigin(IMMUTABLE, url), IMMUTABLE);
    assert.equal(canonicalLoginDestination(IMMUTABLE + "/login", url), null);
  }
});

test("preview auth callback path only canonicalizes trusted login entries, never changes query tokens", () => {
  const source = IMMUTABLE + "/login?next=%2Fprogress&foo=bar";
  assert.equal(
    canonicalLoginDestination(source, STAGING),
    STAGING + "/login?next=%2Fprogress&foo=bar",
  );
});
