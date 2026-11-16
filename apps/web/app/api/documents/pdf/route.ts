import {isSameOriginMutation} from "@/lib/ai/request-origin";
import {createClient} from "@/lib/supabase/server";
import {renderNoataPdf, PdfBusyError} from "@/lib/ai/pdf-renderer";
import {admitPdfRequest, readPdfInput, PdfRequestError} from "@/lib/ai/pdf-request";
import {localizedMessage, requestLocale, type RequestLocale} from "@/lib/i18n/request-locale";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Error body carries both messages so clients and logs stay locale-honest. */
function failure(
  locale: RequestLocale,
  arabic: string,
  english: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return Response.json(
    {error: localizedMessage(locale, arabic, english), errorAr: arabic, errorEn: english, ...extra},
    {status},
  );
}

export async function POST(request: Request) {
  const locale = requestLocale(request.headers);
  if (!isSameOriginMutation(request))
    return failure(locale, "طلب غير مسموح.", "This request origin is not allowed.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return failure(locale, "صيغة غير مدعومة.", "Unsupported content type.", 415);
  const supabase = await createClient();
  const {data:{user}, error} = await supabase.auth.getUser();
  if(error || !user)
    return failure(locale, "سجّل دخولك لتصدير المستند.", "Sign in again to export the document.", 401);
  if(!admitPdfRequest(user.id))
    return Response.json(
      {
        error: localizedMessage(
          locale,
          "يمكنك إنشاء ثلاثة مستندات في الدقيقة. حاول بعد قليل.",
          "You can create three documents per minute. Try again shortly.",
        ),
        errorAr: "يمكنك إنشاء ثلاثة مستندات في الدقيقة. حاول بعد قليل.",
        errorEn: "You can create three documents per minute. Try again shortly.",
      },
      {status: 429, headers: {"Retry-After": "60"}},
    );
  try {
    const input = await readPdfInput(request);
    const output=await renderNoataPdf(input.text,input.title?.trim() || "Noata document",undefined,undefined,input.style,input.font);
    return new Response(Uint8Array.from(output),{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=noata-document.pdf","Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof PdfRequestError) return Response.json({error:error.message},{status:error.status});
    if(error instanceof PdfBusyError)
      return Response.json(
        {
          error: localizedMessage(locale, "التصدير مشغول حاليًا. حاول بعد قليل.", "PDF export is busy. Try again shortly."),
          errorAr: "التصدير مشغول حاليًا. حاول بعد قليل.",
          errorEn: "PDF export is busy. Try again shortly.",
        },
        {status: 429, headers: {"Retry-After": "10"}},
      );
    if(error instanceof SyntaxError)
      return failure(locale, "مستند غير صالح.", "The document payload is invalid.", 400);
    const message=error instanceof Error?error.message:"";
    const code=/ENOENT/.test(message)?"PDF_ASSET_MISSING":/font/i.test(message)?"PDF_FONT_FAILED":/timeout|timed out|closed/i.test(message)?"PDF_RENDER_TIMEOUT":"PDF_RENDER_FAILED";
    console.warn("Noata PDF export",code);
    return failure(
      locale,
      "تعذّر إنشاء PDF. يمكنك تنزيل Word أو Markdown والمحاولة لاحقًا.",
      "Could not create the PDF. Download Word or Markdown instead and try again later.",
      503,
      {code},
    );
  }
}
