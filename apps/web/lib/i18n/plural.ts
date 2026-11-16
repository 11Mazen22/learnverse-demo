/**
 * Arabic plural forms for UI counts.
 *
 * Arabic has six CLDR plural categories, so writing `${count} آيات` produces
 * grammatically wrong copy for most numbers (e.g. `100 آيات`). Every UI count
 * goes through `formatArabicCount` instead of concatenating a bare noun.
 */

export type ArabicPluralForms = {
  zero: string;
  one: string;
  two: string;
  few: string;
  many: string;
  other: string;
};

const arabicNumber = new Intl.NumberFormat("ar-EG");
const arabicRules = new Intl.PluralRules("ar");

export const AYAH_FORMS: ArabicPluralForms = {
  zero: "لا آيات",
  one: "آية واحدة",
  two: "آيتان",
  few: "آيات",
  many: "آية",
  other: "آية",
};

export const NOTIFICATION_FORMS: ArabicPluralForms = {
  zero: "لا إشعارات",
  one: "إشعار واحد",
  two: "إشعاران",
  few: "إشعارات",
  many: "إشعارًا",
  other: "إشعار",
};

export const LESSON_FORMS: ArabicPluralForms = {
  zero: "لا دروس",
  one: "درس واحد",
  two: "درسان",
  few: "دروس",
  many: "درسًا",
  other: "درس",
};

export const QUESTION_FORMS: ArabicPluralForms = {
  zero: "لا أسئلة",
  one: "سؤال واحد",
  two: "سؤالان",
  few: "أسئلة",
  many: "سؤالًا",
  other: "سؤال",
};

export const STUDENT_FORMS: ArabicPluralForms = {
  zero: "لا طلاب",
  one: "طالب واحد",
  two: "طالبان",
  few: "طلاب",
  many: "طالبًا",
  other: "طالب",
};

/** Formats a count with the correct Arabic noun form, or the English plural. */
export function formatArabicCount(count: number, forms: ArabicPluralForms): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  const formatted = arabicNumber.format(safe);
  switch (arabicRules.select(safe)) {
    case "zero":
      return forms.zero;
    case "one":
      return forms.one;
    case "two":
      return forms.two;
    case "few":
      return `${formatted} ${forms.few}`;
    case "many":
      return `${formatted} ${forms.many}`;
    default:
      return `${formatted} ${forms.other}`;
  }
}

/** English counterpart used by EN screens (singular/plural only). */
export function formatEnglishCount(count: number, singular: string, plural = `${singular}s`): string {
  const safe = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;
  return `${new Intl.NumberFormat("en").format(safe)} ${safe === 1 ? singular : plural}`;
}

/** Locale-aware count helper so a component never re-implements plural rules. */
export function formatCount(
  locale: "ar" | "en",
  count: number,
  forms: ArabicPluralForms,
  english: { singular: string; plural?: string },
): string {
  return locale === "en"
    ? formatEnglishCount(count, english.singular, english.plural)
    : formatArabicCount(count, forms);
}
