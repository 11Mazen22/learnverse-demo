import {
  resolveAutoRoute,
  type AutoDifficulty,
  type PedagogicalMode,
  type SubjectHint,
} from "../../../../supabase/functions/noata-ai/routing.ts";
import { FANAR_CAPABILITIES } from "./catalog.ts";

/**
 * Runtime capability contract for the active noata-ai-v2 Edge Function.
 * These are configured routes, NOT claims that Fanar is currently online.
 * Tool calling is not enabled by the deployed chat request body.
 */
export const CHAT_MODEL_CARDS = [
  {id:"Fanar", arabic:"فنار",subtitle:"المحادثات والأسئلة اليومية",description:"حوار عام وشرح وصياغة بالعربية.",features:["نص","بث الرد"],bestFor:"general"},
  {id:"Fanar-S-1-7B", arabic:"فنار S",subtitle:"رد سريع",description:"أسئلة قصيرة وإجابات سريعة.",features:["نص","بث الرد"],bestFor:"fast"},
  {id:"Fanar-C-1-8.7B", arabic:"فنار C",subtitle:"تحليل وشرح",description:"مسائل وخطوات استنتاجية. التفكير الموسع يعتمد على إعداد الطلب.",features:["نص","شرح خطوات"],bestFor:"reasoning"},
  {id:"Fanar-C-2-27B", arabic:"فنار C 27B",subtitle:"مسائل أكثر تعقيدًا",description:"مسائل مطولة ومعالجة مسائل صعبة.",features:["نص","تحليل","بث الرد"],bestFor:"deep"},
  {id:"Fanar-Sadiq", arabic:"صادق",subtitle:"أسئلة إسلامية",description:"إجابات من المساعد المتخصص؛ لا تُعد نصًا قرآنيًا معتمدًا.",features:["نص","إسلامي"],bestFor:"islamic"},
  {id:"Fanar-Guard-2",arabic:"حارس 2",subtitle:"مراجعة السلامة",description:"فحص سلامة النص والوعي الثقافي. لا يتحقق من صحة المعلومات.",features:["فحص السلامة","درجات فعلية"],bestFor:"safety"},
  {id:"Fanar-Diwan",arabic:"ديوان",subtitle:"شعر إبداعي",description:"يصوغ الشعر من فكرتك؛ يخضع لإتاحة مزود الخدمة.",features:["مسودة شعرية","صياغة إبداعية"],bestFor:"creative"},
  {id:"Fanar-Oryx-IVU-2", arabic:"أوريكس رؤية",subtitle:"فهم الصور",description:"يقبل صورة مرفقة مع سؤال نصي.",features:["رؤية","صورة"],bestFor:"vision"},
] as const;
export function getChatModelCards(locale:"ar"|"en"="ar"){
  if(locale==="ar")return CHAT_MODEL_CARDS;
  const copy:Record<string,{subtitle:string;description:string;features:string[]}>= {
    Fanar:{subtitle:"Everyday conversations",description:"General conversation, explanation, and writing.",features:["Text","Streaming"]},
    "Fanar-S-1-7B":{subtitle:"Quick Arabic replies",description:"Brief Arabic questions and greetings. English requests use the general route in Auto.",features:["Text","Streaming"]},
    "Fanar-C-1-8.7B":{subtitle:"Reasoning and explanation",description:"Problems and step-by-step explanations.",features:["Text","Reasoning"]},
    "Fanar-C-2-27B":{subtitle:"Complex tasks",description:"Detailed explanations and more demanding problems.",features:["Text","Reasoning","Streaming"]},
    "Fanar-Sadiq":{subtitle:"Islamic questions",description:"Specialized answers. Responses are not an authoritative Quran text.",features:["Text","Islamic studies"]},
    "Fanar-Guard-2":{subtitle:"Safety review",description:"Screens text for safety and cultural awareness. This is not a factual accuracy check.",features:["Safety screening","Actual scores"]},
    "Fanar-Diwan":{subtitle:"Creative poetry",description:"Drafts poetry from your brief, subject to provider access.",features:["Poetry drafts","Creative writing"]},
    "Fanar-Oryx-IVU-2":{subtitle:"Image understanding",description:"Ask a question about an attached image.",features:["Vision","Image"]},
  };
  return CHAT_MODEL_CARDS.map(card=>({...card,arabic:card.id,...copy[card.id]}));
}
export function isConfiguredChatModel(id: unknown): id is typeof CHAT_MODEL_CARDS[number]["id"] {
  return typeof id==="string" && CHAT_MODEL_CARDS.some(x=>x.id===id);
}
export function resolveSuggestedModel(text:string,hasImage=false):string { return resolveAutoRoute(text,hasImage).model; }
/** Keep the client picker synced with declared backend model IDs. */
export function validateRegistry(){
  const pickerIds=FANAR_CAPABILITIES.filter(x=>x.visibleInPicker).map(x=>x.id).sort();
  const supported=CHAT_MODEL_CARDS.map(x=>x.id).sort();
  return JSON.stringify(pickerIds)===JSON.stringify(supported);
}

/** Old saved choices cannot keep selecting the retired Sadiq 2 picker entry. */
export function normalizeModelChoice(value:unknown):string{
 return isConfiguredChatModel(value)?value:"auto";
}


export type SmartAutoSummary = {
  model: string;
  reason: string;
  difficulty: AutoDifficulty;
  difficultyLabel: string;
  subjectHint: SubjectHint;
  subjectLabel: string;
  pedagogicalMode: PedagogicalMode;
  modeLabel: string;
  tierLabel: string;
};

const DIFFICULTY_LABELS: Record<AutoDifficulty, { ar: string; en: string }> = {
  foundational: { ar: "أساسي", en: "Foundational" },
  standard: { ar: "قياسي", en: "Standard" },
  advanced: { ar: "متقدم", en: "Advanced Reasoning" },
};

const SUBJECT_LABELS: Record<SubjectHint, { ar: string; en: string }> = {
  "integrated-science": { ar: "العلوم المتكاملة", en: "Integrated Science" },
  mathematics: { ar: "الرياضيات", en: "Mathematics" },
  "arabic-language": { ar: "اللغة العربية", en: "Arabic Language" },
  english: { ar: "اللغة الإنجليزية", en: "English" },
  history: { ar: "التاريخ", en: "History" },
  "philosophy-logic": { ar: "الفلسفة والمنطق", en: "Philosophy & Logic" },
  islamic: { ar: "الدراسات الإسلامية", en: "Islamic Knowledge" },
  general: { ar: "منهج أولى ثانوي", en: "Sec. 1 Curriculum" },
};

const MODE_LABELS: Record<PedagogicalMode, { ar: string; en: string }> = {
  vision: { ar: "تحليل الصور", en: "Visual Analysis" },
  islamic: { ar: "مرجع إسلامي موثّق", en: "Authentic Islamic" },
  interactive: { ar: "تعلم تفاعلي وبطاقات", en: "Interactive Practice" },
  deep_proof: { ar: "برهان واستنتاج عميق", en: "Deep Proof & Analysis" },
  step_by_step: { ar: "حل خطوة بخطوة", en: "Step-by-Step Solver" },
  concept_explain: { ar: "شرح مبسّط مع أمثلة", en: "Concept & Example" },
  quick_reply: { ar: "رد سريع", en: "Quick Reply" },
};

const TIER_LABELS: Record<string, { ar: string; en: string }> = {
  "Fanar-C-2-27B": { ar: "محرك التفكير العميق 27B", en: "Deep Reasoner 27B" },
  "Fanar-C-1-8.7B": { ar: "محرك الشرح المنطقي 8.7B", en: "Structured Reasoning 8.7B" },
  "Fanar-Oryx-IVU-2": { ar: "محرك الرؤية والصور", en: "Vision Engine" },
  "Fanar-Sadiq": { ar: "محرك صادق الموثوق", en: "Sadiq Specialist" },
  "Fanar-S-1-7B": { ar: "محرك الاستجابة الفورية", en: "Instant Engine" },
  Fanar: { ar: "محرك فنار المتوازن", en: "Balanced Interactive Engine" },
};

/** Describe the Smart Auto route in student-friendly bilingual metadata for the /ai HUD. */
export function describeSmartAutoRoute(
  text: string,
  hasImage = false,
  locale: "ar" | "en" = "ar",
): SmartAutoSummary {
  const route = resolveAutoRoute(text, hasImage);
  const lang = locale === "en" ? "en" : "ar";
  const tier = TIER_LABELS[route.model] ?? TIER_LABELS.Fanar;
  return {
    model: route.model,
    reason: route.reason,
    difficulty: route.difficulty,
    difficultyLabel: DIFFICULTY_LABELS[route.difficulty][lang],
    subjectHint: route.subjectHint,
    subjectLabel: SUBJECT_LABELS[route.subjectHint][lang],
    pedagogicalMode: route.pedagogicalMode,
    modeLabel: MODE_LABELS[route.pedagogicalMode][lang],
    tierLabel: tier[lang],
  };
}

export type Sec1SubjectScopeId =
  | "all"
  | "integrated-science"
  | "mathematics"
  | "philosophy-logic"
  | "history"
  | "arabic-language"
  | "english";

export type Sec1SubjectScope = {
  id: Sec1SubjectScopeId;
  labelAr: string;
  labelEn: string;
  starterAr: string;
  starterEn: string;
};

export const SEC1_SUBJECT_SCOPES: readonly Sec1SubjectScope[] = [
  {
    id: "all",
    labelAr: "كل مواد ١ث",
    labelEn: "All Sec. 1",
    starterAr: "",
    starterEn: "",
  },
  {
    id: "integrated-science",
    labelAr: "العلوم المتكاملة",
    labelEn: "Integrated Science",
    starterAr: "في العلوم المتكاملة (أولى ثانوي): ",
    starterEn: "In Integrated Science (Sec. 1): ",
  },
  {
    id: "mathematics",
    labelAr: "الرياضيات",
    labelEn: "Mathematics",
    starterAr: "في الرياضيات (المعادلات التربيعية والأعداد المركبة): ",
    starterEn: "In Sec. 1 Mathematics (quadratics & complex numbers): ",
  },
  {
    id: "philosophy-logic",
    labelAr: "الفلسفة والمنطق",
    labelEn: "Philosophy & Logic",
    starterAr: "في الفلسفة والمنطق (أساليب التفكير والقياس المنطقي): ",
    starterEn: "In Philosophy & Logic (thinking styles & syllogism): ",
  },
  {
    id: "history",
    labelAr: "التاريخ",
    labelEn: "History",
    starterAr: "في التاريخ (الحضارة ومصادرها ومصر القديمة): ",
    starterEn: "In History (civilization, primary sources & Ancient Egypt): ",
  },
  {
    id: "arabic-language",
    labelAr: "اللغة العربية",
    labelEn: "Arabic",
    starterAr: "في اللغة العربية (النحو والبلاغة والأدب): ",
    starterEn: "في اللغة العربية (منهج أولى ثانوي — النحو والبلاغة والأدب): ",
  },
  {
    id: "english",
    labelAr: "الإنجليزي",
    labelEn: "English",
    starterAr: "In Sec. 1 English (Units 1-5): ",
    starterEn: "In Sec. 1 English (Units 1-5): ",
  },
];

export type PedagogyPresetId = "simplify" | "step_by_step" | "quiz" | "flashcards";

export type PedagogyPreset = {
  id: PedagogyPresetId;
  labelAr: string;
  labelEn: string;
  prefixAr: string;
  prefixEn: string;
  emptyPromptAr: string;
  emptyPromptEn: string;
};

export const AI_PEDAGOGY_PRESETS: readonly PedagogyPreset[] = [
  {
    id: "simplify",
    labelAr: "اشرحلي ببساطة",
    labelEn: "Explain Simply",
    prefixAr: "اشرحلي ببساطة بالمصري وبمثال من منهج أولى ثانوي مع بطاقة مفهوم ذكية: ",
    prefixEn: "Explain simply with a concrete Sec. 1 example and a concept card: ",
    emptyPromptAr: "اشرحلي ببساطة بالمصري أهم مفهوم في درس أولى ثانوي بمثال تطبيقي وبطاقة مفهوم.",
    emptyPromptEn: "Explain a core Sec. 1 Term 1 concept simply with a real-life example and concept card.",
  },
  {
    id: "step_by_step",
    labelAr: "حل خطوة بخطوة",
    labelEn: "Step-by-Step",
    prefixAr: "حل معايا خطوة بخطوة بالمصري مع توضيح القوانين والتحقق من الناتج في خطوات منظمة: ",
    prefixEn: "Solve step-by-step showing each law and verifying the final result: ",
    emptyPromptAr: "حل معايا خطوة بخطوة بالمصري مسألة تطبيقية من منهج أولى ثانوي مع خطوات التحقق.",
    emptyPromptEn: "Walk me step-by-step through a Sec. 1 practice problem and check the answer.",
  },
  {
    id: "quiz",
    labelAr: "اختبرني (٣ أسئلة)",
    labelEn: "Quiz Me (3 Qs)",
    prefixAr: "اختبرني بـ ٣ أسئلة تفاعلية متدرجة الصعوبة (مع شرح سبب كل إجابة بالمصري) حول: ",
    prefixEn: "Quiz me with 3 interactive tiered Sec. 1 questions on: ",
    emptyPromptAr: "اعملّي كويز تفاعلي من ٣ أسئلة متدرجة الصعوبة من منهج أولى ثانوي الترم الأول.",
    emptyPromptEn: "Quiz me with 3 interactive tiered Sec. 1 Term 1 questions.",
  },
  {
    id: "flashcards",
    labelAr: "بطاقات مراجعة",
    labelEn: "Flashcards",
    prefixAr: "حوّل الموضوع ده لبطاقات مراجعة تفاعلية (سؤال / إجابة واضحة بالمصري + تكة الامتحان): ",
    prefixEn: "Turn this topic into interactive flashcards (Front / Back / Exam trap): ",
    emptyPromptAr: "اعملّي بطاقات مراجعة تفاعلية لأهم تعاريف وقوانين منهج أولى ثانوي.",
    emptyPromptEn: "Create focused interactive flashcards for key Sec. 1 Term 1 laws and definitions.",
  },
];

/** Map query-string ?subject= or ?track= slugs to a canonical Sec. 1 subject scope ID. */
export function normalizeSubjectParam(raw: string | null | undefined): Sec1SubjectScopeId {
  const val = String(raw ?? "").trim().toLowerCase();
  if (!val) return "all";
  if (val.includes("science")) return "integrated-science";
  if (val.includes("math")) return "mathematics";
  if (val.includes("philosophy") || val.includes("logic")) return "philosophy-logic";
  if (val.includes("history")) return "history";
  if (val.includes("arabic")) return "arabic-language";
  if (val.includes("english")) return "english";
  return "all";
}

/** Build or enrich a draft prompt with a subject prefix and/or pedagogical preset cleanly. */
export function applyPedagogyPreset(
  currentDraft: string,
  presetId: PedagogyPresetId,
  subjectScope: Sec1SubjectScopeId,
  locale: "ar" | "en",
): string {
  const preset = AI_PEDAGOGY_PRESETS.find((p) => p.id === presetId);
  if (!preset) return currentDraft;
  const scope = SEC1_SUBJECT_SCOPES.find((s) => s.id === subjectScope);
  const effectiveLocale =
    subjectScope === "english" ? "en" : subjectScope === "arabic-language" ? "ar" : locale;
  const trimmed = currentDraft.trim();
  const prefix = effectiveLocale === "en" ? preset.prefixEn : preset.prefixAr;
  const scopePrefix =
    scope && scope.id !== "all"
      ? effectiveLocale === "en"
        ? scope.starterEn
        : scope.starterAr
      : "";

  if (!trimmed) {
    return `${scopePrefix}${effectiveLocale === "en" ? preset.emptyPromptEn : preset.emptyPromptAr}`;
  }
  const alreadyHasPrefix = AI_PEDAGOGY_PRESETS.some(
    (p) => trimmed.startsWith(p.prefixAr.trim()) || trimmed.startsWith(p.prefixEn.trim()),
  );
  if (alreadyHasPrefix) return currentDraft;
  return `${prefix}${trimmed}`;
}
