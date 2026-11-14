import { z } from "zod";
import { sanitizeFanarText } from "./sanitize.ts";

export type StudyProvenance =
  | "curriculum_derived"
  | "user_notes"
  | "ai_supplementary";

export const ProvenanceSchema = z.enum([
  "curriculum_derived",
  "user_notes",
  "ai_supplementary",
]);

export const QuizItemTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "fill_blank",
]);

export const QuizDifficultySchema = z.enum(["easy", "medium", "hard"]);

export const QuizItemSchema = z
  .object({
    id: z.string().min(1),
    type: QuizItemTypeSchema,
    question: z.string().min(3),
    options: z.array(z.string().min(1)).min(2).max(6),
    correctIndex: z.number().int().min(0),
    explanation: z.string().min(1),
    distractorExplanations: z.record(z.string(), z.string()).optional(),
    hint: z.string(),
    concept: z.string().min(1),
    difficulty: QuizDifficultySchema,
  })
  .superRefine((item, ctx) => {
    if (item.correctIndex >= item.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctIndex"],
        message: "correctIndex must reference an item in options",
      });
    }
  });

export const QuizFlashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  hint: z.string(),
  mnemonic: z.string().optional(),
  concept: z.string().min(1),
  provenance: ProvenanceSchema.optional(),
});

export const StudyBundleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  topic: z.string().min(1),
  summary: z.string(),
  difficulty: QuizDifficultySchema,
  locale: z.enum(["ar", "en"]),
  provenance: ProvenanceSchema.optional(),
  sourceLessonId: z.string().min(1).optional(),
  questions: z.array(QuizItemSchema).min(1),
  cards: z.array(QuizFlashcardSchema).min(1),
  keyTakeaways: z.array(z.string().min(1)),
  createdAt: z.string().min(1),
});

export type ValidatedStudyBundle = z.infer<typeof StudyBundleSchema>;

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Expected 6-digit hex color");

export const ThemeSuggestionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .refine((value) => !/نوت[ةه]|نوتا/.test(value), {
      message: "Brand spelling must use نقطة rather than نوتة",
    }),
  description: z
    .string()
    .trim()
    .max(180)
    .refine((value) => !/نوت[ةه]|نوتا/.test(value), {
      message: "Brand spelling must use نقطة rather than نوتة",
    }),
  tokens: z.object({
    accent: HexColorSchema,
    deep: HexColorSchema,
    bright: HexColorSchema,
  }),
  modeConstraint: z.enum(["both", "dark-only", "light-only"]).default("both"),
});

export type ValidatedThemeSuggestion = z.infer<typeof ThemeSuggestionSchema>;

export type AiErrorCode =
  | "FANAR_NOT_CONFIGURED"
  | "AI_QUOTA_EXCEEDED"
  | "AI_RATE_LIMITED"
  | "AI_UPSTREAM_TIMEOUT"
  | "AI_UPSTREAM_UNAVAILABLE"
  | "AI_INVALID_REQUEST"
  | "AI_SCHEMA_INVALID"
  | "AI_SECURITY_POLICY_REFUSAL"
  | "AI_UNKNOWN_ERROR";

export type ClassifiedAiError = {
  code: AiErrorCode;
  status: number;
  retryable: boolean;
  message: string;
  userMessage: string;
  quota?: unknown;
};

/**
 * Strips provider control wrappers (<think>, <tool_call_start>, etc.),
 * enforces strict Noäta ("نقطة") Arabic brand spelling, and removes unsafe scripts.
 */
export function stripAiWrappers(input: string): string {
  if (!input) return "";
  const scrubbed = sanitizeFanarText(input)
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/```(?:json|JSON)?\s*/g, "")
    .replace(/```/g, "")
    .replace(/نوت[ةه]/g, "نقطة")
    .replace(/نوتا/g, "نقطة")
    .trim();
  return scrubbed;
}

/**
 * Finds and extracts the first syntactically balanced top-level JSON object,
 * ignoring braces inside JSON string literals or surrounding prose.
 */
export function extractBalancedJsonObject(raw: string): string | null {
  const clean = stripAiWrappers(raw);
  for (let start = clean.indexOf("{"); start >= 0; start = clean.indexOf("{", start + 1)) {
    let depth = 0;
    let quoted = false;
    let escaped = false;
    for (let i = start; i < clean.length; i++) {
      const ch = clean[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === '"') quoted = false;
        continue;
      }
      if (ch === '"') {
        quoted = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        const candidate = clean.slice(start, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return candidate;
          }
        } catch {
          // Ignore non-JSON balanced braces inside surrounding prose.
        }
        break;
      }
    }
  }
  return null;
}

const BIDI_AND_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Wraps untrusted study notes, titles, or theme preferences inside explicit
 * data delimiters so instructions embedded inside learner content cannot escalate.
 */
export function frameUntrustedStudyInput(raw: string, label = "study_notes"): string {
  const safeLabel = label.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "study_notes";
  const neutralized = String(raw ?? "")
    .replace(BIDI_AND_CONTROL_CHARS, "")
    .replace(/<\/?\s*untrusted_study_input\b[^>]*>/gi, "[redacted_delimiter]")
    .replace(/<\/?\s*(?:system|developer|assistant|tool_call|tool_result)\s*>/gi, "[redacted_tag]")
    .trim()
    .slice(0, 4000);
  return `<untrusted_study_input label="${safeLabel}">\n${neutralized}\n</untrusted_study_input>`;
}

export type TamperingCheckResult = {
  blocked: boolean;
  reason?:
    | "prompt_injection"
    | "wallet_tampering"
    | "privilege_escalation"
    | "xss_payload";
  detail?: string;
};

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+|any\s+|your\s+)?(?:previous|above|prior|system)\s+instructions?/i,
  /disregard\s+(?:all\s+|your\s+)?(?:system|safety|guardrail|previous)\s+(?:rules?|prompts?|instructions?)/i,
  /(?:reveal|print|dump|leak|show)\s+(?:your\s+|the\s+)?(?:hidden\s+)?(?:system\s+prompt|developer\s+instructions?|secrets?|api[_\s]?key|service[_\s]?role)/i,
  /(?:<\/\s*untrusted_study_input\s*>|<\s*system\s*>|\[SYSTEM\s*OVERRIDE\])/i,
  /تجاهل\s+(?:كافة|كل|جميع)?\s*(?:التعليمات|الأوامر|القواعد)\s*(?:السابقة|النظامية)?/,
  /(?:اكشف|اطبع|أظهر|سرّب)\s+(?:موجه\s+النظام|التعليمات\s+السرية|مفاتيح\s+الربط|مفتاح\s+API)/,
  /تجاوز\s+(?:كل\s+|جميع\s+)?(?:قواعد\s+الأمان|الحماية|الضوابط)/,
];

const WALLET_TAMPERING_PATTERNS: RegExp[] = [
  /(?:grant|give|add|set|credit|unlock|award)\s+(?:me|my\s+account|this\s+user)?\s*(?:\+?\d+\s+)?(?:xp|coins?|gold|gems?|reward\s+boxes?|all\s+rewards?|mastery(?:_score)?)/i,
  /(?:update|modify|overwrite|forge|bypass)\s+(?:my\s+)?(?:xp|coins?|wallet|ledger|mastery_score|skill_evidence|quiz_attempt|score\s+to\s+100)/i,
  /(?:أعطني|زوّد|أضف\s+لي|عدّل|ارفع)\s+(?:\+?\d+\s+)?(?:نقاط\s*(?:XP|الخبرة)|العملات|الرصيد|درجة\s*الإتقان|الدرجة\s*إلى\s*100)/,
  /(?:افتح\s+(?:كل|جميع)\s*(?:الصناديق|المكافآت|المراحل)\s*(?:مجانًا|مجانا|بدون\s*دفع))/,
];

const PRIVILEGE_ESCALATION_PATTERNS: RegExp[] = [
  /(?:make\s+me|promote\s+me\s+to|set\s+(?:my\s+)?role\s+to|grant\s+me)\s+(?:an?\s+)?(?:admin|school_admin|super_?admin|teacher|staff)/i,
  /(?:bypass|disable|turn\s+off)\s+(?:rls|row\s+level\s+security|auth|authorization|quota)/i,
  /(?:read|show|dump|fetch|export)\s+(?:other\s+students'?|all\s+users'?|teachers'?|admin'?s?)\s+(?:records?|emails?|grades?|data|passwords?|tokens?)/i,
  /(?:اجعلني|رقّني\s+إلى|غيّر\s+دوري\s+إلى)\s+(?:مشرف|مدير\s+مدرسة|معلم|أدمن)/,
  /(?:اقرأ|اعرض|أظهر|اسحب)\s+(?:بيانات|درجات|رسائل|كلمات\s+مرور)\s+(?:طالب\s+آخر|الطلاب\s+الآخرين|المستخدمين|المعلمين)/,
  /(?:تجاوز|عطّل)\s+(?:صلاحيات\s+الوصول|سياسات\s+RLS|حد\s+الاستخدام)/,
];

const XSS_PAYLOAD_PATTERNS: RegExp[] = [
  /<script\b/i,
  /javascript\s*:/i,
  /\bon(?:error|load|click|focus|mouseover)\s*=/i,
];

/**
 * Detects prompt-injection, illegal XP/wallet/mastery tampering, cross-tenant privilege
 * escalation, and executable XSS payloads in learner-supplied inputs.
 */
export function detectAdversarialTamperingPrompt(input: string): TamperingCheckResult {
  const normalized = String(input ?? "").replace(BIDI_AND_CONTROL_CHARS, "");
  for (const pattern of XSS_PAYLOAD_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: "xss_payload", detail: "Executable script pattern rejected." };
    }
  }
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: "prompt_injection", detail: "System override instruction rejected." };
    }
  }
  for (const pattern of WALLET_TAMPERING_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: "wallet_tampering", detail: "Unauthorized reward or mastery modification rejected." };
    }
  }
  for (const pattern of PRIVILEGE_ESCALATION_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: "privilege_escalation", detail: "Unauthorized role or cross-user access request rejected." };
    }
  }
  return { blocked: false };
}

export type ParseBundleContext = {
  fallbackTitle: string;
  fallbackTopic: string;
  locale: "ar" | "en";
  difficulty: "easy" | "medium" | "hard";
  provenance: StudyProvenance;
  sourceLessonId?: string;
};

export type ParseBundleResult =
  | { ok: true; data: ValidatedStudyBundle; repaired: boolean }
  | { ok: false; code: "AI_SCHEMA_INVALID"; error: string };

/**
 * Extracts, sanitizes, deterministically repairs minor structural defects, and strictly
 * validates AI-generated study bundles against `StudyBundleSchema`.
 */
export function parseAndValidateStudyBundle(
  rawResponse: string,
  context: ParseBundleContext,
): ParseBundleResult {
  const jsonSlice = extractBalancedJsonObject(rawResponse);
  if (!jsonSlice) {
    return {
      ok: false,
      code: "AI_SCHEMA_INVALID",
      error: "No balanced JSON object found in model output",
    };
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = JSON.parse(jsonSlice);
  } catch (err) {
    return {
      ok: false,
      code: "AI_SCHEMA_INVALID",
      error: err instanceof Error ? err.message : "Invalid JSON syntax",
    };
  }

  if (!parsedRaw || typeof parsedRaw !== "object" || Array.isArray(parsedRaw)) {
    return {
      ok: false,
      code: "AI_SCHEMA_INVALID",
      error: "Top-level bundle value is not an object",
    };
  }

  const obj = parsedRaw as Record<string, unknown>;
  let repaired = false;

  const rawQuestions = Array.isArray(obj.questions) ? obj.questions : [];
  if (rawQuestions.length === 0) {
    return {
      ok: false,
      code: "AI_SCHEMA_INVALID",
      error: "Model response did not include any questions",
    };
  }

  const normalizedQuestions = rawQuestions
    .map((entry, idx) => {
      if (!entry || typeof entry !== "object") return null;
      const q = entry as Record<string, unknown>;
      const questionText = stripAiWrappers(String(q.question ?? ""));
      const options = Array.isArray(q.options)
        ? q.options.map((o) => stripAiWrappers(String(o ?? ""))).filter(Boolean)
        : [];
      if (questionText.length < 3 || options.length < 2) return null;

      let type: "multiple_choice" | "true_false" | "fill_blank" = "multiple_choice";
      if (q.type === "true_false" || q.type === "fill_blank" || q.type === "multiple_choice") {
        type = q.type;
      } else {
        repaired = true;
      }

      const rawCorrect = Number(q.correctIndex);
      let correctIndex = Number.isInteger(rawCorrect) ? rawCorrect : 0;
      if (correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
        repaired = true;
      }

      let explanation = stripAiWrappers(String(q.explanation ?? ""));
      if (!explanation) {
        explanation =
          context.locale === "en"
            ? `Correct option: ${options[correctIndex]}.`
            : `الإجابة الصحيحة هي: ${options[correctIndex]}.`;
        repaired = true;
      }

      const rawDiff = q.difficulty;
      const difficulty: "easy" | "medium" | "hard" =
        rawDiff === "easy" || rawDiff === "medium" || rawDiff === "hard"
          ? rawDiff
          : context.difficulty;

      const distractorExplanations: Record<string, string> = {};
      if (q.distractorExplanations && typeof q.distractorExplanations === "object" && !Array.isArray(q.distractorExplanations)) {
        for (const [k, v] of Object.entries(q.distractorExplanations as Record<string, unknown>)) {
          const cleanVal = stripAiWrappers(String(v ?? ""));
          if (cleanVal) distractorExplanations[String(k)] = cleanVal;
        }
      }

      return {
        id: stripAiWrappers(String(q.id ?? "")) || `q-${idx + 1}-${Date.now()}`,
        type,
        question: questionText,
        options: options.slice(0, 6),
        correctIndex,
        explanation,
        distractorExplanations,
        hint: stripAiWrappers(String(q.hint ?? "")),
        concept: stripAiWrappers(String(q.concept ?? "")) || context.fallbackTopic,
        difficulty,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (normalizedQuestions.length === 0) {
    return {
      ok: false,
      code: "AI_SCHEMA_INVALID",
      error: "No valid quiz questions survived schema normalization",
    };
  }

  const rawCards = Array.isArray(obj.cards) ? obj.cards : [];
  let normalizedCards = rawCards
    .map((entry, idx) => {
      if (!entry || typeof entry !== "object") return null;
      const c = entry as Record<string, unknown>;
      const front = stripAiWrappers(String(c.front ?? ""));
      const back = stripAiWrappers(String(c.back ?? ""));
      if (!front || !back) return null;
      const mnemonic = stripAiWrappers(String(c.mnemonic ?? ""));
      return {
        id: stripAiWrappers(String(c.id ?? "")) || `c-${idx + 1}-${Date.now()}`,
        front,
        back,
        hint: stripAiWrappers(String(c.hint ?? "")),
        ...(mnemonic ? { mnemonic } : {}),
        concept: stripAiWrappers(String(c.concept ?? "")) || context.fallbackTopic,
        provenance: context.provenance,
      };
    })
    .filter((card): card is NonNullable<typeof card> => card !== null);

  if (normalizedCards.length === 0) {
    repaired = true;
    normalizedCards = normalizedQuestions.slice(0, 4).map((q, idx) => ({
      id: `c-repaired-${idx + 1}-${Date.now()}`,
      front: q.question,
      back: q.options[q.correctIndex] ?? q.explanation,
      hint: q.hint,
      concept: q.concept,
      provenance: context.provenance,
    }));
  }

  const rawTakeaways = Array.isArray(obj.keyTakeaways) ? obj.keyTakeaways : [];
  const keyTakeaways = rawTakeaways
    .map((entry) => stripAiWrappers(String(entry ?? "")))
    .filter(Boolean);

  const candidate = {
    id: `bundle-${Date.now()}`,
    title: stripAiWrappers(String(obj.title ?? "")) || stripAiWrappers(context.fallbackTitle),
    topic: stripAiWrappers(String(obj.topic ?? "")) || stripAiWrappers(context.fallbackTopic),
    summary: stripAiWrappers(String(obj.summary ?? "")),
    difficulty:
      obj.difficulty === "easy" || obj.difficulty === "medium" || obj.difficulty === "hard"
        ? obj.difficulty
        : context.difficulty,
    locale: context.locale,
    provenance: context.provenance,
    ...(context.sourceLessonId ? { sourceLessonId: context.sourceLessonId } : {}),
    questions: normalizedQuestions,
    cards: normalizedCards,
    keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : [stripAiWrappers(context.fallbackTopic)],
    createdAt: new Date().toISOString(),
  };

  const checked = StudyBundleSchema.safeParse(candidate);
  if (!checked.success) {
    return {
      ok: false,
      code: "AI_SCHEMA_INVALID",
      error: checked.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    };
  }

  return { ok: true, data: checked.data, repaired };
}

/**
 * Classifies Edge Function / HTTP / Zod / Security errors into Noäta's unified
 * non-destructive bilingual error taxonomy.
 */
export function classifyAiError(
  error: unknown,
  locale: "ar" | "en" = "ar",
  payload?: Record<string, unknown> | null,
): ClassifiedAiError {
  const statusFromPayload =
    typeof payload?.status === "number" ? payload.status : undefined;
  const codeFromPayload =
    typeof payload?.code === "string" ? payload.code : undefined;
  const rawMessage =
    (typeof payload?.error === "string" && payload.error) ||
    (error instanceof Error ? error.message : String(error ?? ""));
  const quota = payload?.quota;

  const errStatus =
    typeof (error as { status?: unknown })?.status === "number"
      ? (error as { status: number }).status
      : statusFromPayload;

  const isEn = locale === "en";

  if (codeFromPayload === "FANAR_NOT_CONFIGURED" || /AI backend is not configured/i.test(rawMessage)) {
    return {
      code: "FANAR_NOT_CONFIGURED",
      status: 503,
      retryable: false,
      message: rawMessage || "AI backend is not configured",
      userMessage: isEn
        ? "Noäta AI backend is not configured in this environment; using local smart generation."
        : "خدمة Noäta AI غير مفعّلة في هذه البيئة حاليًا؛ تم استخدام المولد المحلي بأمان.",
    };
  }

  if (
    codeFromPayload === "AI_SECURITY_POLICY_REFUSAL" ||
    /AI_SECURITY_POLICY_REFUSAL|tampering|prompt injection/i.test(rawMessage)
  ) {
    return {
      code: "AI_SECURITY_POLICY_REFUSAL",
      status: 403,
      retryable: false,
      message: rawMessage || "Blocked by Noäta AI security policy",
      userMessage: isEn
        ? "That request attempted to override system rules or modify protected records and was blocked."
        : "تم رفض الطلب لمحاولته تجاوز القواعد النظامية أو تعديل بيانات محمية.",
    };
  }

  if (
    codeFromPayload === "AI_QUOTA_EXCEEDED" ||
    /Noata AI quota reached|quota exceeded|quota/i.test(rawMessage) ||
    (errStatus === 429 && Boolean(quota))
  ) {
    return {
      code: "AI_QUOTA_EXCEEDED",
      status: 429,
      retryable: false,
      message: rawMessage || "Noata AI quota reached",
      quota,
      userMessage: isEn
        ? "You reached your Noäta AI request quota. Local generation kept your draft intact—try again after your window resets."
        : "وصلت إلى حد استخدام Noäta AI الحالي. احتفظنا بمسودتك واستخدمنا التوليد المحلي دون فقدان بياناتك.",
    };
  }

  if (codeFromPayload === "AI_RATE_LIMITED" || errStatus === 429 || /rate limit|too many requests/i.test(rawMessage)) {
    return {
      code: "AI_RATE_LIMITED",
      status: 429,
      retryable: true,
      message: rawMessage || "Rate limited",
      userMessage: isEn
        ? "Too many requests in a short time. Wait a moment and retry."
        : "طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم أعد المحاولة.",
    };
  }

  if (
    codeFromPayload === "AI_UPSTREAM_TIMEOUT" ||
    errStatus === 504 ||
    /timeout|timed out|AbortError|HeadersTimeout/i.test(rawMessage)
  ) {
    return {
      code: "AI_UPSTREAM_TIMEOUT",
      status: 504,
      retryable: true,
      message: rawMessage || "AI upstream timeout",
      userMessage: isEn
        ? "Fanar took too long to respond. Generated locally cleanly—you can retry without losing edits."
        : "استغرق Fanar وقتًا أطول من المعتاد. تم التوليد محليًا بأمان ويمكنك إعادة المحاولة.",
    };
  }

  if (
    codeFromPayload === "AI_UPSTREAM_UNAVAILABLE" ||
    errStatus === 502 ||
    errStatus === 503 ||
    /Failed to fetch|network|ECONNREFUSED|upstream|unavailable|502|503/i.test(rawMessage)
  ) {
    return {
      code: "AI_UPSTREAM_UNAVAILABLE",
      status: errStatus ?? 503,
      retryable: true,
      message: rawMessage || "AI upstream unavailable",
      userMessage: isEn
        ? "Fanar is temporarily unreachable; your draft was processed locally cleanly."
        : "تعذّر الوصول إلى Fanar مؤقتًا؛ تم معالجة مسودتك محليًا بأمان.",
    };
  }

  if (codeFromPayload === "AI_SCHEMA_INVALID" || /schema|No balanced JSON/i.test(rawMessage)) {
    return {
      code: "AI_SCHEMA_INVALID",
      status: 422,
      retryable: true,
      message: rawMessage || "Malformed AI schema",
      userMessage: isEn
        ? "The model returned an incomplete structure; fell back cleanly to local synthesis."
        : "عاد النموذج ببنية غير مكتملة؛ تم الاعتماد على التوليد المحلي الدقيق.",
    };
  }

  if (errStatus === 400 || codeFromPayload === "AI_INVALID_REQUEST") {
    return {
      code: "AI_INVALID_REQUEST",
      status: 400,
      retryable: false,
      message: rawMessage || "Invalid AI request",
      userMessage: isEn
        ? "Please check your prompt length and inputs, then try again."
        : "يرجى مراجعة المدخلات وطول النص ثم المحاولة مرة أخرى.",
    };
  }

  return {
    code: "AI_UNKNOWN_ERROR",
    status: errStatus ?? 500,
    retryable: true,
    message: rawMessage || "Unknown AI failure",
    userMessage: isEn
      ? "An unexpected AI error occurred; local smart generation completed without data loss."
      : "حدث خطأ غير متوقع في الاتصال بالذكاء الاصطناعي؛ تم إكمال التوليد محليًا بدون فقدان بياناتك.",
  };
}
