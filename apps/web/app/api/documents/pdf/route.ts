import {isSameOriginMutation} from "@/lib/ai/request-origin";
import {createClient} from "@/lib/supabase/server";
import {renderNoataPdf, PdfBusyError} from "@/lib/ai/pdf-renderer";
import {admitPdfRequest, readPdfInput, PdfRequestError} from "@/lib/ai/pdf-request";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({error:"طلب غير مسموح."},{status:403});
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({error:"صيغة غير مدعومة."},{status:415});
  const supabase = await createClient();
  const {data:{user}, error} = await supabase.auth.getUser();
  if(error || !user) return Response.json({error:"سجّل دخولك لتصدير المستند."},{status:401});
  if(!admitPdfRequest(user.id))return Response.json({error:"يمكنك إنشاء ثلاثة مستندات في الدقيقة. حاول بعد قليل."},{status:429,headers:{"Retry-After":"60"}});
  try {
    const input = await readPdfInput(request);
    const output=await renderNoataPdf(input.text,input.title?.trim() || "مستند Noata");
    return new Response(Uint8Array.from(output),{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=noata-document.pdf","Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof PdfRequestError) return Response.json({error:error.message},{status:error.status});
    if(error instanceof PdfBusyError) return Response.json({error:"التصدير مشغول حاليًا. حاول بعد قليل."},{status:429,headers:{"Retry-After":"10"}});
    if(error instanceof SyntaxError) return Response.json({error:"مستند غير صالح."},{status:400});
    return Response.json({error:"تعذّر إنشاء PDF. يمكنك تنزيل Word أو Markdown والمحاولة لاحقًا."},{status:503});
  }
}
