export type ResponseLanguage = "ar" | "en";
export function requestLanguage(text: string, fallback: ResponseLanguage = "ar"): ResponseLanguage {
  // The leading request is authoritative; attached excerpts may use another language.
  const leading = text.trim().split(/\n/)[0].slice(0, 500);
  const ar = (leading.match(/[\u0621-\u064a]/g) ?? []).length;
  const en = (leading.match(/[a-z]/gi) ?? []).length;
  return ar || en ? (ar > en ? "ar" : "en") : fallback;
}
export function resolveAutoRoute(text: string, hasImage = false) {
  if (hasImage) return { model: "Fanar-Oryx-IVU-2", reason: "vision" };
  const q = text.trim().toLowerCase();
  if (/\b(quran|hadith|islam|fatwa|salah|ramadan|tafsir)\b/i.test(q) ||
      /(قرآن|قران|إسلام|اسلام|فتوى|تفسير آية|تفسير سورة|حديث نبوي|صحة الحديث|رمضان)/.test(q))
    return { model: "Fanar-Sadiq", reason: "islamic" };
  // Native component requests need reliable schema following, not a reasoning transcript.
  if (/\b(interactive|flashcards?|quiz|timeline|discriminant|quadratic)\b|\u062a\u0641\u0627\u0639\u0644\u064a|\u0628\u0637\u0627\u0642\u0627\u062a \u0645\u0631\u0627\u062c\u0639\u0629|\u062e\u0637 \u0632\u0645\u0646\u064a|\u0645\u0645\u064a\u0632 \u0627\u0644\u0645\u0639\u0627\u062f\u0644\u0629/i.test(q))
    return { model: "Fanar", reason: "structured_learning" };
  // Length and requests for more detail do not imply complex reasoning.
  if (/\b(prove|proof|derive|debug|algorithm)\b/i.test(q) ||
      /\b(complex|advanced)\b.*\b(math|equation|reasoning|analysis|code)\b/i.test(q) ||
      /(برهن|اثبت|أثبت|اشتق|حلل بعمق|مسألة صعبة|تفكير عميق|خوارزمية)/.test(q))
    return { model: "Fanar-C-2-27B", reason: "deep" };
  // Requested depth and source verification need instruction-following structure.
  if (/\b(long|detailed|comprehensive|in.depth|essay|report|talk\s+along|research|verify|citations?|search)\b|بالتفصيل|شرح طويل|مطوّل|شامل|ابحث|تحقق من/i.test(q))
    return {model:"Fanar-C-1-8.7B",reason:"structured_depth"};
  if (/\b(why|solve|calculate|equation|geometry|physics|logic|compare|explain|analyze|code)\b/i.test(q) ||
      /(لماذا|ليه|احسب|معادلة|هندسة|فيزياء|منطق|اشرح|قارن|حلّل|حلل|برمجة)/.test(q) || /(^|\s)حل(?=\s|$)/.test(q))
    return { model: "Fanar-C-1-8.7B", reason: "reasoning" };
  // Staging tests found S-1 returning Arabic for English greetings. Keep English
  // requests on the general bilingual route rather than selecting by length alone.
  if (requestLanguage(q) === "en") return { model: "Fanar", reason: "english" };
  if (/^(?:أهلا|اهلا|مرحبا|مرحبًا|أهلاً|السلام عليكم|شكرا|شكرًا|تمام)[!،.\s]*$/.test(q))
    return { model: "Fanar-S-1-7B", reason: "greeting" };
  return { model: "Fanar", reason: "general" };
}
