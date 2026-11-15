# Lesson Experience & Educational Content Specification

**Target Scope:** `apps/web/components/learn/`, `apps/web/lib/curriculum/`, `apps/web/components/study/study-rich-text.tsx`, and staging-first curriculum data fixes.

---

## 1. Fixes Required First (Architectural Unblockers)

1. **Propagate `lessons.slug` Everywhere (`lesson-live.tsx:206-212`)**:
   - Include `slug` in the Supabase `lessons` select projection (`id,slug,unit_id,...`) and pass `lesson.slug || lesson.id` into:
     - `getLessonStudyCompanion(...)`
     - `PreLessonDiagnostic` (`lessonIdOrSlug`)
     - `SubjectLabRouter` (`lessonIdOrSlug`)
     - `buildStudyHref(...)` (`/study?lesson=<slug>&track=<slug>`)
     - `buildAiHref(...)` (structured reference with UUID `lesson_id` + readable metadata resolved server/client-side via `slug`)
   - Update `getLessonStudyCompanion` / `sec1-study-pack.test.ts` to cover slug-resolved DB lessons AND add explicit **topic-specific companion modules** (or DB-driven structured synthesis) so **Demo Science (`motion-basics`, `motion-graphs`)** and **Respiratory (`respiratory-*`)** never leak `sci-hydrosphere`.

2. **Eliminate Unstyled Collapsed Overviews, Repetition & Sparse Stage 1 Cards**:
   - **Hero (`lesson-live.tsx:737-810`)**: Keep only Subject Pill + Track Language Badge + Title + Concise 2-sentence Hook + Duration/XP/Coin metadata + Syllabus Provenance Dialog trigger (`SHA-256` & source metadata moved cleanly out of body prose). Never duplicate Stage 1 summary or worked examples here.
   - **Stage 1 — Orientation (`activeStage === 0`)**: Clear mission, prerequisites/knowledge map context, learning objectives, and optional **30-second Pre-Lesson Readiness Diagnostic** mapped via `lesson.slug`. Fix `knowledge-map.ts` diagnostic prompts to use `$...$` KaTeX and exact lesson slug matching.
   - **Stage 2 — Conceptual Understanding (`activeStage === 1`)**:
     - Remove unstyled `<details className="noata-summary-details">` (`lesson-live.tsx:1038`).
     - Render structured multi-card `keyConcepts` (`>= 2` progressive concept cards per lesson: Foundation -> Core Mechanism/Rule -> Application/Contrast) using **`StructuredStudyBlock[]` (`explanation`, `math`, `chemistry`, `callout`, `poetry_couplet`, `primary_source`)** via `StudyRichText` — zero `|` pipe-crammed plain strings, zero raw Unicode math superscripts (`i²`, `x²`) where LaTeX belongs.
     - Only show clean, non-duplicated DB summary paragraphs (stripped of appended `"Worked example:"` / `"Common mistakes:"` tail sections) when structured pack cards aren't present or as an explicitly styled `"Syllabus Context Note"` accordion in `@layer sections`.
   - **Stage 3 — Guided Worked Examples (`activeStage === 2`)**:
     - Deduplicate DB `worked` vs `companion.workedExamples`: show structured interactive steppers *without* repeating the exact same problem twice back-to-back (e.g. present Guided Model Solution 1 -> Active Step-by-Step Worked Problem 2 with different numbers/angle).
     - Change `lesson-live.tsx:1167` default from `example.steps.length` to `1` (`revealed = revealedStepsByExample[exIdx] ?? 1`) so students genuinely walk through Given -> Rule -> Substitution -> Result -> Why/Trap step by step (`"Reveal Next Step"` / `"Reveal All"`).
   - **Stage 4 — Active Interactive Lab (Integrated Subject Teaching)**:
     - Code-split per-subject lab views with `next/dynamic`.
     - Fix `ArabicLab:200` (move `{tok.roleAr}` out of initial button face into click-revealed parse inspector panel so it teaches instead of giving answers away).
     - Localize ALL SVG diagrams in `MathPilotLab` (`Re/Im`, axes, cycle hints) and `SciencePilotLab` (`H-bond`, `External bath`, `Cell`, osmotic arrows) dynamically using `contentLocale`.
     - Align `HistoryLab` Contemporary Era boundary to **1789 CE** (with explicit historiographic note on 1789 vs 1914 classifications).
     - Expand `EnglishLab` (tense/voice transforms + collocation + context cloze) and `PhilosophyLab` (additional fallacy + formal vs empirical scenarios); bind `EnglishLab` Arabic scaffolding strictly to `contentLocale` rather than `uiLocale`.
   - **Stage 5 — Practice & Comprehension Verification (`activeStage === 3`)**:
     - Render question prompts, MCQ options (`ChoiceCardGroup inline`), hints (`lesson-live.tsx:1432`), misconception feedback (`extractDistractorFeedback`), and diagnostic feedback (`pre-lesson-diagnostic.tsx:116`) cleanly through `StudyRichText`.
     - Add `useConfirmedMutation` + `account.revision` guard around `submit_attempt` quick-check calls (`lesson-live.tsx:542-658`).
   - **Stage 6 — Common Mistakes, Key Takeaways & Connected Retention (`activeStage === 4`)**:
     - Ensure every lesson surfaces authentic lesson-specific `common_mistakes` (addressing the 30 DB lessons currently at `0 cm`), concise formulas/recap, 1-click Flashcard Review (`slug` + `track` preserved), Missions (server-verified `complete_lesson`), Smart Review, and next-lesson link.

3. **Standardize UI Stage Numbering & Subject Accent Tokens**:
   - Align `STAGES` labels (`01..06` or `01..05` clearly labeled `Stage 1`..`Stage 5/6` consistently across sidebar outline, header indicator, and ARIA labels) and add `"english"` to `getLessonDiscipline()` in `lesson-live.tsx:662-672`.
   - Pass explicit `data-subject-accent` across all 6 subjects cleanly.

---

## 2. Structured Content & Notation Standards

1. **Zero Pipe-Delimited Rules (`|`)**: Split compound rules into separate `math` / `chemistry` / `callout` blocks inside `StructuredStudyBlock[]`.
2. **KaTeX Everywhere Math & Chemistry Equations Appear**: Replace `990` Unicode hacks in `sec1-all-lessons-pack.ts` + `491` in `TOPIC_MODULES` + plain equations in DB lessons/questions with hardened `$...$` / `$$...$$` or `{ type: "math" | "chemistry" }` blocks (`trust: false`, `maxExpand: 100`, `<bdi dir="ltr">` bidi isolation, `> 500` char safety guard). Keep ordinary text like `a/b` or prose free of false-positive regex conversion.
3. **Curriculum Data Corrections (Staging-First Additive Migration + Pack Sync)**:
   - Unify Arabic Mathematics track notation cleanly (explicitly align DB Arabic Math, `sec1-all-lessons-pack.ts` `pack-math-ar-*`, `knowledge-map.ts`, and `MathPilotLab` Arabic mode — keeping mathematical notation clear and consistent rather than mixing `ت/س` with `i/x` arbitrarily).
   - Correct confirmed typos via forward-only staging-verified SQL update migration + sync canonical packs: `'ف(m)'` -> `'د(س)'` / `'f(x)'`, `'والأقتران'` -> `'والاقتران'`, `'غير صفرية آخر'`, `'عدم يساويه صفرًا'`, `'بواضح الفكرة'`.
   - Embed verified literary passages/verses into Arabic literature packs/labs using `poetry_couplet` and `primary_source` blocks (and note clearly where full public textbook editions remain companion references).
