import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSec1CurriculumGrounding,
  type DbLessonSnippet,
} from "../../../../supabase/functions/noata-ai/curriculum-grounding.ts";

const lesson = (overrides: Partial<DbLessonSnippet>): DbLessonSnippet => ({
  id: overrides.id ?? crypto.randomUUID(),
  title_ar: overrides.title_ar ?? "درس تجريبي",
  title_en: overrides.title_en ?? "Fixture lesson",
  content: overrides.content ?? { summary_ar: "شرح تعليمي" },
  track_slug: overrides.track_slug ?? "history-ar",
  subject_slug: overrides.subject_slug ?? "history",
  content_language: overrides.content_language ?? "ar",
});

test("curriculum grounding always covers all six First Secondary subjects", () => {
  const text = buildSec1CurriculumGrounding({ queryText: "عايز أذاكر مواد أولى ثانوي" });
  for (const label of [
    "Integrated Science",
    "Mathematics",
    "Philosophy & Logic",
    "History",
    "Arabic Language",
    "English",
  ]) {
    assert.match(text, new RegExp(label.replace(/[&]/g, "\\&")));
  }
  assert.match(text, /Teacher behavior for substantive study questions/);
});

test("JSONB lesson bodies become useful teaching context without provenance leakage", () => {
  const text = buildSec1CurriculumGrounding({
    queryText: "اشرح الأوستراكا كمصدر تاريخي",
    subjectHint: "history",
    dbLessons: [
      lesson({
        title_ar: "مصادر دراسة الحضارات",
        title_en: "Sources for Studying Civilizations",
        content: {
          summary_ar: "الأوستراكا شقفات فخار وحجر جيري استُخدمت للكتابة اليومية وكانت أقل تكلفة من البردي.",
          worked_example_ar: "نص يومي على شقفة فخار يُعد مصدرًا أوليًا إذا كُتب زمن الحدث.",
          source_url: "https://internal.invalid/never-show-this",
          provenance: { file: "private-curriculum-pack.json" },
        },
      }),
    ],
    difficulty: "standard",
    pedagogicalMode: "concept_explain",
  });

  assert.match(text, /الأوستراكا شقفات فخار/);
  assert.match(text, /مصدرًا أوليًا/);
  assert.doesNotMatch(text, /internal\.invalid|private-curriculum-pack|\[object Object\]/);
  assert.match(text, /never quote, name, cite, or reveal this block/);
});

test("ranking searches the complete catalogue instead of an arbitrary first page", () => {
  const decoys = Array.from({ length: 24 }, (_, index) =>
    lesson({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      title_ar: `درس تمهيدي ${index}`,
      title_en: `Intro lesson ${index}`,
      content: { summary_ar: "محتوى عام عن الحضارة" },
    }),
  );
  const target = lesson({
    id: "99999999-9999-4999-8999-999999999999",
    title_ar: "توحيد القطرين",
    title_en: "Unification of Upper and Lower Egypt",
    content: { summary_ar: "وحّد الملك نعرمر القطرين نحو 3200 قبل الميلاد." },
  });

  const text = buildSec1CurriculumGrounding({
    queryText: "مين وحد القطرين؟ اشرح دور نعرمر",
    dbLessons: [...decoys, target],
  });
  assert.match(text, /توحيد القطرين/);
  assert.match(text, /وحّد الملك نعرمر/);
});

test("an enrolled English track wins over the parallel Arabic edition", () => {
  const text = buildSec1CurriculumGrounding({
    queryText: "Explain why ice floats on water",
    subjectHint: "integrated-science",
    activeTrackSlugs: ["integrated-science-en"],
    dbLessons: [
      lesson({
        title_ar: "الخواص الفيزيائية للماء",
        title_en: "Physical Properties of Water — Arabic edition",
        subject_slug: "integrated-science",
        track_slug: "integrated-science-ar",
        content_language: "ar",
        content: { summary_ar: "يطفو الجليد لأن كثافته أقل من الماء السائل." },
      }),
      lesson({
        title_ar: "Physical Properties of Water — English track",
        title_en: "Physical Properties of Water",
        subject_slug: "integrated-science",
        track_slug: "integrated-science-en",
        content_language: "en",
        content: { summary_en: "Ice floats because its open crystal lattice makes it less dense than liquid water." },
      }),
    ],
  });

  const english = text.indexOf("open crystal lattice");
  const arabic = text.indexOf("كثافته أقل");
  assert.ok(english >= 0, "English track context must be selected");
  assert.ok(arabic < 0 || english < arabic, "English track must rank ahead of the Arabic edition");
});
