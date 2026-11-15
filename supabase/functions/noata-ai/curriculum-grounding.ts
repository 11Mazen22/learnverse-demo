import type { AutoDifficulty, PedagogicalMode, SubjectHint } from "./routing.ts";
import { detectSubjectHint } from "./routing.ts";

export type DbLessonSnippet = {
  id: string;
  title_ar: string | null;
  title_en: string | null;
  content: string | null;
};

export type StudyDeckSnippet = {
  title: string;
  cardCount?: number;
};

type SubjectKnowledgeEntry = {
  subject: Exclude<SubjectHint, "islamic" | "general">;
  trackSlugs: readonly string[];
  labelAr: string;
  labelEn: string;
  keywords: RegExp;
  coreOutline: string;
  keyFormulasAndRules: string;
};

/** Canonical First Secondary (Sec. 1) Term 1 (2026-2027) knowledge reference. */
const SEC1_CURRICULUM_KNOWLEDGE: readonly SubjectKnowledgeEntry[] = [
  {
    subject: "integrated-science",
    trackSlugs: ["integrated-science-ar", "integrated-science-en"],
    labelAr: "العلوم المتكاملة",
    labelEn: "Integrated Science",
    keywords:
      /hydrosphere|water|polarity|hydrogen bond|ph|density|specific heat|osmosis|enzyme|cell|aqua|غلاف مائي|الماء|قطبية|هيدروجينية|الأس الهيدروجيني|كثافة|حرارة نوعية|أسموزية|إنزيم|انزيم|العلوم المتكاملة/i,
    coreOutline:
      "Hydrosphere (~71% surface; ~97% saline, ~3% freshwater mostly ice/groundwater) & water cycle (evaporation, plant transpiration via stomata, condensation, precipitation, runoff, infiltration); Chemical polarity of H2O (bent 104.5 deg, O delta-, H delta+, hydrogen bonds) & pH scale (acid <7, neutral 7, base >7); Physical anomalies (max density at 4 deg C so ice floats & insulates aquatic life; high specific heat c_water ≈ 4200 J/(kg*C) with Q = m*c*dT, T(K) = T(C)+273.15); Aqueous solutions (boiling elevation, freezing depression, osmosis from low to high solute concentration across semipermeable membranes); Enzymes & biological temperature sensitivity.",
    keyFormulasAndRules:
      "rho = m/V (max freshwater density = 1 g/cm^3 at 4 C); Q = m*c*dT; T(K) = T(C) + 273.15; Distinguish open-surface evaporation vs stomatal transpiration.",
  },
  {
    subject: "mathematics",
    trackSlugs: ["mathematics-ar", "mathematics-en"],
    labelAr: "الرياضيات",
    labelEn: "Mathematics",
    keywords:
      /complex|imaginary|discriminant|quadratic|vieta|inequality|root|algebra|matrix|معادلة|مميز|جذر|تخيلي|مركب|تربيعية|متباينة|فيتا|الرياضيات/i,
    coreOutline:
      "Complex numbers: i = sqrt(-1), i^2 = -1, i^3 = -i, i^4 = 1 (use remainder of power mod 4), z = a + bi, conjugate z_bar = a - bi, (a+bi)(a-bi) = a^2 + b^2; Discriminant Delta = b^2 - 4ac of ax^2+bx+c=0 (Delta > 0 -> 2 distinct real roots, Delta = 0 -> 1 repeated real root, Delta < 0 -> 2 complex conjugate non-real roots); Vieta relations: sum of roots l+m = -b/a, product lm = c/a, forming equation x^2 - (sum)x + (product) = 0; Sign of quadratic f(x)=ax^2+bx+c and quadratic inequalities (compare sign vs 'a' inside/outside roots).",
    keyFormulasAndRules:
      "Delta = b^2 - 4ac; l+m = -b/a; l*m = c/a; x = (-b +/- sqrt(Delta))/(2a); Opposite sign of 'a' lies strictly between real roots when Delta > 0.",
  },
  {
    subject: "philosophy-logic",
    trackSlugs: ["philosophy-logic"],
    labelAr: "الفلسفة والمنطق",
    labelEn: "Philosophy & Logic",
    keywords:
      /philosophy|logic|thinking|critical|creative|proposition|syllogism|stance|square of opposition|فلسفة|منطق|تفكير|ناقد|إبداعي|خرافي|ديني|فلسفي|علمي|قضية|قياس|حد منطقي|موقف/i,
    coreOutline:
      "Human thinking & styles (mythical, religious, philosophical comprehensive-questioning, scientific cause-seeking, creative divergent); Thinking errors (subjective: emotion, bias, haste, gullibility; objective: ambiguity of language, lack of info, domination, task difficulty); Critical thinking (assumptions, deduction, interpretation, argument evaluation) vs Creative thinking (preparation, incubation, illumination, verification; fluency, flexibility, originality); Philosophical stance characteristics; Logic: logical terms, categorical propositions (A universal +, E universal -, I particular +, O particular -), immediate inference (Square of Opposition), categorical syllogism rules.",
    keyFormulasAndRules:
      "A-E contrary; I-O subcontrary; A-O and E-I contradictory; At least one premise must be universal and one affirmative in a valid categorical syllogism.",
  },
  {
    subject: "history",
    trackSlugs: ["history"],
    labelAr: "التاريخ",
    labelEn: "History",
    keywords:
      /history|civilization|source|ostraca|papyri|durant|herodotus|egypt|pharaoh|narmer|تاريخ|حضارة|مصادر أولية|مصادر ثانوية|أوستراكا|بردي|ديورانت|هيرودوت|مصر القديمة|عصور/i,
    coreOutline:
      "Meaning of Civilization (Will Durant: social system enabling cultural creativity once fear/insecurity vanish; material + moral aspects) vs History; Historical Eras (Ancient up to 476 CE Rome fall, Medieval 476-1453 CE Constantinople conquest, Modern 1453-1914 WWI, Contemporary 1914-present); Primary sources contemporary to the event (monuments, inscriptions like Narmer Palette/Palermo Stone, papyri like Ebers, ostraca daily potsherds, coins) vs Secondary sources (historians, philosophers, poets); Natural & human factors of Ancient Egyptian civilization (Nile River solidarity/navigation/trade, central location, desert barriers, human diligence); Political unification (3200 BCE Narmer) & Old/Middle/New Kingdoms.",
    keyFormulasAndRules:
      "Primary sources carry highest historical reliability because they originated during the event itself; Ostraca served middle/poor classes as inexpensive writing material.",
  },
  {
    subject: "arabic-language",
    trackSlugs: ["arabic-language"],
    labelAr: "اللغة العربية",
    labelEn: "Arabic Language",
    keywords:
      /arabic|nahw|balagha|adab|hatim|antara|عربي|نحو|بلاغة|أدب|قراءة|نصوص|حاتم|عنترة|مبتدأ|خبر|فاعل|مفعول|معرب|مبني|تشبيه|استعارة/i,
    coreOutline:
      "Nahw: Parts of speech (Ism, Fi'l past/present/imperative, Harf); Mu'rab (variable ending) vs Mabni (fixed ending pronouns, demonstratives except dual, relatives except dual, past & imperative verbs); Nominatives (Mubtada, Khabar, Fa'il, Na'ib Fa'il, Ism Kana, Khabar Inna) and nominative markers (Damma, Alif for dual, Waw for sound masculine plural & five nouns); Balagha (Tashbih 4 pillars vs Isti'ara makniyya/tasrihiyya, Kinaya); Adab & Texts (Pre-Islamic prose/poetry values: Hatim al-Ta'i generosity, Antara ibn Shaddad chivalry & freedom).",
    keyFormulasAndRules:
      "Past verb & imperative verb are always Mabni; Present verb is Mu'rab unless attached to Nun al-Niswa or direct Nun al-Tawkid.",
  },
  {
    subject: "english",
    trackSlugs: ["english"],
    labelAr: "اللغة الإنجليزية",
    labelEn: "English Language",
    keywords:
      /english|grammar|tense|past simple|past continuous|modal|conditional|gerund|infinitive|quantifier|إنجليزي|انجليزي|قواعد الإنجليزية|ماضي بسيط|ماضي مستمر|شرطية/i,
    coreOutline:
      "Units 1-5 Grammar & Usage: Past Simple (completed past action) vs Past Continuous (interrupted ongoing action: while/as vs when); Modals of obligation, prohibition & advice (must, have to, mustn't vs don't have to, should); Conditionals (Zero: general truths If+present, present; First: likely future If+present, will+inf; Second: hypothetical present If+past, would+inf); Verb patterns (enjoy/avoid/suggest + V-ing vs decide/hope/plan + to+inf; stop/remember meaning shift); Quantifiers (many/few for countable, much/little for uncountable, some/any/a lot of).",
    keyFormulasAndRules:
      "'Used to + inf' expresses past habits no longer true; 'mustn't' = prohibition whereas 'don't have to' = lack of necessity.",
  },
];

function cleanExcerpt(raw: string | null | undefined, maxChars = 220): string {
  if (!raw) return "";
  const compact = raw
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_>`~|<]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (compact.length <= maxChars) return compact;
  return `${compact.slice(0, maxChars).trimEnd()}...`;
}

function tokenizeTerms(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[\s,.;:!?()\[\]{}/\\"'`+\-_=*<>|\u060c\u061f]+/)
        .filter((t) => t.length >= 3),
    ),
  ).slice(0, 14);
}

function scoreOverlap(haystack: string, tokens: string[]): number {
  if (!tokens.length || !haystack) return 0;
  const lower = haystack.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (lower.includes(token)) score += 1;
  }
  return score;
}

function buildPedagogyDirective(difficulty: AutoDifficulty, mode: PedagogicalMode): string {
  const difficultyGuide: Record<AutoDifficulty, string> = {
    foundational:
      "Difficulty=foundational: start with a clear, friendly Egyptian hook (or plain English hook in EN) and intuitive real-world intuition before formal definitions or formulas.",
    standard:
      "Difficulty=standard: connect the core rule directly to a worked Sec. 1 example, call out one common exam trap (:::insight), and reinforce with an interactive Smart UI block (concept_card / comparison / steps) when helpful.",
    advanced:
      "Difficulty=advanced: show rigorous multi-step derivation/justification, justify every algebraic sign or logical premise, verify edge cases, and structure clearly with headings + Smart UI steps or concept_card.",
  };

  const modeGuide: Record<PedagogicalMode, string> = {
    vision: "Mode=vision: inspect every detail visible in the attached image before answering.",
    islamic: "Mode=islamic: remain strictly faithful to authentic Islamic sources without speculation.",
    interactive: "Mode=interactive: favor crisp interactive Smart UI blocks (concept_card, flashcards, quiz, comparison, steps) and active recall.",
    deep_proof: "Mode=deep_proof: present rigorous numbered proof/analysis steps plus a final verification check.",
    step_by_step: "Mode=step_by_step: solve step-by-step, show intermediate substitutions, and use a steps or quadratic/concept_card Smart UI block cleanly.",
    concept_explain: "Mode=concept_explain: explain cleanly in Egyptian Arabic (or English if asked) -> concrete Sec. 1 worked example -> common exam pitfall -> compact Smart UI concept_card or quick check.",
    quick_reply: "Mode=quick_reply: reply concisely in natural Egyptian Arabic (or English if asked) and invite the student to pick a Sec. 1 lesson or topic.",
  };

  return `${difficultyGuide[difficulty]} ${modeGuide[mode]}`;
}

export type GroundingBuildInput = {
  queryText: string;
  subjectHint?: SubjectHint;
  activeTrackSlugs?: string[];
  dbLessons?: DbLessonSnippet[];
  studyDecks?: StudyDeckSnippet[];
  studyCards?: string[];
  difficulty?: AutoDifficulty;
  pedagogicalMode?: PedagogicalMode;
};

/** Build a compact, high-signal Sec. 1 Term 1 curriculum + DB/study context block for system instructions. */
export function buildSec1CurriculumGrounding(input: GroundingBuildInput): string {
  const q = input.queryText.trim();
  const detected = input.subjectHint && input.subjectHint !== "general"
    ? input.subjectHint
    : detectSubjectHint(q);

  const activeTracks = new Set((input.activeTrackSlugs ?? []).map((s) => s.toLowerCase()));
  const tokens = tokenizeTerms(q);

  const matchedSubjects = SEC1_CURRICULUM_KNOWLEDGE.filter(
    (entry) =>
      entry.subject === detected ||
      entry.trackSlugs.some((slug) => activeTracks.has(slug)) ||
      (q.length > 0 && entry.keywords.test(q)),
  );

  const lines: string[] = [
    "Sec. 1 Term 1 (2026-2027) Official Curriculum Grounding:",
    "- Full syllabus scope: Integrated Science (Hydrosphere, H2O Chemistry/pH, Density/Q=mcΔT, Osmosis/Enzymes), Mathematics (Complex Numbers, Discriminant & Roots, Vieta, Quadratic Sign & Inequalities), Philosophy & Logic (Thinking Styles, Critical/Creative, Philosophical Stance, Propositions A/E/I/O & Syllogism), History (Civilization/History Eras, Primary/Secondary Sources & Ostraca, Ancient Egypt), Arabic Language (Nahw Word Classes/Mu'rab/Mabni/Nominatives, Balagha, Hatim & Antara), English (Units 1-5 Tenses, Modals, Conditionals, Gerunds/Infinitives, Quantifiers).",
  ];

  const subjectsToDetail = matchedSubjects.length > 0 ? matchedSubjects.slice(0, 2) : [];
  for (const subj of subjectsToDetail) {
    lines.push(`- [${subj.labelEn} / ${subj.labelAr}] Core: ${subj.coreOutline}`);
    lines.push(`- [${subj.labelEn}] Rules/Formulas: ${subj.keyFormulasAndRules}`);
  }

  if (input.dbLessons && input.dbLessons.length > 0) {
    const rankedLessons = [...input.dbLessons]
      .map((lesson) => ({
        lesson,
        score: scoreOverlap(
          `${lesson.title_ar ?? ""} ${lesson.title_en ?? ""} ${lesson.content ?? ""}`,
          tokens,
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const useful = rankedLessons.filter((item, idx) => item.score > 0 || idx === 0);
    if (useful.length > 0) {
      lines.push(
        `Matched Database Lessons: ${useful
          .map(({ lesson }) => {
            const title = [lesson.title_ar, lesson.title_en].filter(Boolean).join(" / ");
            const excerpt = cleanExcerpt(lesson.content, 190);
            return excerpt ? `${title}: ${excerpt}` : title;
          })
          .join(" | ")}`,
      );
    }
  }

  if (input.studyDecks && input.studyDecks.length > 0) {
    lines.push(
      `Student Study Decks (/study): ${input.studyDecks
        .slice(0, 6)
        .map((d) => (typeof d.cardCount === "number" ? `${d.title} (${d.cardCount} cards)` : d.title))
        .join(", ")}`,
    );
  }

  if (input.studyCards && input.studyCards.length > 0) {
    const matchedCards = input.studyCards
      .map((card) => ({ card, score: scoreOverlap(card, tokens) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .filter((item, idx) => item.score > 0 || idx < 2)
      .map((item) => cleanExcerpt(item.card, 110));
    if (matchedCards.length > 0) {
      lines.push(`Study Card Excerpts: ${matchedCards.join(" ; ")}`);
    }
  }

  if (input.difficulty && input.pedagogicalMode) {
    lines.push(`Pedagogical Plan: ${buildPedagogyDirective(input.difficulty, input.pedagogicalMode)}`);
  }

  return lines.join("\n");
}
