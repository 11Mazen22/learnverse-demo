/** First strong letter determines reading order; numbers and Markdown do not. */
export function documentDirection(text: string): "rtl" | "ltr" {
  for (const letter of text) {
    if (/[\p{Script=Arabic}\p{Script=Hebrew}]/u.test(letter)) return "rtl";
    if (/\p{L}/u.test(letter)) return "ltr";
  }
  return "ltr";
}
