/** Presentation guidance is separate from facts and never runs arbitrary styles. */
const PHONETIC_NOATA_RE =
  /(?<![\p{L}\p{N}])(?:([وف]?ل)ل|([وف]?[بكل]?)(?:ال)?)(?:نواتا|نوأتا|نؤاتا|نوآتا|نواته|نوتاه|نوتا)(?![\p{L}\p{N}])/gu;
const IDENTITY_NOTE_RE =
  /(اسمي|أنا|منصة|تطبيق|موقع|مساعد|شركة|نظام)(\s+)(?:ال)?نوت[ةه](?![\p{L}\p{N}])/gu;

/**
 * Guarantees Noäta's Arabic brand name is never phonetically mangled into "نواتا" / "نوتا"
 * in model outputs while preserving unrelated Arabic dictionary words and code fences.
 */
export function normalizeArabicBrandName(text: string): string {
  const raw = String(text ?? "");
  if (!raw) return raw;
  return raw
    .split(/(```[\s\S]*?```)/g)
    .map((segment, index) =>
      index % 2 === 1
        ? segment
        : segment
            .replace(
              PHONETIC_NOATA_RE,
              (_m, llPrefix?: string, stdPrefix?: string) =>
                `${llPrefix ?? stdPrefix ?? ""}نُقطة`,
            )
            .replace(IDENTITY_NOTE_RE, "$1$2نُقطة"),
    )
    .join("");
}

export function answerPresentation(request:string):string{
 const human=request.split(/Verified extracted original document content:|المحتوى الأصلي للملف:|مصادر الملفات المرفقة/)[0];
 const detailed=/\b(long|detailed|comprehensive|in.depth|essay|report|talk\s+along)\b|بالتفصيل|شرح طويل|مطوّل|مطول|شامل|تقرير|تقرير كامل|مقال/i.test(human);
 return "Write like an extraordinary modern tutor — visually clean, scannable, and never a dense single-paragraph wall of text. For substantive questions: (1) open with a punchy 1-2 line direct answer, (2) organize into meaningful section headings (`##`) with short breathable paragraphs (2-3 lines max), **bold** key concepts, and clean bullets or comparison tables, (3) highlight a real exam tip with `:::insight ... :::` or a worked case with `:::example ... :::` when helpful, and (4) proactively attach ONE relevant `noata-ui` Smart UI block (`concept_card`, `steps`, `comparison`, `timeline`, `flashcards`, `quiz`, or graph) whenever interactivity sharpens understanding. For Arabic replies, write naturally in warm smart Egyptian Arabic while keeping exact academic terms crisp. Avoid repetitive openers, writing-process meta-commentary, and unnecessary closing fluff. Present claims and uncertainty honestly; never invent facts to fill space."+
  (detailed?" The user asked for depth. Give a complete substantial explanation with about 5-7 useful sections and concrete examples. Aim for 600-1000 relevant words unless the user specifies another length; do not stop after one paragraph or replace the requested explanation with a follow-up question.":" Match depth to the question; a greeting or simple fact does not need headings or extra widgets.");
}
