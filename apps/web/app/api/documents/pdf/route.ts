import {isSameOriginMutation} from "@/lib/ai/request-origin";
import {createClient} from "@/lib/supabase/server";
import {validatePdfInput} from "@/lib/ai/pdf-export";
import {renderNoataPdf, PdfBusyError} from "@/lib/ai/pdf-renderer";

export const runtime = "nodejs";
export const maxDuration = 60;
const attempts=new Map<string,number[]>();
function admit(userId:string){
  const now=Date.now();
  for(const [id,times] of attempts)if(times.every(t=>t<now-60_000))attempts.delete(id);
  if(attempts.size>=5000 && !attempts.has(userId))return false;
  const recent=(attempts.get(userId)??[]).filter(t=>t>now-60_000);
  if(recent.length>=3)return false;
  attempts.set(userId,[...recent,now]);return true;
}
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return Response.json({error:"طلب غير مسموح."},{status:403});
  if (!request.headers.get("content-type")?.startsWith("application/json")) return Response.json({error:"صيغة غير مدعومة."},{status:415});
  const supabase = await createClient();
  const {data:{user}, error} = await supabase.auth.getUser();
  if(error || !user) return Response.json({error:"سجّل دخولك لتصدير المستند."},{status:401});
  if(!admit(user.id))return Response.json({error:"يمكنك إنشاء ثلاثة مستندات في الدقيقة. حاول بعد قليل."},{status:429,headers:{"Retry-After":"60"}});
  try {
    // Bound the wire body before parsing; char limits alone don't bound JSON overhead.
    const reader=request.body?.getReader();
    if(!reader) return Response.json({error:"مستند فارغ."},{status:400});
    const parts:Uint8Array[]=[];let size=0;
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>800_000){await reader.cancel();return Response.json({error:"المستند أكبر من الحد المسموح."},{status:413});}parts.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength;}
    const input:unknown=JSON.parse(new TextDecoder().decode(bytes));
    if(!validatePdfInput(input)) return Response.json({error:"اكتب مستندًا لا يتجاوز ١٠٠٬٠٠٠ حرف."},{status:400});
    const output=await renderNoataPdf(input.text,input.title?.trim() || "مستند Noata");
    return new Response(Uint8Array.from(output),{headers:{"Content-Type":"application/pdf","Content-Disposition":"attachment; filename=noata-document.pdf","Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof PdfBusyError) return Response.json({error:"التصدير مشغول حاليًا. حاول بعد قليل."},{status:429,headers:{"Retry-After":"10"}});
    if(error instanceof SyntaxError) return Response.json({error:"مستند غير صالح."},{status:400});
    return Response.json({error:"تعذّر إنشاء PDF. يمكنك تنزيل Word أو Markdown والمحاولة لاحقًا."},{status:503});
  }
}
