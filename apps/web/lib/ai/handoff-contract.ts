import { normalizeSubjectParam, type Sec1SubjectScopeId } from "./model-routing.ts";

export const ALLOWED_AI_HANDOFF_SOURCES = [
  "lesson",
  "mission",
  "mistake",
  "review",
  "study",
  "assignment",
  "boss",
] as const;

export type AiHandoffSource = (typeof ALLOWED_AI_HANDOFF_SOURCES)[number];

export const ALLOWED_AI_HANDOFF_ACTIONS = [
  "explain_simply",
  "exam_quiz",
  "common_pitfalls",
  "concept_clarify",
  "mistake_repair",
  "hint_only",
  "weakness_review",
] as const;

export type AiHandoffAction = (typeof ALLOWED_AI_HANDOFF_ACTIONS)[number];

export interface StructuredAiHandoffInput {
  source: AiHandoffSource;
  action: AiHandoffAction;
  subject?: string | null;
  lessonId?: string | null;
  topic?: string | null;
}

export interface ResolvedAiLessonMetadata {
  title: string;
  trackSlug?: string;
}

export interface ParsedAiHandoff {
  structured: boolean;
  source: AiHandoffSource | null;
  action: AiHandoffAction | null;
  subject: Sec1SubjectScopeId;
  lessonId: string | null;
  topic: string | null;
  assignmentGuardrail: boolean;
  prompt: string;
}

const SOURCE_SET = new Set<string>(ALLOWED_AI_HANDOFF_SOURCES);
const ACTION_SET = new Set<string>(ALLOWED_AI_HANDOFF_ACTIONS);
const LESSON_ID_REGEX = /^[a-z0-9][a-z0-9_-]{1,80}$/i;

function sanitizeHandoffText(raw: string | null | undefined, maxLen = 140): string | null {
  if (!raw) return null;
  const clean = raw
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return null;
  return clean.slice(0, maxLen);
}

export function sanitizeLessonIdParam(raw: string | null | undefined): string | null {
  const clean = (raw ?? "").trim();
  if (!clean || !LESSON_ID_REGEX.test(clean)) return null;
  return clean;
}

/**
 * Serializes a canonical, allowlisted `/ai` handoff link without dumping opaque prompts,
 * graded answers, or raw mastery arrays into query URLs.
 */
export function buildStructuredAiHandoffHref(input: StructuredAiHandoffInput): string {
  const params = new URLSearchParams();
  const safeSource = SOURCE_SET.has(input.source) ? input.source : "study";
  // Assignment contexts force hint-only Socratic mode regardless of requested button action.
  const safeAction =
    safeSource === "assignment"
      ? "hint_only"
      : ACTION_SET.has(input.action)
        ? input.action
        : "concept_clarify";

  params.set("source", safeSource);
  params.set("action", safeAction);

  const normalizedSubject = normalizeSubjectParam(input.subject);
  if (normalizedSubject !== "all") {
    params.set("subject", normalizedSubject);
  }
  const safeLessonId = sanitizeLessonIdParam(input.lessonId);
  if (safeLessonId) {
    params.set("lesson_id", safeLessonId);
  }
  const safeTopic = sanitizeHandoffText(input.topic, 120);
  if (safeTopic) {
    params.set("topic", safeTopic);
  }

  return `/ai?${params.toString()}`;
}

/**
 * Parses and validates URL query parameters on `/ai`, turning allowlisted routing metadata
 * into an editable student-controlled composer prefill (never auto-sent) while enforcing
 * academic integrity guardrails on active assignments.
 */
export function parseStructuredAiHandoff(
  searchParams: URLSearchParams,
  locale: "ar" | "en",
  resolveLesson?: (lessonId: string) => ResolvedAiLessonMetadata | null,
): ParsedAiHandoff {
  const rawSource = searchParams.get("source")?.trim() ?? "";
  const rawAction = searchParams.get("action")?.trim() ?? "";

  const source = SOURCE_SET.has(rawSource) ? (rawSource as AiHandoffSource) : null;
  const parsedAction = ACTION_SET.has(rawAction) ? (rawAction as AiHandoffAction) : null;
  const assignmentGuardrail = source === "assignment";
  const action: AiHandoffAction | null = assignmentGuardrail ? "hint_only" : parsedAction;

  const lessonId = sanitizeLessonIdParam(searchParams.get("lesson_id") ?? searchParams.get("lesson"));
  const lessonMeta = lessonId && resolveLesson ? resolveLesson(lessonId) : null;

  const rawSubject = searchParams.get("subject") ?? searchParams.get("track") ?? lessonMeta?.trackSlug ?? "";
  const subject = normalizeSubjectParam(rawSubject);
  const topic = sanitizeHandoffText(searchParams.get("topic"), 120);

  if (source && action) {
    const contextLabel =
      lessonMeta?.title || topic || (locale === "ar" ? "هذا المفهوم من منهج أولى ثانوي" : "this Sec. 1 concept");
    const prompt = buildActionPrompt({
      action,
      source,
      contextLabel,
      topic: topic && lessonMeta?.title && topic !== lessonMeta.title ? topic : null,
      locale,
    });

    return {
      structured: true,
      source,
      action,
      subject,
      lessonId,
      topic,
      assignmentGuardrail,
      prompt,
    };
  }

  // Fallback for legacy/external direct links (still scrubbed cleanly and guarded if source=assignment).
  const legacyPrompt = sanitizeHandoffText(searchParams.get("prompt"), 1200) ?? "";
  if (assignmentGuardrail) {
    const guardPrompt =
      locale === "ar"
        ? `أنا أحل واجبًا دراسيًا عن «${topic || lessonMeta?.title || "هذا الموضوع"}». ساعدني بتلميح خطوة أولى وفهم القاعدة الأساسية فقط دون إعطائي الحل النهائي.`
        : `I am working on an active assignment about "${topic || lessonMeta?.title || "this topic"}". Give me a foundational conceptual hint and first step ONLY — do not solve or reveal the final answer.`;
    return {
      structured: true,
      source,
      action: "hint_only",
      subject,
      lessonId,
      topic,
      assignmentGuardrail: true,
      prompt: guardPrompt,
    };
  }

  return {
    structured: Boolean(subject !== "all" || lessonId),
    source,
    action: null,
    subject,
    lessonId,
    topic,
    assignmentGuardrail: false,
    prompt: legacyPrompt,
  };
}

function buildActionPrompt(input: {
  action: AiHandoffAction;
  source: AiHandoffSource;
  contextLabel: string;
  topic: string | null;
  locale: "ar" | "en";
}): string {
  const { action, contextLabel, topic, locale } = input;
  const focusSuffix = topic
    ? locale === "ar"
      ? ` (مع التركيز على: ${topic})`
      : ` (focusing on: ${topic})`
    : "";

  if (locale === "ar") {
    switch (action) {
      case "explain_simply":
        return `اشرحلي ببساطة وبأسلوب منظم بالمصري درس/مفهوم «${contextLabel}»${focusSuffix} مع مثال عملي واضح وبطاقة تلخيص للقاعدة.`;
      case "exam_quiz":
        return `اعملّي كويز تفاعلي من ٣ أسئلة تدريجية (بنظام الامتحان) حول «${contextLabel}»${focusSuffix}، وانتظر إجابتي قبل الشرح والتصحيح.`;
      case "common_pitfalls":
        return `ما أشهر الأخطاء والمشتّتات اللي بتلخبط الطلاب في «${contextLabel}»${focusSuffix}، وإزاي أتجنبها في الامتحان؟`;
      case "mistake_repair":
        return `ساعدني أصلّح الفجوة المسببة لخطئي في «${contextLabel}»${focusSuffix}: وضّح القاعدة التي التبست عليّ واختبرني بمثال قصير للتأكد من الفهم.`;
      case "weakness_review":
        return `راجع معايا نقاط الضعف في «${contextLabel}»${focusSuffix} بخطة تثبيت عملية وسؤال تحقق واحد في كل مرة.`;
      case "hint_only":
        return `أنا أحل نشاطًا تقييميًا في «${contextLabel}»${focusSuffix}. ادّيني تلميح للخطوة الأولى وتذكير بالقاعدة الأساسية فقط من غير ما تكتب الإجابة النهائية.`;
      case "concept_clarify":
      default:
        return `ساعدني أفهم القاعدة الأساسية وراء «${contextLabel}»${focusSuffix} خطوة بخطوة قبل محاولة سؤال مشابه.`;
    }
  }

  switch (action) {
    case "explain_simply":
      return `Explain "${contextLabel}"${focusSuffix} simply and clearly with one worked example and a concise rule summary.`;
    case "exam_quiz":
      return `Give me a progressive 3-question Sec. 1 practice quiz on "${contextLabel}"${focusSuffix}, waiting for my answer before explaining each item.`;
    case "common_pitfalls":
      return `What are the top exam traps and distractors students miss in "${contextLabel}"${focusSuffix}, and how should I check for them?`;
    case "mistake_repair":
      return `Help me repair my recurring mistake in "${contextLabel}"${focusSuffix}: clarify the underlying rule and give me one fresh verification check.`;
    case "weakness_review":
      return `Walk through my focus areas in "${contextLabel}"${focusSuffix} with a concise review plan and one conceptual check at a time.`;
    case "hint_only":
      return `I am working on an active assignment about "${contextLabel}"${focusSuffix}. Provide a Socratic first-step hint and rule reminder ONLY — do NOT reveal direct answers.`;
    case "concept_clarify":
    default:
      return `Help me clarify the core concept behind "${contextLabel}"${focusSuffix} step by step before tackling a similar check.`;
  }
}
