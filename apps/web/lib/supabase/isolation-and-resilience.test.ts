import assert from "node:assert/strict";
import test from "node:test";
import { onlyOwnedRecords } from "../appearance/account-scope.ts";
import {
  loadScopedStudyDraft,
  purgeForeignOrExpiredStudyDrafts,
  saveScopedStudyDraft,
  wipeAllStudyDrafts,
  type StorageLike,
} from "../study/draft-storage.ts";
import { boundedRead } from "./bounded-read.ts";

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

test("boundedRead fails closed on timeout and resolves cleanly on retry", async () => {
  const stalled = new Promise<{ ok: boolean }>(() => {
    // intentionally never resolves
  });
  await assert.rejects(
    boundedRead(stalled, 20),
    /Session read timed out/,
  );

  const recovered = await boundedRead(Promise.resolve({ ok: true, attempt: 2 }), 200);
  assert.deepEqual(recovered, { ok: true, attempt: 2 });
});

test("cross-account and sign-out cleanup isolate study, dashboard preference, and AI drafts", () => {
  const store = new MemoryStorage();
  const now = 1_750_000_000_000;

  saveScopedStudyDraft(store, "user-a", 1, "quiz-1", { answer: "alpha" }, now);
  store.setItem("noata:dashboard-prefs:user-a", JSON.stringify({ version: 1 }));
  store.setItem("noata:dashboard-prefs:guest", JSON.stringify({ version: 1 }));
  store.setItem("noata-ai-draft:user-a", "user a private draft");
  store.setItem("noata-ai-draft", "legacy unscoped draft");

  // User B signs in on the same browser: foreign study/pref/AI keys for User A and unscoped keys purge immediately,
  // while guest fallback stays intact.
  saveScopedStudyDraft(store, "user-b", 2, "quiz-2", { answer: "beta" }, now + 1000);
  store.setItem("noata:dashboard-prefs:user-b", JSON.stringify({ version: 1 }));
  store.setItem("noata-ai-draft:user-b", "user b draft");

  const removedOnSwitch = purgeForeignOrExpiredStudyDrafts(store, "user-b", 2, now + 2000);
  assert.equal(removedOnSwitch, 4);
  assert.equal(
    loadScopedStudyDraft(store, "user-a", 1, "quiz-1", now + 2000),
    null,
  );
  assert.deepEqual(
    loadScopedStudyDraft(store, "user-b", 2, "quiz-2", now + 2000),
    { answer: "beta" },
  );
  assert.equal(store.getItem("noata:dashboard-prefs:user-a"), null);
  assert.ok(store.getItem("noata:dashboard-prefs:user-b"));
  assert.ok(store.getItem("noata:dashboard-prefs:guest"));
  assert.equal(store.getItem("noata-ai-draft:user-a"), null);
  assert.equal(store.getItem("noata-ai-draft"), null);
  assert.equal(store.getItem("noata-ai-draft:user-b"), "user b draft");

  // Sign-out wipes every active user study draft, non-guest dashboard preference, and AI draft.
  const removedOnSignOut = wipeAllStudyDrafts(store);
  assert.equal(removedOnSignOut, 3);
  assert.equal(store.getItem("noata:dashboard-prefs:user-b"), null);
  assert.equal(store.getItem("noata-ai-draft:user-b"), null);
  assert.ok(store.getItem("noata:dashboard-prefs:guest"));
});

test("onlyOwnedRecords enforces client display ownership boundaries", () => {
  const rows = [
    { id: "r1", user_id: "user-a", title: "Deck A" },
    { id: "r2", user_id: "user-b", title: "Deck B" },
    { id: "r3", user_id: "user-a", title: "Note A" },
  ];
  assert.deepEqual(
    onlyOwnedRecords(rows, "user-a").map((r) => r.id),
    ["r1", "r3"],
  );
  assert.deepEqual(onlyOwnedRecords(rows, null), []);
  assert.deepEqual(onlyOwnedRecords(rows, ""), []);
});
