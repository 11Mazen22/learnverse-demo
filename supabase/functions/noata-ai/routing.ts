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
    return { model: "Fanar-Sadiq-2", reason: "islamic" };
  // Length and requests for more detail do not imply complex reasoning.
  if (/\b(prove|proof|derive|debug|algorithm)\b/i.test(q) ||
      /\b(complex|advanced)\b.*\b(math|equation|reasoning|analysis|code)\b/i.test(q) ||
      /(برهن|اثبت|أثبت|اشتق|حلل بعمق|مسألة صعبة|تفكير عميق|خوارزمية)/.test(q))
    return { model: "Fanar-C-2-27B", reason: "deep" };
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
