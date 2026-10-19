export type CsvCell = string | number | boolean | null | undefined;

/** Serialize CSV with UTF-8 BOM, CRLF rows and spreadsheet-formula injection protection for text cells. */
export function serializeCsv(
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  const escapeCell = (value: CsvCell): string => {
    let text = value == null ? "" : String(value);
    if (typeof value === "string" && /^[\s]*[=+\-@]/u.test(text)) {
      text = `'${text}`;
    }
    if (/[",\r\n]/u.test(text)) return `"${text.replace(/"/gu, '""')}"`;
    return text;
  };
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n")}\r\n`;
}

/**
 * Produce an ASCII-only filename so the download works on every browser and
 * filesystem without leaking path separators. Arabic job titles intentionally
 * fall back to a readable default instead of an empty filename.
 */
export function csvDownloadFilename(filename: string): string {
  const safe = filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/gu, "-")
    .replace(/^[-.]+|[-.]+$/gu, "");
  const base = safe || "noata-export";
  return base.toLowerCase().endsWith(".csv") ? base : `${base}.csv`;
}

/** Download a CSV file from an explicit user interaction in a browser. */
export function downloadCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): boolean {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return false;
  const blob = new Blob([serializeCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = objectUrl;
    link.download = csvDownloadFilename(filename);
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    return true;
  } finally {
    link.remove();
    // Keep the object URL alive until the browser has started the download.
    // Revoking it synchronously can cancel the transfer in Safari.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}
