/**
 * Smooth adaptive typewriter revelation for streamed AI responses.
 * Advances along grapheme/word boundaries without splitting surrogate pairs,
 * Arabic diacritics, or special inline directives (`[[quran:...]]`).
 */

const COMBINING_MARK_RE = /[\u0300-\u036f\u064b-\u065f\u0670\u06d6-\u06ed]/;
const WORD_BREAK_RE = /[\s\n.,،؛:!؟?\-—()[\]{}]/;

function snapSafeBoundary(text: string, candidate: number): number {
  let idx = Math.max(0, Math.min(text.length, Math.round(candidate)));
  if (idx >= text.length) return text.length;

  // Never split a UTF-16 surrogate pair.
  const prevCode = text.charCodeAt(idx - 1);
  if (idx > 0 && prevCode >= 0xd800 && prevCode <= 0xdbff) {
    idx += 1;
  }

  // Never slice inside combining marks / Arabic tashkeel.
  while (idx < text.length && COMBINING_MARK_RE.test(text[idx])) {
    idx += 1;
  }

  // If the cursor landed right inside a word, extend slightly (up to 6 chars)
  // to complete short tokens smoothly while keeping cadence fluid.
  if (idx < text.length && idx > 0 && !WORD_BREAK_RE.test(text[idx - 1]) && !WORD_BREAK_RE.test(text[idx])) {
    let look = idx;
    const limit = Math.min(text.length, idx + 6);
    while (look < limit && !WORD_BREAK_RE.test(text[look])) {
      look += 1;
    }
    if (look < limit && WORD_BREAK_RE.test(text[look])) {
      idx = look + 1;
    }
  }

  // Do not expose half of an inline [[quran:...]] directive token.
  const openQuran = text.lastIndexOf("[[quran:", idx);
  if (openQuran >= 0 && text.indexOf("]]", openQuran) >= idx) {
    const close = text.indexOf("]]", openQuran);
    idx = close >= 0 ? close + 2 : openQuran;
  }

  return Math.min(text.length, idx);
}

/**
 * Compute the next character index to display during streaming animation.
 * Keeps short chunks crisp and natural (~110–180 chars/s) while accelerating
 * proportionally when large upstream bursts arrive so the UI never falls behind.
 */
export function advanceStreamCursor(
  currentLength: number,
  targetText: string,
  elapsedMs: number,
): number {
  const total = targetText.length;
  if (currentLength >= total) return total;
  if (total === 0) return 0;

  const dt = Math.max(8, Math.min(64, elapsedMs || 16));
  const backlog = total - currentLength;

  // Adaptive characters per frame: fast enough to feel snappy like ChatGPT,
  // smooth enough to show genuine live word-by-word typing instead of jumps.
  let step: number;
  if (backlog <= 24) {
    step = Math.max(2, Math.round((dt / 16) * 2.5));
  } else if (backlog <= 110) {
    step = Math.max(4, Math.round((dt / 16) * 5.5));
  } else if (backlog <= 320) {
    step = Math.max(8, Math.round((dt / 16) * 11));
  } else {
    step = Math.max(16, Math.ceil(backlog * 0.24 * (dt / 16)));
  }

  const next = Math.min(total, currentLength + step);
  return snapSafeBoundary(targetText, next);
}
