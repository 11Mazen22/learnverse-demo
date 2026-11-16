import type { ContentLanguage } from "./catalog.ts";
import type { CanonicalLessonStudyPack, CuratedStudyQuestion } from "./pack-types.ts";

/**
 * Pack selection over any pack list, with no data of its own.
 *
 * Both the eager module (`sec1-all-lessons-pack.ts`, used by tests and server code) and
 * the lazy client loader (`live-packs.ts`) delegate here, so the two paths cannot drift.
 */

const TRACK_SUFFIX = /^(arabic-language|english|history|philosophy-logic)-(ar|en)$/;
const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeTrackSlug(trackSlug: string): string {
  return trackSlug.replace(TRACK_SUFFIX, "$1");
}

export function selectTrackPacks(
  packs: readonly CanonicalLessonStudyPack[],
  trackSlug: string,
): CanonicalLessonStudyPack[] {
  const direct = packs.filter((pack) => pack.trackSlug === trackSlug);
  const matched = direct.length > 0 ? direct : packs.filter(
    (pack) => pack.trackSlug === normalizeTrackSlug(trackSlug),
  );
  return [...matched].sort((a, b) => a.position - b.position);
}

/** Candidate pack keys for a DB lesson slug: exact, then without the `-en` translation-track suffix. */
export function slugCandidates(lessonSlug: string): string[] {
  const clean = lessonSlug.trim();
  if (!clean || UUID_LIKE.test(clean)) return [];
  const withoutEn = clean.replace(/-en$/i, "");
  return withoutEn === clean ? [clean] : [clean, withoutEn];
}

/**
 * Resolve the canonical pack for a real `lessons.slug`. DB English clones are stored as
 * `<slug>-en`; packs are keyed by the base slug plus content language. UUIDs never match
 * (callers must pass `lessons.slug`), so a wrong-lesson pack can never be returned.
 */
export function selectLessonPack(
  packs: readonly CanonicalLessonStudyPack[],
  lessonSlug?: string | null,
  contentLanguage?: ContentLanguage,
): CanonicalLessonStudyPack | null {
  if (!lessonSlug) return null;
  const candidates = slugCandidates(lessonSlug);
  if (candidates.length === 0) return null;
  if (contentLanguage) {
    for (const key of candidates) {
      const exact = packs.find(
        (pack) => pack.lessonSlug === key && pack.contentLanguage === contentLanguage,
      );
      if (exact) return exact;
    }
  }
  for (const key of candidates) {
    const any = packs.find((pack) => pack.lessonSlug === key);
    if (any) return any;
  }
  return null;
}

export function selectPackQuestion(
  packs: readonly CanonicalLessonStudyPack[],
  questionId: string,
): CuratedStudyQuestion | null {
  for (const pack of packs) {
    const hit = pack.questions.find((q) => q.id === questionId);
    if (hit) return hit;
  }
  return null;
}
