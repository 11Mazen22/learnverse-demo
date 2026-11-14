import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCommandActions,
  CORE_CURRICULUM_SUBJECTS,
  getEffectiveRole,
  getMobileDockRoutes,
  getWorkspaceLabel,
  pushRecentDestination,
  resolvePageTitle,
  resolveRouteIcon,
} from "./navigation.ts";

test("role-aware command center isolates teacher and admin actions cleanly", () => {
  const guestActions = buildCommandActions({ effectiveRole: "guest" });
  assert.equal(guestActions.some((a) => a.href === "/teacher"), false);
  assert.equal(guestActions.some((a) => a.href === "/admin"), false);

  const studentActions = buildCommandActions({ effectiveRole: "student" });
  assert.equal(studentActions.some((a) => a.href === "/teacher"), false);
  assert.equal(studentActions.some((a) => a.href === "/admin"), false);
  assert.equal(studentActions.some((a) => a.id === "quick:srs-review"), true);

  const teacherActions = buildCommandActions({ effectiveRole: "teacher" });
  assert.equal(teacherActions.some((a) => a.href === "/teacher"), true);
  assert.equal(teacherActions.some((a) => a.href === "/admin"), false);

  const adminActions = buildCommandActions({ effectiveRole: "admin" });
  assert.equal(adminActions.some((a) => a.href === "/teacher"), true);
  assert.equal(adminActions.some((a) => a.href === "/admin"), true);
});

test("command center exposes all 6 core curriculum subjects and instant appearance actions", () => {
  const actions = buildCommandActions({ effectiveRole: "student", locale: "en", currentTheme: "light" });
  assert.equal(CORE_CURRICULUM_SUBJECTS.length, 6);
  for (const subject of CORE_CURRICULUM_SUBJECTS) {
    assert.ok(
      actions.some((a) => a.href === `/learn?subject=${subject.slug}`),
      `Missing command action for subject ${subject.slug}`
    );
  }
  assert.ok(actions.some((a) => a.effect === "toggle-theme"));
  assert.ok(actions.some((a) => a.effect === "toggle-locale"));
});

test("mobile dock adapts to verified role while keeping student default intact", () => {
  assert.deepEqual(
    getMobileDockRoutes("guest").map((r) => r.href),
    ["/", "/learn", "/ai", "/progress"]
  );
  assert.deepEqual(
    getMobileDockRoutes("student").map((r) => r.href),
    ["/", "/learn", "/ai", "/progress"]
  );
  assert.deepEqual(
    getMobileDockRoutes("teacher").map((r) => r.href),
    ["/", "/teacher", "/assignments", "/ai"]
  );
  assert.deepEqual(
    getMobileDockRoutes("admin").map((r) => r.href),
    ["/", "/admin", "/teacher", "/ai"]
  );
});

test("recent destinations deduplicate and ignore auth routes", () => {
  let recents: string[] = [];
  recents = pushRecentDestination(recents, "/learn");
  recents = pushRecentDestination(recents, "/study#top");
  recents = pushRecentDestination(recents, "/login");
  recents = pushRecentDestination(recents, "/learn");
  assert.deepEqual(recents, ["/learn", "/study"]);
});

test("effective role and workspace titles resolve deterministically", () => {
  assert.equal(getEffectiveRole("admin", false), "guest");
  assert.equal(getEffectiveRole("teacher", true), "teacher");
  assert.equal(getWorkspaceLabel("teacher", "teacher", "en").badgeEn, "Teacher");
  assert.equal(resolvePageTitle("/lesson/abc", "student", "en"), "Interactive Lesson");
  assert.equal(resolvePageTitle("/study", "student", "ar"), "مركز المذاكرة");
  assert.equal(resolveRouteIcon("/learn"), "book");
  assert.equal(resolveRouteIcon("/lesson/abc"), "book");
  assert.equal(resolveRouteIcon("/review"), "review");
  assert.equal(resolveRouteIcon("/study"), "clipboard");
  assert.equal(resolveRouteIcon("/unknown"), "compass");
});
