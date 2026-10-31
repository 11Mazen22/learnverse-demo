import test from "node:test";
import assert from "node:assert/strict";
import {
  STUDENT_WELCOME_TOUR,
  TEACHER_WELCOME_TOUR,
  ADMIN_WELCOME_TOUR,
  PAGE_MINI_TOURS,
} from "../components/tour/tour-catalog.ts";

test("tour catalog provides distinct, isolated welcome tours for all 3 roles", () => {
  assert.equal(STUDENT_WELCOME_TOUR.role, "student");
  assert.equal(TEACHER_WELCOME_TOUR.role, "teacher");
  assert.equal(ADMIN_WELCOME_TOUR.role, "admin");

  // Student tour must not contain admin/teacher management steps
  for (const step of STUDENT_WELCOME_TOUR.steps) {
    assert.doesNotMatch(step.titleAr, /إدارة الفصول|حوكمة|صندوق التصحيح/);
    assert.doesNotMatch(step.titleEn, /Classroom Metrics|Grading Workspace|Governance/);
  }

  // Teacher tour must focus on classes, grading, and assignments
  const teacherStepIds = TEACHER_WELCOME_TOUR.steps.map((s) => s.id);
  assert.ok(teacherStepIds.includes("step_teacher_assignments"));
  assert.ok(teacherStepIds.includes("step_teacher_grading"));

  // Admin tour must focus on platform operations, user roles, and curriculum governance
  const adminStepIds = ADMIN_WELCOME_TOUR.steps.map((s) => s.id);
  assert.ok(adminStepIds.includes("step_admin_curriculum"));
  assert.ok(adminStepIds.includes("step_admin_users"));
});

test("student welcome tour references real curriculum, six subjects, and active tracks", () => {
  const curriculumStep = STUDENT_WELCOME_TOUR.steps.find((s) => s.id === "step_curriculum_tracks");
  assert.ok(curriculumStep, "Curriculum step must exist in student welcome tour");
  assert.ok(curriculumStep.descriptionAr.includes("العلوم المتكاملة"));
  assert.ok(curriculumStep.descriptionAr.includes("الرياضيات"));
  assert.ok(curriculumStep.descriptionEn.includes("6 core subjects"));
  assert.ok(curriculumStep.descriptionEn.includes("Integrated Science and Mathematics"));
});

test("page-level mini-tours cover all primary educational destinations", () => {
  const coveredPages = Object.keys(PAGE_MINI_TOURS);
  const requiredPages = ["/dashboard", "/learn", "/study", "/ai", "/assignments", "/rewards"];

  for (const page of requiredPages) {
    assert.ok(coveredPages.includes(page), `Page mini-tour must cover ${page}`);
    const tour = PAGE_MINI_TOURS[page];
    assert.ok(tour.steps.length >= 2, `${page} tour must have at least 2 structured steps`);
  }
});

test("tour content strictly adheres to bilingual parity and brand identity", () => {
  const allTours = [
    STUDENT_WELCOME_TOUR,
    TEACHER_WELCOME_TOUR,
    ADMIN_WELCOME_TOUR,
    ...Object.values(PAGE_MINI_TOURS),
  ];

  for (const tour of allTours) {
    assert.ok(tour.titleAr.length > 0);
    assert.ok(tour.titleEn.length > 0);
    assert.ok(tour.subtitleAr.length > 0);
    assert.ok(tour.subtitleEn.length > 0);

    for (const step of tour.steps) {
      assert.ok(step.titleAr.length > 0);
      assert.ok(step.titleEn.length > 0);
      assert.ok(step.descriptionAr.length > 0);
      assert.ok(step.descriptionEn.length > 0);
    }
  }
});
