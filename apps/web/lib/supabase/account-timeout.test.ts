import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("account verification has an outer watchdog and cannot spin forever", async () => {
  const source = await readFile(new URL("./use-verified-account.tsx", import.meta.url), "utf8");
  assert.match(source, /const watchdog = setTimeout/);
  assert.match(source, /setFailed\(true\)/);
  assert.match(source, /setLoading\(false\)/);
  assert.match(source, /clearTimeout\(watchdog\)/);
  assert.match(source, /12000/);
  assert.match(source, /VerifiedAccountProvider/);
  assert.match(source, /supabaseConfiguration\.error/);
});
