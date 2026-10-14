/**
 * Qur'an verse seals always display Eastern Arabic digits, independently of
 * the surrounding UI locale. The verse source itself is never modified.
 */
const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toArabicIndicVerseNumber(number: number): string {
  if (!Number.isInteger(number) || number < 1 || number > 286) {
    throw new RangeError("Invalid Quran verse number");
  }
  return String(number).replace(/[0-9]/g, digit => EASTERN_ARABIC_DIGITS[Number(digit)]);
}
