import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_WELCOME_TOUR,
  PAGE_MINI_TOURS,
  STUDENT_WELCOME_TOUR,
  TEACHER_WELCOME_TOUR,
} from "../components/tour/tour-catalog.ts";
import {
  mergeTourStates,
  pageTourForPath,
  roleCanUseTour,
  sanitizeTourState,
  tourStorageKey,
} from "../components/tour/tour-state.ts";

test("welcome tours are separately authored and role isolated", () => {
  assert.equal(STUDENT_WELCOME_TOUR.role, "student");
  assert.equal(TEACHER_WELCOME_TOUR.role, "teacher");
  assert.equal(ADMIN_WELCOME_TOUR.role, "admin");
  assert.ok(TEACHER_WELCOME_TOUR.steps.some((step) => step.id === "teacher_assignment_builder"));
  assert.ok(TEACHER_WELCOME_TOUR.steps.some((step) => step.id === "teacher_grading"));
  assert.ok(ADMIN_WELCOME_TOUR.steps.some((step) => step.id === "admin_curriculum"));
  assert.ok(ADMIN_WELCOME_TOUR.steps.some((step) => step.id === "admin_users"));
  assert.equal(roleCanUseTour(ADMIN_WELCOME_TOUR, "student"), false);
  assert.equal(roleCanUseTour(TEACHER_WELCOME_TOUR, "admin"), false);
  assert.equal(roleCanUseTour(STUDENT_WELCOME_TOUR, null), false);
});

test("student guidance explains six subjects and independent Science and Mathematics tracks", () => {
  const curriculumStep = STUDENT_WELCOME_TOUR.steps.find((step) => step.id === "student_tracks");
  assert.ok(curriculumStep);
  assert.match(curriculumStep.descriptionAr, /علوم.*رياضيات/);
  assert.match(curriculumStep.descriptionEn, /Integrated Science and Mathematics/);
  assert.match(curriculumStep.descriptionEn, /Interface language never changes curriculum language/);
});

test("page guides cover every primary workspace and dynamic lessons", () => {
  const requiredPages = [
    "/",
    "/dashboard",
    "/learn",
    "/lesson/[id]",
    "/study",
    "/ai",
    "/assignments",
    "/progress",
    "/rewards",
    "/notifications",
    "/settings",
    "/teacher",
    "/admin",
  ];
  for (const page of requiredPages) {
    assert.ok(PAGE_MINI_TOURS[page], `missing page guide: ${page}`);
    assert.ok(PAGE_MINI_TOURS[page].steps.length >= 2, `${page} needs at least two steps`);
  }
  assert.equal(pageTourForPath("/lesson/lesson-123", "student")?.id, "page_lesson");
  assert.equal(pageTourForPath("/admin", "student"), null);
  assert.equal(pageTourForPath("/admin", "admin")?.id, "page_admin");
});

test("tour copy stays bilingual and avoids unsupported operational claims", () => {
  const tours = [
    STUDENT_WELCOME_TOUR,
    TEACHER_WELCOME_TOUR,
    ADMIN_WELCOME_TOUR,
    ...new Map(Object.values(PAGE_MINI_TOURS).map((tour) => [tour.id, tour])).values(),
  ];
  for (const tour of tours) {
    assert.ok(tour.titleAr.trim());
    assert.ok(tour.titleEn.trim());
    assert.ok(tour.subtitleAr.trim());
    assert.ok(tour.subtitleEn.trim());
    for (const step of tour.steps) {
      assert.ok(step.titleAr.trim());
      assert.ok(step.titleEn.trim());
      assert.ok(step.descriptionAr.trim());
      assert.ok(step.descriptionEn.trim());
      assert.doesNotMatch(step.descriptionEn, /immutable ledger|real-time telemetry|guaranteed provider/i);
    }
  }
});

test("tour browser state is scoped by authenticated user and role", () => {
  assert.equal(
    tourStorageKey("student-a", "student"),
    "noata_tour_state_v2:student-a:student",
  );
  assert.notEqual(
    tourStorageKey("student-a", "student"),
    tourStorageKey("student-b", "student"),
  );
  assert.notEqual(
    tourStorageKey("account-a", "teacher"),
    tourStorageKey("account-a", "admin"),
  );
});

test("tour state parsing rejects malformed or unbounded browser data", () => {
  const valid = {
    page_dashboard: {
      status: "in_progress",
      stepIndex: 1,
      version: 2,
      updatedAt: "2026-11-04T12:00:00.000Z",
      automaticDismissed: false,
    },
  };
  assert.deepEqual(sanitizeTourState(valid).page_dashboard?.stepIndex, 1);
  assert.deepEqual(sanitizeTourState({ bad: { status: "admin", stepIndex: -1 } }), {});
  assert.deepEqual(sanitizeTourState([]), {});
});

test("newer server progress wins without erasing unrelated local tours", () => {
  const local = sanitizeTourState({
    page_dashboard: {
      status: "in_progress",
      stepIndex: 1,
      version: 2,
      updatedAt: "2026-11-04T10:00:00.000Z",
      automaticDismissed: false,
    },
    page_learn: {
      status: "completed",
      stepIndex: 2,
      version: 2,
      updatedAt: "2026-11-04T09:00:00.000Z",
      automaticDismissed: false,
      completedAt: "2026-11-04T09:00:00.000Z",
    },
  });
  const remote = sanitizeTourState({
    page_dashboard: {
      status: "completed",
      stepIndex: 2,
      version: 2,
      updatedAt: "2026-11-04T11:00:00.000Z",
      automaticDismissed: false,
      completedAt: "2026-11-04T11:00:00.000Z",
    },
  });
  const merged = mergeTourStates(local, remote);
  assert.equal(merged.page_dashboard.status, "completed");
  assert.equal(merged.page_learn.status, "completed");
});
