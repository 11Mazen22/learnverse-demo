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
