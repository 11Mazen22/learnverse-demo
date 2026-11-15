# Curriculum & Lesson-by-Lesson Quality Audit (Phase 0 Baseline)

**Audit Coverage:** `55` Postgres seeded/migrated lessons (`supabase/migrations/*`), `46` canonical packs (`apps/web/lib/curriculum/sec1-all-lessons-pack.ts`), `12` runtime fallback modules (`apps/web/lib/curriculum/sec1-study-pack.ts`), and `6` Subject Interactive Labs (`apps/web/components/learn/labs/`).

---

## 1. Executive Root-Cause Diagnosis

Visual & pedagogical failure on live `/lesson/<uuid>` routes (such as `math-complex-intro`) stems from three compounded defects:

1. **Systemic UUID-vs-Slug Split-Brain (0 / 46 Canonical Packs Activate on Live DB Routes)**:
   - `apps/web/components/learn/lesson-live.tsx:206-212` fetches `"id,unit_id,position,title_ar,title_en,content,xp_reward,coin_reward,units(id,course_id,title_ar,title_en)"`, omitting **`lessons.slug`**.
   - It passes the DB UUID `id` (`L140, 148, 454, 713, 951, 1116`) to `getLessonStudyCompanion`, `PreLessonDiagnostic`, `SubjectLabRouter`, `/study`, and `/ai`.
   - Because `getLessonStudyPack()` (`sec1-all-lessons-pack.ts:3613-3625`) strictly compares `pack.lessonSlug === normalized`, **100% of UUID lookups miss** (`sec1-study-pack.test.ts` never tested UUIDs) and degrade silently onto the coarse 12-module `TOPIC_MODULES` array (`sec1-study-pack.ts:116-1123`).
2. **Coarse Fallback Collapsing & Cross-Course Leaks**:
   - All `11` Arabic lessons collapse into 1 grammar module (`TOPIC_MODULES[10]`), `5` History lessons collapse into `TOPIC_MODULES[9]`, `5` Philosophy lessons into `TOPIC_MODULES[8]`, `5` English lessons into `TOPIC_MODULES[11]`, Sci `4 & 5` share `TOPIC_MODULES[3]`, and Math `4 & 5` share `TOPIC_MODULES[7]`.
   - Worse, Demo Science (`motion-basics`, `motion-graphs` in `0009_demo_content_seed.sql`) and all `7` Respiratory System lessons (`20261017175911_respiratory_system_learning_pathway.sql`) evaluate `hasRealTrack = true` (`lesson-live.tsx:408`) and fall onto `TOPIC_MODULES[0]` (**`sci-hydrosphere` Water Cycle**), displaying Earth's water distribution inside breathing and motion lessons.
3. **Textbook Walls, Unstyled Collapsed Overview, Pre-Expanded Repetition & Missing KaTeX**:
   - All `55` DB lessons store `summary_ar`/`summary_en` as single un-paragraphed blocks (`nl2 = false`, up to `1,840–1,951` chars) with **`0` KaTeX `$...$` expressions**, collapsed behind an unstyled `<details className="noata-summary-details">` (`lesson-live.tsx:1038-1070`, `0` CSS rules).
   - Stage 1 showcases the fallback `TOPIC_MODULES` cards—where **all 4 Math modules have only `keyConcepts.length === 1`** and **`11/12` modules have `example: undefined` (`ex=0`)**—cramming formulas into plain pipe-delimited strings (`"z = a + bi | Re(z) = a , Im(z) = b | ..."`).
   - Stage 2 then renders BOTH DB `worked` AND `companion.workedExamples[0]` with `revealed = example.steps.length` (`lesson-live.tsx:1167` — **all steps pre-expanded**), displaying **the exact same `(1+i)/(1-i)` problem twice in a row** on Complex Numbers.

---

## 2. Database Curriculum Audit Matrix (`55` Seeded DB Lessons across `9` Courses)

Notation: `sumAr/En` = summary character count (`nl2=F` means single unbroken paragraph); `obj/cm/q` = DB `objectives` / `common_mistakes` / question counts; `kx/uni` = KaTeX delimiters / plain Unicode math hacks.

| Course / Migration | Slug | Clarity & Pedagogical Verdict | `sumAr / sumEn` | `obj / cm / q` | `kx / uni` | Live UUID Fallback & Specific Content Defects |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| Demo Sci (`0009`) | `motion-basics`, `motion-graphs` | **F** — 2-line stub (`94–102` chars) | `94–102 / 88–94` (F) | `0 / 0 / 3+3` | `0 / 38` | Collapses to `sci-hydrosphere` (Water Cycle) |
| Respiratory (`20261017`) | 7 lessons (`respiratory-intro` .. `integrated-review`) | **D** — Clear short calc ex, missing misconceptions (`0 cm`) | `298–429 / 243–435` (F) | `3 / 0 / 3+3` | `0 / 108` | **All 7 leak `sci-hydrosphere` Water Cycle** (`TOPIC_MODULES[0]`); `PO₂`/`CO₂` Unicode |
| Philosophy (`20261025111000`) | `phil-human-thinking` | **C-** — `1,245/1,547` ch monolithic cram | `1245 / 1547` (F) | `4 / 5 / 4` | `0 / 0` | Falls onto combined `TOPIC_MODULES[8]` (mixes Logic Syllogisms into Thinking) |
| Philosophy | `phil-philosophical-stance` | **C-** — `1,466/1,833` ch blob | `1466 / 1833` (F) | `4 / 3 / 4` | `0 / 0` | Fallback teaches Square of Opposition (`TOPIC_MODULES[8]`) |
| Philosophy | `phil-logic-terms-propositions` | **C-** — `1,478/1,831` ch abstract prose, no tables | `1478 / 1831` (F) | `4 / 3 / 4` | `0 / 0` | Fallback `TOPIC_MODULES[8]` |
| Philosophy | `phil-inference` | **C-** — Summary embeds worked problem verbatim | `1063 / 1239` (F) | `4 / 4 / 4` | `0 / 0` | Copper/metals syllogism repeats verbatim between DB `worked` & `TOPIC_MODULES[8]` |
| Philosophy | `phil-extra-review` | **D-** — Generic 85-ch essay note (`official_lesson: false`) | `354 / 488` (F) | `2 / 0 / 3` | `0 / 6` | Missing `common_mistakes`; hits `TOPIC_MODULES[8]` |
| Science (`20261025112000`) | `sci-hydrosphere` | **C** — Accurate (`70.7%`, `97/3%`), 1,520-ch blob | `1520 / 1674` (F) | `4 / 3 / 4` | `0 / 0` | Note `integrated-science-en` clones Sci 1–5 to `*-en` slugs |
| Science | `sci-water-chemistry` | **C** — Plain `H2O`, Unicode `104.5°` | `1339 / 1352` (F) | `4 / 3 / 4` | `0 / 6` | Fallback `TOPIC_MODULES[1]` (`ex=0`, Unicode) |
| Science | `sci-water-physics` | **C** — `Q=mcΔT` / `4°C` density accurate, 1,412-ch blob | `1412 / 1458` (F) | `4 / 3 / 4` | `0 / 51` | Fallback `TOPIC_MODULES[2]` pipes Unicode formulas |
| Science | `sci-aqueous-solutions` | **C-** — Massive `1,689/1,840`-ch single paragraph | `1689 / 1840` (F) | `4 / 4 / 4` | `0 / 0` | Shares `TOPIC_MODULES[3]` |
| Science | `sci-biological-water` | **C-** — `1,438/1,616`-ch multi-topic wall | `1438 / 1616` (F) | `3 / 3 / 4` | `0 / 0` | **Shares `TOPIC_MODULES[3]`** (shows osmosis worked ex instead of biological water) |
| Math (`20261025113000`) | `math-complex-intro` | **D** — Embeds `(1+i)/(1-i)` & 4 CMs verbatim inside summary; Arabic uses Latin `x,i,Re,Im`; typo `والأقتران` (`L51`) | `1254 / 1397` (F) | `4 / 4 / 4` | `0 / 108` | **Diagnostic serves L2 discriminant; `kc=1, ex=0` fallback; 4 pipe-jammed formulas; `(1+i)/(1-i)` repeated back-to-back** |
| Math | `math-nature-of-roots` | **C-** — `956`-ch wall, plain Unicode `Δ = b² − 4ac` | `956 / 941` (F) | `4 / 3 / 4` | `0 / 104` | `TOPIC_MODULES[5]` (`kc=1, ex=0`, no KaTeX) |
| Math | `math-roots-coefficients` | **D+** — Summary duplicates worked+CM; Arabic typos `غير صفرية آخر`, `عدم يساويه صفرًا` (`L91`) | `983 / 987` (F) | `4 / 4 / 4` | `0 / 125` | `TOPIC_MODULES[6]` (`kc=1, ex=0`) repeats `S=-2, P=-8, α²+β²` verbatim |
| Math | `math-sign-of-quadratic` | **D+** — **Question typo `L436`: `'ف(m) = −x² + 4'`** (`m` instead of `x`) | `1135 / 1150` (F) | `3 / 3 / 4` | `0 / 50` | **Shares `TOPIC_MODULES[7]`** (shows L5 inequality `≤ 0` worked ex in L4!) |
| Math | `math-quadratic-inequalities` | **C-** — `934/1,085`-ch wall; Unicode intervals | `934 / 1085` (F) | `4 / 4 / 4` | `0 / 72` | **Shares `TOPIC_MODULES[7]`** (`x²−5x+6 ≤ 0` near-duplicate of DB `> 0`) |
| Arabic (`20261025114000`) | `arab-reading-hatim`, `samawal`, `wasiya`, `social-values`, `kab` | **D+** — Literary readings/poems with **0 quoted poems/passages** (`docs/curriculum/...:630`); `0 cm`; typo `بواضح الفكرة` (`L98`) | `722–1088 / 858–1304` (F) | `3–4 / 0 / 3` | `0 / 0` | **All 5 hit `TOPIC_MODULES[10]` (grammar syntax!)** instead of reading/poetry |
| Arabic | `arab-grammar-word-types`, `noun-types`, `verb-types`, `inflected`, `nominatives` | **C / C-** — Grammar summaries up to `1,121` ch; `inflected` repeats worked in summary; `0 cm` | `618–1121 / 702–1394` (F) | `3 / 0 / 3` | `0 / 0` | **All 5 hit `TOPIC_MODULES[10]`**; `verb-types` repeats `"لن يقصرَ المجتهدُ"` |
| Arabic | `arab-story-antara` | **C-** — **`1,588/1,951`-ch** longest wall; 0 novel excerpts; `0 cm` | `1588 / 1951` (F) | `3 / 0 / 3` | `0 / 0` | **Hits `TOPIC_MODULES[10]` (grammar fallback)** during novel lesson |
| English (`20261025115000`) | `eng-heritage` .. `eng-technology-schools` (5 lessons) | **C-** — `1,197–1,644`-ch walls; `save-shine` repeats worked in summary; `0 cm` | `1197–1596 / 1217–1644` (F) | `4 / 0 / 4` | `0 / 2` | **All 5 hit `TOPIC_MODULES[11]`**, mixing Units 2–5 grammar inside Unit 1 |
| History (`20261025116000`) | `hist-civilization-history` .. `hist-economy` (5 lessons) | **C-** — `1,088–1,694`-ch walls; `0 cm`; **Contradiction:** `Q L206` defines Contemporary = **1789 CE** vs `HistoryLab` **1914 CE** | `1088–1561 / 1216–1793` (F) | `3–4 / 0 / 3–4` | `0 / 0` | **All 5 hit `TOPIC_MODULES[9]`** (repeatedly shows L3 "gift of the Nile" worked ex) |

*(Plus `10` `-en` cloned DB lessons in `20261026120000:405-427` duplicating Science 1–5 & Math 1–5 with `render_language: 'en'`.)*

---

## 3. Canonical Lesson Study Packs (`sec1-all-lessons-pack.ts` — 46 Packs) Audit

- **Usage Totals:** `46` packs exist (`10` Science, `10` Math, `11` Arabic, `5` English, `5` History, `5` Philosophy).
- **Formatting Audit:** Only `29` KaTeX `$...$` tokens exist in the entire 3,633-line file (restricted to `pack-sci-en-3`, `pack-math-en-1`, `pack-math-en-2`, `pack-math-en-3`), contrasted with **`990` Unicode math/chemistry hacks** (`i⁴`, `H₂O`, `104.5°`, `ΔT`, `b²`) and **`40` pipe-delimited `formulaOrRule` strings**.
- **Structural Depth Audit:** **`33 / 46` packs have only 1 concept card (`keyConcepts.length === 1`)** (`pack-math-ar-2..5`, `pack-math-en-2..5`, all `11` Arabic, all `5` English, all `5` History, `pack-phil-2..5`), while Arabic/English/History/Philosophy have only `2` quiz questions per pack and zero `StructuredStudyBlock[]` usage.
- **Notation & Academic Discrepancies:**
  1. **Math Notation Split (`ت/س/ع` vs `i/x/z`)**: `pack-math-ar-1..5` (`L981-1371`) & `knowledge-map.ts:304` use Arabic symbols **`ت، س، أ + ب ت، د(س)`**, conflicting with Arabic DB Math (`20261025113000:47`), `TOPIC_MODULES[4..7]`, and `MathPilotLab` (`L273, 289`) which use Latin `i, x, a + bi, Re(z), Im(z)` (often inside Arabic RTL prose without isolation).
  2. **Omitted Literary Primary Texts**: `arab-reading-hatim`, `arab-literature-samawal`, `arab-literature-wasiya`, `arab-reading-social-values`, `arab-literature-kab`, and `arab-story-antara` still contain zero primary literary excerpts/poems in Stage 1 (`0` `poetry_couplet` / `primary_source` blocks).
  3. **History Era Boundary Contradiction**: `20261025116000:206-215` & curriculum source text `L1152-1153` state Contemporary History begins **1789 CE (French Revolution)**, whereas `HistoryLab` (`history-lab.tsx:127, 137`) teaches **1914 CE (WWI)**. Must be harmonized clearly (teaching 1789 CE as standard Egyptian Sec. 1 classification while noting scholarly historiographic variations).

---

## 4. Subject Interactive Labs (`6` Labs) Audit

| Lab Component | Strengths to Preserve | Verified Phase 0 Bugs & Pedagogical Gaps |
| :--- | :--- | :--- |
| `MathPilotLab` | Argand plane + quadratic SVG graphs, live KaTeX readouts, degenerate `a=0` linear guard | Preset exponent buttons (`L192`) render raw `"i^{n}"`; SVG Argand labels (`L273, 289`) hardcoded English `Re(z)/Im(z)` in AR mode; notation conflict with `pack-math-ar` |
| `SciencePilotLab` | Accurate `4°C` density peak, `104.5°` bent geometry, `25°C` pH caveat, `~10%` ecological caveat, `chemistry` block usage | SVG diagrams hardcode English (`H-bond`, `Solid line`, `External bath`, `Cell: 9 ppt`, `Net H₂O OUT`) in Arabic mode; `23` Unicode `H₂O`/`O₂` hacks |
| `ArabicLab` | Only component rendering `poetry_couplet` block; authentic i'rab token parsing | **Spoils answer before interaction (`L200`)** by rendering `{tok.roleAr}` badge right on the clickable button; covers only 1 poem |
| `HistoryLab` | Transparent 6-criterion `100`-pt source reliability rubric warning of royal bias | **`TIMELINE_ERAS` (`1914 CE`) contradicts curriculum DB Q (`1789 CE`)**; thin timeline/evidence interactivity across Units 2–5 |
| `PhilosophyLab` | Explicitly separates formal syllogism validity from empirical premise truth | Thin scope (`4` syllogisms, `3` thinking-error scenarios total); zero `primary_source` / `callout` blocks |
| `EnglishLab` | Interactive tense/voice transformation diff | **Locale bug (`L31, 123, 158, 162`):** uses `uiLocale` instead of `contentLocale` for Arabic contrast notes; only `4` drills total; zero reading/collocation depth |
| `SubjectLabFrame` | Prediction-before-reveal pedagogical structure + `fallbackBlocks` toggle + `ErrorBoundary` | Renders block `StudyRichText` inside `<h4>` (`L188`) and `<button role="radio">` (`L215`); `radiogroup` lacks arrow-key navigation; `scientificCaveat` (`L148`) bypasses `StudyRichText` |
