/** Preserve real structured results without inventing output for a missing payload. */
export function toolOutputText(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["translation", "poem", "text", "content"]) {
      if (typeof record[key] === "string" && record[key].trim())
        return record[key];
    }
    if (Object.keys(record).length)
      return "```json\n" + JSON.stringify(value, null, 2) + "\n```";
  }
  throw Error("Empty tool output");
}
