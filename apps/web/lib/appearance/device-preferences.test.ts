import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_ACCOUNT_SCOPE_KEY,
  LOCALE_PREF_PREFIX,
  MOTION_PREF_PREFIX,
  PALETTE_PREF_PREFIX,
  purgeForeignOrSignedOutDevicePreferences,
  QURAN_BOOKMARKS_PREFIX,
  QURAN_READING_SIZE_PREFIX,
  readScopedDevicePreference,
  readScopedMotionPreference,
  SERVER_REDUCED_MOTION_PREFIX,
  setActiveAccountScope,
  syncMotionDomAttributes,
  THEME_PREF_PREFIX,
  writeScopedDevicePreference,
} from "./device-preferences.ts";

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
  };
}

test("scoped device preferences isolate users and block legacy unscoped inheritance on sign-in", () => {
  const storage = createMemoryStorage({
    "noata-theme": "dark",
    "noata-palette": "midnight",
    "noata-locale": "en",
    "noata-quran-bookmarks-v1": '["1:1"]',
  });

  // Guest with no prior signed-in scope can read legacy guest key
  assert.equal(
    readScopedDevicePreference(THEME_PREF_PREFIX, {
      userId: null,
      legacyKey: "noata-theme",
      storage,
    }),
    "dark",
  );

  // Signing in as student-a must NOT inherit unscoped legacy keys
  assert.equal(
    readScopedDevicePreference(THEME_PREF_PREFIX, {
      userId: "student-a",
      legacyKey: "noata-theme",
      storage,
    }),
    null,
  );

  writeScopedDevicePreference(PALETTE_PREF_PREFIX, "ocean", {
    userId: "student-a",
    storage,
  });
  writeScopedDevicePreference(LOCALE_PREF_PREFIX, "en", {
    userId: "student-a",
    storage,
  });
  writeScopedDevicePreference(QURAN_BOOKMARKS_PREFIX, '["2:255"]', {
    userId: "student-a",
    storage,
  });
  writeScopedDevicePreference(QURAN_READING_SIZE_PREFIX, "130", {
    userId: "student-a",
    storage,
  });

  // Switching to student-b purges legacy keys and student-a keys
  const purged = purgeForeignOrSignedOutDevicePreferences("student-b", storage);
  assert.equal(purged, 8);
  assert.equal(storage.getItem(ACTIVE_ACCOUNT_SCOPE_KEY), "student-b");
  assert.equal(storage.getItem("noata-theme"), null);
  assert.equal(
    readScopedDevicePreference(PALETTE_PREF_PREFIX, { userId: "student-a", storage }),
    null,
  );

  // Signing out switches scope back to guest and removes student-b keys
  writeScopedDevicePreference(THEME_PREF_PREFIX, "dark", { userId: "student-b", storage });
  const signOutPurged = purgeForeignOrSignedOutDevicePreferences(null, storage);
  assert.equal(signOutPurged, 1);
  assert.equal(storage.getItem(ACTIVE_ACCOUNT_SCOPE_KEY), "guest");
});

test("motion attribute synchronization keeps data-reduced-motion and data-noata-motion aligned", () => {
  const attrs = new Map<string, string>();
  const fakeRoot = {
    dataset: new Proxy(
      {},
      {
        set(_t, prop: string, val: string) {
          const kebab = "data-" + prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          attrs.set(kebab, val);
          return true;
        },
        get(_t, prop: string) {
          const kebab = "data-" + prop.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
          return attrs.get(kebab);
        },
      },
    ),
    removeAttribute(name: string) {
      attrs.delete(name);
    },
  } as unknown as HTMLElement;

  syncMotionDomAttributes({ mode: "system", serverReducedMotion: true, root: fakeRoot });
  assert.equal(attrs.get("data-reduced-motion"), "true");
  assert.equal(attrs.get("data-noata-motion"), "reduce");

  syncMotionDomAttributes({ mode: "off", serverReducedMotion: false, root: fakeRoot });
  assert.equal(attrs.get("data-reduced-motion"), "true");
  assert.equal(attrs.get("data-noata-motion"), "off");

  syncMotionDomAttributes({ mode: "full", serverReducedMotion: false, root: fakeRoot });
  assert.equal(attrs.get("data-reduced-motion"), "false");
  assert.equal(attrs.get("data-noata-motion"), "full");

  syncMotionDomAttributes({ mode: "system", serverReducedMotion: false, root: fakeRoot });
  assert.equal(attrs.get("data-reduced-motion"), "false");
  assert.equal(attrs.has("data-noata-motion"), false);

  const storage = createMemoryStorage();
  setActiveAccountScope("student-z", storage);
  writeScopedDevicePreference(MOTION_PREF_PREFIX, "reduce", { storage });
  writeScopedDevicePreference(SERVER_REDUCED_MOTION_PREFIX, "true", { storage });
  assert.equal(readScopedMotionPreference(undefined, storage), "reduce");
});
