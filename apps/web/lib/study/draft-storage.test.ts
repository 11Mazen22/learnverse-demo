import assert from "node:assert/strict";
import test from "node:test";
import {
  loadScopedStudyDraft,
  purgeForeignOrExpiredStudyDrafts,
  saveScopedStudyDraft,
  STUDY_DRAFT_TTL_MS,
  wipeAllStudyDrafts,
  type StorageLike,
} from "./draft-storage.ts";

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
    get length() {
      return map.size;
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
  };
}

test("scoped study drafts isolate users, respect 24h TTL, and wipe cleanly on account switch or sign-out", () => {
  const store = createMemoryStorage();
  const T0 = Date.parse("2026-11-14T10:00:00.000Z");

  saveScopedStudyDraft(store, "user-a", 1, "quiz_session", { currentIndex: 2 }, T0);
  assert.deepEqual(loadScopedStudyDraft(store, "user-a", 1, "quiz_session", T0 + 60_000), { currentIndex: 2 });

  // Different user or epoch cannot read User A's draft
  assert.equal(loadScopedStudyDraft(store, "user-b", 1, "quiz_session", T0 + 60_000), null);
  assert.equal(loadScopedStudyDraft(store, "user-a", 2, "quiz_session", T0 + 60_000), null);

  // Account switch wipes User A's entries cleanly
  saveScopedStudyDraft(store, "user-b", 3, "quiz_session", { currentIndex: 1 }, T0);
  const removed = purgeForeignOrExpiredStudyDrafts(store, "user-b", 3, T0 + 1000);
  assert.equal(removed, 1);
  assert.equal(store.length, 1);

  // 24h TTL expiry cleans stale entries
  assert.equal(loadScopedStudyDraft(store, "user-b", 3, "quiz_session", T0 + STUDY_DRAFT_TTL_MS + 1), null);
  assert.equal(store.length, 0);

  // Sign-out wipes everything
  saveScopedStudyDraft(store, "user-b", 3, "deck_editor", { title: "Draft" }, T0);
  assert.equal(wipeAllStudyDrafts(store), 1);
  assert.equal(store.length, 0);
});
