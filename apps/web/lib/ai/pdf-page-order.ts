/** Parse the complete original-page permutation used by the PDF page editor. */
export function parsePdfPageOrder(text: string, count: number): number[] {
  if (text.length > 1200 || !Number.isInteger(count) || count < 1 || count > 200) {
    throw Error("pdf_page_order_invalid");
  }
  const normalized = text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    const zero = code >= 0x06f0 && code <= 0x06f9 ? 0x06f0 : 0x0660;
    return String(code - zero);
  });
  const parts = normalized.trim().split(/[,،\s]+/).filter(Boolean);
  const order = parts.map((part) => /^\d+$/.test(part) ? Number(part) : NaN);
  if (
    order.length !== count ||
    new Set(order).size !== count ||
    order.some((page) => !Number.isInteger(page) || page < 1 || page > count)
  ) {
    throw Error("pdf_page_order_invalid");
  }
  return order;
}

/** UI-safe validator for an exact, complete, no-duplicates page permutation. */
export function isPdfPageOrderValid(text: string, count: number): boolean {
  try {
    parsePdfPageOrder(text, count);
    return true;
  } catch {
    return false;
  }
}
