import {isSameOriginMutation} from "@/lib/ai/request-origin";
import {createClient} from "@/lib/supabase/server";
import {admitPdfRequest} from "@/lib/ai/pdf-request";
import {renderNoataPdf,PdfBusyError} from "@/lib/ai/pdf-renderer";
import {validateResponseUi} from "../../../../../../supabase/functions/noata-ai/response-ui.ts";
export const runtime="nodejs";
export const maxDuration=60;
export const dynamic="force-dynamic";
function fail(status:number,message:string){return Response.json({error:message},{status,headers:{"Cache-Control":"no-store"}});}
export async function POST(request:Request){
 if(!isSameOriginMutation(request))return fail(403,"Cross-origin request forbidden");
 if(!request.headers.get("content-type")?.startsWith("application/json"))return fail(415,"Expected JSON");
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)return fail(401,"Sign in to create a chart PDF");
 if(!admitPdfRequest(user.id))return fail(429,"PDF export limit reached");
 const reader=request.body?.getReader();if(!reader)return fail(400,"Missing chart");
 let bytes=0,raw="";
 const decoder=new TextDecoder();
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   bytes+=value.byteLength;if(bytes>16000){await reader.cancel();return fail(413,"Chart payload too large");}
   raw+=decoder.decode(value,{stream:true});
  }
  raw+=decoder.decode();
 }finally{reader.releaseLock();}
 let payload:unknown;
 try{payload=JSON.parse(raw);}catch{return fail(400,"Invalid chart request");}
 if(!payload||typeof payload!=="object")return fail(400,"Invalid chart");
 const value=validateResponseUi((payload as {chart?:unknown}).chart);
 if(!value||value.type!=="line_chart")return fail(422,"Valid numeric line chart required");
 try{
  const title=value.title.slice(0,120);
  const report=await renderNoataPdf("The chart and its underlying observations are included below.",title,undefined,value);
  if(report.length<100||String.fromCharCode(...report.slice(0,4))!=="%PDF")throw Error("Invalid PDF output");
  return new Response(Uint8Array.from(report),{headers:{
   "Content-Type":"application/pdf","Content-Disposition":'attachment; filename="noata-line-chart.pdf"',
   "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"
  }});
 }catch(e){
  if(e instanceof PdfBusyError)return fail(429,"PDF renderer is currently busy");
  console.warn("Chart PDF generation failed",e instanceof Error?e.name:"unknown");
  return fail(503,"PDF chart generation failed; no file was created");
 }
}
