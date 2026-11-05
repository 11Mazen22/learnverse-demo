export type RelativeLocale = "ar" | "en";

/**
 * Bilingual relative timestamps for the dashboards ("منذ ٥ دقائق" / "5 minutes ago").
 * Arabic follows its number agreement rules (dual, 3–10 plural, 11+ singular);
 * Latin-English pluralizes normally. Everything falls back cleanly:
 * invalid input returns null from relativeTimeLabel, and localizedTimestamp
 * then returns the absolute date — or the raw value if even that cannot parse.
 */
const ABSOLUTE_LOCALE: Record<RelativeLocale, string> = {
  ar: "ar-EG",
  en: "en",
};

function absoluteLabel(value: string, locale: RelativeLocale): string {
  return new Date(value).toLocaleString(ABSOLUTE_LOCALE[locale]);
}

/** Stable absolute presentation used by tooltips and as the fallback form. */
export function absoluteTimeLabel(value: string, locale: RelativeLocale): string {
  return Number.isFinite(Date.parse(value)) ? absoluteLabel(value, locale) : "";
}

const AR_NOUN_FORMS = {
  minute: { one: "دقيقة", two: "دقيقتين", few: "دقائق", many: "دقيقة" },
  hour: { one: "ساعة", two: "ساعتين", few: "ساعات", many: "ساعة" },
  day: { one: "يوم", two: "يومين", few: "أيام", many: "يوم" },
} as const;

type ArUnit = keyof typeof AR_NOUN_FORMS;

function arabicCountArabicNoun(n: number, unit: ArUnit): string {
  const forms = AR_NOUN_FORMS[unit];
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const noun = n >= 3 && n <= 10 ? forms.few : forms.many;
  return `${new Intl.NumberFormat("ar-EG").format(n)} ${noun}`;
}

function arabicPhrase(n: number, unit: ArUnit, ahead: boolean): string {
  const mark = ahead ? "في " : "منذ ";
  return (n === 1 ? `${mark}${AR_NOUN_FORMS[unit].one}` : `${mark}${arabicCountArabicNoun(n, unit)}`);
}

const EN_UNITS = { minute: "minute", hour: "hour", day: "day" } as const;

function englishPhrase(n: number, unit: keyof typeof EN_UNITS, ahead: boolean): string {
  const noun = EN_UNITS[unit] + (n === 1 ? "" : "s");
  return ahead ? `in ${n} ${noun}` : `${n} ${noun} ago`;
}

/**
 * Relative label for a timestamp versus `now`, or null when the value is not a
 * parseable date or sits more than a week away (older data shows absolute).
 */
export function relativeTimeLabel(
  value: string,
  locale: RelativeLocale,
  now: Date = new Date(),
): string | null {
  const instant = Date.parse(value);
  if (!Number.isFinite(instant)) return null;
  const seconds = Math.abs(instant - now.getTime()) / 1000;
  const ahead = instant > now.getTime();
  if (seconds < 45) return locale === "ar" ? "الآن" : "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return locale === "ar" ? arabicPhrase(minutes, "minute", ahead) : englishPhrase(minutes, "minute", ahead);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return locale === "ar" ? arabicPhrase(hours, "hour", ahead) : englishPhrase(hours, "hour", ahead);
  const days = Math.round(hours / 24);
  if (days <= 7) return locale === "ar" ? arabicPhrase(days, "day", ahead) : englishPhrase(days, "day", ahead);
  return null;
}

/** Relative label with a guaranteed string result: relative, then absolute. */
export function localizedTimestamp(
  value: string,
  locale: RelativeLocale,
  now: Date = new Date(),
): string {
  const relative = relativeTimeLabel(value, locale, now);
  if (relative) return relative;
  return Number.isFinite(Date.parse(value)) ? absoluteLabel(value, locale) : value;
}
