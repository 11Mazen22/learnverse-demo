import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../apps/web/public/sw.js", import.meta.url), "utf8");
function worker(cacheNames = []) {
  const handlers = new Map(), calls = [];
  const context = {
    URL, Promise,
    self: { location: { origin: "https://noata.test" }, addEventListener: (name, handler) => handlers.set(name, handler), skipWaiting: async () => {}, clients: { claim: async () => {} } },
    caches: { match: async () => { calls.push("cache-read"); return { from: "cache" }; }, open: async () => ({ put: async () => { calls.push("cache-write"); }, addAll: async () => {} }), keys: async () => cacheNames, delete: async (name) => { calls.push("delete:" + name); return true; } },
    fetch: async () => { calls.push("network"); return { ok: true, from: "network", clone: () => ({}) }; },
  };
  vm.runInNewContext(source, context);
  return { calls, async activate() {
    let pending;
    handlers.get("activate")({waitUntil: promise => { pending = promise; }});
    await pending;
  }, async request(path, overrides = {}) {
    let response;
    handlers.get("fetch")({ request: { method: "GET", mode: "cors", cache: "default", url: "https://noata.test" + path, ...overrides }, respondWith: promise => { response = promise; } });
    return response === undefined ? undefined : await response;
  } };
}

test("no-store and reload requests never receive a stale cached CSS response", async () => {
  for (const cache of ["no-store", "reload"]) {
    const runtime = worker();
    assert.equal(await runtime.request("/_next/static/chunks/app.css", { cache }), undefined);
    assert.deepEqual(runtime.calls, []);
  }
});

test("authentication, APIs, worker updates and foreign origins stay outside the static cache", async () => {
  for (const path of ["/auth/callback", "/api/documents/pdf", "/api/quran", "/sw.js"]) {
    const runtime = worker();
    assert.equal(await runtime.request(path), undefined);
    assert.deepEqual(runtime.calls, []);
  }
  assert.equal(await worker().request("/image.png", { url: "https://foreign.test/image.png" }), undefined);
});

test("page navigation stays network-first; only public assets use cache-first", async () => {
  const page = worker();
  assert.equal((await page.request("/settings", { mode: "navigate" })).from, "network");
  assert.deepEqual(page.calls, ["network"]);
  const asset = worker();
  assert.equal((await asset.request("/fonts/cairo-arabic.woff2")).from, "cache");
  assert.deepEqual(asset.calls, ["cache-read"]);
});

test("mutations are never intercepted or represented as offline success", async () => {
  const runtime = worker();
  assert.equal(await runtime.request("/api/attempts", { method: "POST" }), undefined);
  assert.deepEqual(runtime.calls, []);
});

test("worker activation removes only obsolete Noata static caches", async () => {
  const runtime = worker(["noata-static-v4-official-mark", "noata-static-v5-network-only", "other-app-cache"]);
  await runtime.activate();
  assert.deepEqual(runtime.calls, ["delete:noata-static-v4-official-mark"]);
});
