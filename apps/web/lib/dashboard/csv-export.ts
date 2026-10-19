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

/** Download a CSV file from an explicit user interaction in a browser. */
export function downloadCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): boolean {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") return false;
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/gu, "-").replace(/^[-.]+/u, "");
  const blob = new Blob([serializeCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = safeFilename.endsWith(".csv") ? safeFilename : `${safeFilename}.csv`;
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return true;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
