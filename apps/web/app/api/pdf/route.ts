import {createClient} from "@/lib/supabase/server";
import {isSameOriginMutation} from "@/lib/ai/request-origin";
import {admitPdfRequest, readPdfInput, PdfRequestError} from "@/lib/ai/pdf-request";
import {acquirePdfSlot, PdfBusyError} from "@/lib/ai/pdf-pressure";
import {generateArabicPdf} from "@/lib/pdf/arabic-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fail(status: number, message: string, retryAfter?: string) {
  return Response.json({error: message}, {status, headers: {
    "Cache-Control": "private, no-store",
    ...(retryAfter ? {"Retry-After": retryAfter} : {}),
  }});
}

/** Optional text PDF. Authenticated; no remote resources, persistence or silent renderer changes. */
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return fail(403, "طلب غير مسموح.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail(415, "صيغة غير مدعومة.");
  try {
    const supabase = await createClient();
    const {data: {user}, error} = await supabase.auth.getUser();
    if (error || !user) return fail(401, "سجّل دخولك لتصدير المستند.");
    if (!admitPdfRequest(user.id)) return fail(429, "يمكنك إنشاء ثلاثة مستندات في الدقيقة. حاول بعد قليل.", "60");
    const input = await readPdfInput(request, "markdown");
    const release = acquirePdfSlot();
    try {
      const {bytes, pageCount} = await generateArabicPdf({title: input.title?.trim() || "مستند Noata", markdown: input.text, author: "Noata"});
      if (bytes.byteLength > 15 * 1024 * 1024) return fail(413, "المستند الناتج أكبر من الحد المسموح.");
      return new Response(Uint8Array.from(bytes), {headers: {
        "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=noata-document-text.pdf",
        "Cache-Control": "private, no-store", "X-Noata-Pages": String(pageCount), "X-Content-Type-Options": "nosniff",
      }});
    } finally { release(); }
  } catch (error) {
    if (error instanceof PdfRequestError) return fail(error.status, error.message);
    if (error instanceof PdfBusyError) return fail(429, "التصدير مشغول حاليًا. حاول بعد قليل.", "10");
    if (error instanceof SyntaxError) return fail(400, "مستند غير صالح.");
    if (error instanceof Error && /maximum PDF length|PDF layout limit/.test(error.message))
      return fail(422, "هذا المستند يتجاوز تنسيق PDF النصي. جرّب تنزيل PDF الأساسي أو Word.");
    return fail(503, "تعذّر إنشاء PDF النصي. يمكنك تنزيل PDF الأساسي أو Word.");
  }
}
