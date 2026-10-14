import { normalizeQuranQuery, type Chapter } from "./reciters.ts";
export type SearchVerse = { surah: number; surahName: string; number: number; text: string };
export const searchableText = (text: string) => normalizeQuranQuery(text).replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const grams = (text: string) => [...new Set(Array.from({ length: Math.max(0, text.length - 1) }, (_, i) => text.slice(i, i + 2)))];
export function createVerseIndex(verses: SearchVerse[]) {
  const rows = verses.map(verse => ({ verse, normalized: searchableText(verse.text) }));
  const postings = new Map<string, Set<number>>();
  const references = new Map<string, number>();
  rows.forEach(({ verse, normalized }, id) => {
    references.set(`${verse.surah}:${verse.number}`, id);
    for (const gram of grams(normalized)) {
      if (!postings.has(gram)) postings.set(gram, new Set());
      postings.get(gram)!.add(id);
    }
  });
  return { rows, postings, references };
}
export function searchVerses(index: ReturnType<typeof createVerseIndex>, query: string, selected: number, within?: number) {
  const reference = normalizeQuranQuery(query).trim().match(/^(?:(\d{1,3})\s*[:/]\s*)?(\d{1,3})$/);
  if (reference) {
    const surah = reference[1] ? Number(reference[1]) : selected;
    const id = index.references.get(`${surah}:${Number(reference[2])}`);
    const verse = id === undefined || (within && within !== surah) ? undefined : index.rows[id].verse;
    return { results: verse ? [verse] : [], total: verse ? 1 : 0 };
  }
  const term = searchableText(query);
  if (term.length < 2) return { results: [], total: 0 };
  const sets = grams(term).map(gram => index.postings.get(gram) ?? new Set<number>()).sort((a, b) => a.size - b.size);
  const candidates = [...(sets[0] ?? [])].filter(id => sets.every(set => set.has(id)));
  const matched = candidates.map(id => index.rows[id]).filter(row => (!within || row.verse.surah === within) && row.normalized.includes(term));
  matched.sort((a, b) => Number(b.normalized === term) - Number(a.normalized === term) || Number(b.normalized.startsWith(term)) - Number(a.normalized.startsWith(term)) || a.verse.surah - b.verse.surah || a.verse.number - b.verse.number);
  return { results: matched.slice(0, 50).map(row => row.verse), total: matched.length };
}
const aliases: Record<number, string[]> = { 1: ["الفاتحه", "fatiha", "fatihah"], 9: ["براءة", "baraah"], 17: ["بني إسرائيل", "bani israel"], 36: ["يس", "yasin"], 40: ["المؤمن", "mumin"], 76: ["الدهر", "dahr"], 94: ["الانشراح", "inshirah"] };
const nameKey = (value: string) => searchableText(value).replace(/^سور[هة]\s+/, "").replace(/^al\s*/, "").replace(/([aeiou])\1+/g, "$1").replace(/\s/g, "");
function distance(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(row[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
    previous = row;
  }
  return previous[b.length];
}
export function searchChapters(chapters: Chapter[], query: string): Chapter[] {
  const term = nameKey(query.trim().slice(0, 80));
  if (!term) return chapters;
  if (/^\d+$/.test(term)) return chapters.filter(chapter => chapter.number === Number(term));
  return chapters.map(chapter => {
    const names = [chapter.name, chapter.englishName, ...(aliases[chapter.number] ?? [])].map(nameKey);
    const score = Math.min(...names.map(name => name === term ? 0 : name.startsWith(term) ? 1 : name.includes(term) ? 2 : term.length >= 4 && distance(term, name) <= (term.length >= 7 ? 2 : 1) ? 3 : 9));
    return { chapter, score };
  }).filter(row => row.score < 9).sort((a, b) => a.score - b.score || a.chapter.number - b.chapter.number).map(row => row.chapter);
}
export function highlightedParts(text: string, query: string): { text: string; matched: boolean }[] {
  const term = searchableText(query);
  if (term.length < 2 || /^[\d\s:/]+$/.test(normalizeQuranQuery(query))) return [{ text, matched: false }];
  const segments = [...new Intl.Segmenter("ar", { granularity: "grapheme" }).segment(text)];
  let normalized = "";
  const mapping: { start: number; end: number }[] = [];
  for (const { segment, index } of segments) {
    const value = normalizeQuranQuery(segment).replace(/[^\p{L}\p{N}\s]/gu, " ");
    for (const char of value) {
      if (/\s/.test(char) && normalized.endsWith(" ")) { if (mapping.length) mapping[mapping.length - 1].end = index + segment.length; continue; }
      normalized += /\s/.test(char) ? " " : char;
      mapping.push({ start: index, end: index + segment.length });
    }
  }
  const result: { text: string; matched: boolean }[] = [];
  let cursor = 0, from = 0, position = normalized.indexOf(term);
  while (position !== -1) {
    const start = mapping[position]?.start, end = mapping[position + term.length - 1]?.end;
    if (start === undefined || end === undefined) break;
    if (start > cursor) result.push({ text: text.slice(cursor, start), matched: false });
    result.push({ text: text.slice(start, end), matched: true }); cursor = end;
    from = position + term.length; position = normalized.indexOf(term, from);
  }
  if (cursor < text.length) result.push({ text: text.slice(cursor), matched: false });
  return result.length ? result : [{ text, matched: false }];
}
