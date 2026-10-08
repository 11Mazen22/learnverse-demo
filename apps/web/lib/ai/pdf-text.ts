type PdfTextItem = {
  str: string;
  transform: number[];
  dir?: string;
  width?: number;
};
/** Chromium/Skia may encode shaped Arabic as individual presentation-form glyphs. */
export function reconstructPdfLine(items: readonly PdfTextItem[]): string {
  const shaped = items.filter((x) =>
    /[\ufb50-\ufdff\ufe70-\ufeff]/.test(x.str),
  );
  if (shaped.length > 2 && shaped.every((x) => [...x.str].length <= 2)) {
    // PDF.js already gives each multi-letter RTL cluster in logical order.
    // Reverse cluster positions, never the characters within a cluster.
    // Reversing the joined string corrupts e.g. "وف" in "الحروف" and "اءة".
    const arabic =
      /^[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff\s]+$/;
    const mark = /^[\s\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]+$/;
    const positioned = items
      .filter((item) => !item.str.trim() || !mark.test(item.str))
      // PDF.js can synthesize an almost-zero-width space around floating marks.
      .filter(
        (item) =>
          !(
            typeof item.width === "number" &&
            item.width < 0.1 &&
            !item.str.trim()
          ),
      )
      .map((item) => ({ ...item }));
    for (const item of items.filter(
      (item) => item.str.trim() && mark.test(item.str),
    )) {
      const x = item.transform[4];
      const base = positioned.find(
        (candidate) =>
          candidate.width &&
          candidate.transform[4] <= x &&
          x < candidate.transform[4] + candidate.width &&
          /[\u0600-\u06ff\ufb50-\ufdff\ufe70-\ufeff]/.test(candidate.str),
      );
      if (base) base.str += item.str.trim();
      else positioned.push({ ...item });
    }
    const physical: PdfTextItem[] = [];
    for (const item of positioned.sort(
      (a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0),
    )) {
      const previous = physical.at(-1);
      if (
        previous &&
        typeof previous.width === "number" &&
        item.transform[4] > previous.transform[4] + previous.width + 4 &&
        !/\s$/.test(previous.str) &&
        !/^\s/.test(item.str)
      )
        physical.push({ str: " ", transform: item.transform });
      physical.push(item);
    }
    const normalized = items
      .map((item) => item.str)
      .join("")
      .normalize("NFKC");
    const arabicLetters = (normalized.match(/[\u0600-\u06ff]/g) ?? []).length;
    const latinLetters = (normalized.match(/[a-z]/gi) ?? []).length;
    if (arabicLetters > latinLetters)
      return [...physical]
        .reverse()
        .map((item) => item.str)
        .join("")
        .normalize("NFKC")
        .trim();
    const pieces: string[] = [];
    let run: string[] = [];
    const flush = () => {
      pieces.push(...run.reverse());
      run = [];
    };
    for (const item of physical) {
      if (!item.str) continue;
      if (arabic.test(item.str)) run.push(item.str);
      else {
        flush();
        pieces.push(item.str);
      }
    }
    flush();
    return pieces.join("").normalize("NFKC").trim();
  }
  return items
    .map((x) => x.str)
    .join(" ")
    .normalize("NFKC")
    .trim();
}
export function pdfTextLines(raw: readonly unknown[]): string[] {
  const lines: string[] = [];
  let items: PdfTextItem[] = [];
  let prevY: number | null = null;
  for (const value of raw) {
    if (
      !value ||
      typeof value !== "object" ||
      !("str" in value) ||
      !("transform" in value)
    )
      continue;
    const item = value as PdfTextItem;
    const y = item.transform[5] ?? 0;
    const diacritic = /^[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]+$/.test(
      item.str,
    );
    if (prevY !== null && Math.abs(prevY - y) > 4 && !diacritic) {
      const text = reconstructPdfLine(items);
      if (text) lines.push(text);
      items = [];
    }
    items.push(item);
    if (!diacritic) prevY = y;
  }
  const last = reconstructPdfLine(items);
  if (last) lines.push(last);
  return lines;
}
