import { toArabicIndicVerseNumber } from "@/lib/quran/verse-number";

/**
 * Small, scalable geometric verse seal. Ornament is decorative; the number
 * has a single accessible name and never alters the authenticated ayah text.
 */
export function QuranVerseMarker({ number, label }: { number: number; label: string }) {
  const easternDigits = toArabicIndicVerseNumber(number);
  return (
    <span className="noata-quran-verse-number" role="img" aria-label={label + " " + easternDigits} dir="rtl">
      <svg
        className="noata-quran-verse-seal"
        viewBox="0 0 56 56"
        fill="none"
        focusable="false"
        aria-hidden="true"
      >
        <rect className="noata-quran-seal-petal" x="9.5" y="9.5" width="37" height="37" rx="9" />
        <rect className="noata-quran-seal-petal" x="9.5" y="9.5" width="37" height="37" rx="9" transform="rotate(45 28 28)" />
        <circle className="noata-quran-seal-center" cx="28" cy="28" r="18.4" />
        <circle className="noata-quran-seal-ring" cx="28" cy="28" r="15.8" />
      </svg>
      <span className="noata-quran-verse-digits" aria-hidden="true">{easternDigits}</span>
    </span>
  );
}
