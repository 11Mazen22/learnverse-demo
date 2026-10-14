/**
 * A model may REQUEST canonical Quran text but must never be the source of it.
 * Only bounded, standalone directives are rendered as verified verses.
 */
export type QuranSegment =
  | { kind: "text"; text: string }
  | { kind: "quran"; surah: number; start: number; end: number };

export function splitQuranDirectives(content: string): QuranSegment[] {
  const parts: QuranSegment[] = [];
  const directive = /^[ \t]*\[\[quran:([1-9]\d{0,2}):([1-9]\d{0,2})(?:-([1-9]\d{0,2}))?\]\][ \t]*$/gm;
  let last = 0;
  for (const match of content.matchAll(directive)) {
    const surah = Number(match[1]), start = Number(match[2]), end = Number(match[3] ?? match[2]);
    if (surah > 114 || start > 286 || end > 286 || end < start || end - start >= 20) continue;
    const at = match.index ?? 0;
    // Prevent replacing Markdown code samples.
    const before = content.slice(0, at);
    let fence = "";
    for (const line of before.split("\n")) {
      const token = line.match(/^\s*([\x60~]{3,})/);
      if (token) {
        if (!fence) fence = token[1][0];
        else if (fence === token[1][0]) fence = "";
      }
    }
    if (fence) continue;
    if (at > last) parts.push({ kind: "text", text: content.slice(last, at) });
    parts.push({ kind: "quran", surah, start, end });
    last = at + match[0].length;
  }
  if (last < content.length) parts.push({ kind: "text", text: content.slice(last) });
  return parts.length ? parts : [{ kind: "text", text: content }];
}

/** Only explicit quote/display commands qualify for deterministic Quran retrieval;
 * explanations and broader religious questions stay in the conversation model. */
export function directQuranQuoteRequest(text: string): { surahName: string; start: number; end: number } | null {
  if (text.length > 180) return null;
  const message = text.trim().replace(/[\u064b-\u065f]/g,"").replace(/[؟?!.]+$/,"").trim();
  const ar = message.match(/^(?:من فضلك\s+)?(?:اكتب|اعرض|هات|وريني|اظهر)\s+(?:لي\s+)?(?:ال)?(?:أول|اول)\s+([0-9\u0660-\u0669\u06f0-\u06f9]+|خمس|خمسة|ثلاث|ثلاثة|عشر|عشرة)\s+(?:[اآ]يات|[اآ]ية)\s+(?:من\s+)?سورة\s+(.+)$/u);
  const en = message.match(/^(?:show|write|display|give me)\s+(?:the\s+)?first\s+(\d+)\s+(?:verses|ayahs)\s+(?:of|from)\s+(?:surah|surat)\s+(.+)$/i);
  const m = ar ?? en;
  if (!m) return null;
  const words:Record<string,number>={خمس:5,خمسة:5,ثلاث:3,ثلاثة:3,عشر:10,عشرة:10};
  const raw = m[1].replace(/[\u0660-\u0669]/g,ch=>String(ch.charCodeAt(0)-0x0660))
    .replace(/[\u06f0-\u06f9]/g,ch=>String(ch.charCodeAt(0)-0x06f0));
  const end=words[raw]??Number(raw),surahName=m[2].trim();
  if (!Number.isInteger(end)||end<1||end>20||!surahName||surahName.length>65) return null;
  return {surahName,start:1,end};
}
