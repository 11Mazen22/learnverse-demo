import {validatePdfInput} from "./pdf-export.ts";

export class PdfRequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

/** Both export formats share the same per-instance admission budget. */
export function createPdfAdmission(now = Date.now) {
  const attempts = new Map<string, number[]>();
  return (userId: string) => {
    const time = now();
    for (const [id, times] of attempts)
      if (times.every(t => t <= time - 60_000)) attempts.delete(id);
    if (attempts.size >= 5000 && !attempts.has(userId)) return false;
    const recent = (attempts.get(userId) ?? []).filter(t => t > time - 60_000);
    if (recent.length >= 3) return false;
    attempts.set(userId, [...recent, time]);
    return true;
  };
}
export const admitPdfRequest = createPdfAdmission();

/** Bound actual wire bytes before JSON parsing, including chunked or misdeclared bodies. */
export async function readPdfInput(request: Request, field: "text" | "markdown" = "text") {
  const reader = request.body?.getReader();
  if (!reader) throw new PdfRequestError(400, "مستند فارغ.");
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 800_000) {
        await reader.cancel();
        throw new PdfRequestError(413, "المستند أكبر من الحد المسموح.");
      }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  const raw: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!raw || typeof raw !== "object") throw new PdfRequestError(400, "مستند غير صالح.");
  const value = raw as Record<string, unknown>;
  const input = {text: value[field], title: value.title};
  if (!validatePdfInput(input)) throw new PdfRequestError(400, "اكتب مستندًا لا يتجاوز ١٠٠٬٠٠٠ حرف وعنوانًا لا يتجاوز ١٢٠ حرفًا.");
  return input;
}
