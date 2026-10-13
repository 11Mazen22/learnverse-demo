import {documentApiBody} from "@/lib/ai/document-api-copy";
import {isSameOriginMutation} from "@/lib/ai/request-origin";
import {createClient} from "@/lib/supabase/server";
import {DOCUMENT_BUCKET,UUID,documentFormat,documentPath,isOwnerDocumentPath,validDocumentBytes} from "@/lib/ai/document-storage";

const enabled=()=>process.env.NOATA_DOCUMENT_STORAGE_ENABLED==="true";
const response=(request:Request,body:unknown,status=200)=>Response.json(documentApiBody(body,request.headers),{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(request:Request){
  const url=new URL(request.url);
  if(url.searchParams.has("capabilities"))return response(request,{retention:enabled(),library:true});
  if(!enabled())return response(request,{error:"حفظ المستندات غير مفعّل في هذه البيئة."},503);
  const id=url.searchParams.get("id");if(!id || !UUID.test(id))return response(request,{error:"مستند غير صالح."},400);
  const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return response(request,{error:"سجّل الدخول."},401);
  const {data:file,error}=await db.from("ai_document_files").select("*").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(error)return response(request,{error:"تعذّر قراءة المستند."},503);
  if(!file || (!file.library_saved&&!file.conversation_id) || !isOwnerDocumentPath(file.storage_path,user.id))return response(request,{error:"المستند غير متاح."},404);
  if(!file.library_saved&&new Date(file.expires_at)<=new Date())return response(request,{error:"انتهت مدة حفظ المستند."},410);
  const seconds=file.library_saved?60:Math.min(60,Math.floor((new Date(file.expires_at).getTime()-Date.now())/1000));
  if(seconds<1)return response(request,{error:"انتهت مدة حفظ المستند."},410);
  const signed=await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(file.storage_path,seconds,{download:file.name});
  if(signed.error)return response(request,{error:"تعذّر فتح المستند."},503);
  return response(request,{url:signed.data.signedUrl,name:file.name,mime:file.mime_type,expiresIn:seconds});
}
export async function POST(request:Request){
  if(!isSameOriginMutation(request))return response(request,{error:"طلب غير مسموح."},403);
  if(!enabled())return response(request,{error:"حفظ المستندات غير مفعّل في هذه البيئة."},503);
  const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return response(request,{error:"سجّل الدخول."},401);
  try{
    const reader=request.body?.getReader();if(!reader)return response(request,{error:"ملف فارغ."},400);
    const chunks:Uint8Array[]=[];let size=0;
    for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>9*1024*1024){await reader.cancel();return response(request,{error:"الملف كبير جدًا."},413);}chunks.push(part.value);}
    const body=new Uint8Array(size);let pos=0;for(const chunk of chunks){body.set(chunk,pos);pos+=chunk.length;}
    const form=await new Response(body,{headers:{"Content-Type":request.headers.get("Content-Type")??""}}).formData();
    const file=form.get("file"), conversationId=form.get("conversationId");
    if(!(file instanceof File) || typeof conversationId!=="string" || !UUID.test(conversationId))return response(request,{error:"مرفق غير صالح."},400);
    const format=documentFormat(file.name);if(!format || file.size>format.max || file.size<1)return response(request,{error:"صيغة أو حجم غير مدعوم."},400);
    const bytes=new Uint8Array(await file.arrayBuffer());if(!validDocumentBytes(file.name,bytes))return response(request,{error:"محتوى الملف غير صالح."},400);
    const conversation=await db.from("ai_conversations").select("id").eq("id",conversationId).eq("user_id",user.id).maybeSingle();
    if(conversation.error)return response(request,{error:"تعذّر التحقق من المحادثة."},503);
    if(!conversation.data)return response(request,{error:"المحادثة غير متاحة."},404);
    // Limit per conversation before accepting another expensive storage operation.
    const count=await db.from("ai_document_files").select("id",{count:"exact",head:true}).eq("conversation_id",conversationId);
    if(count.error)return response(request,{error:"تعذّر التحقق من حدود الرفع."},503);
    if((count.count??0)>=40)return response(request,{error:"الحد الأقصى ٤٠ مستندًا لكل محادثة."},429);
    const id=crypto.randomUUID(),path=documentPath(user.id,conversationId,id,file.name);
    const record=await db.from("ai_document_files").insert({id,user_id:user.id,conversation_id:conversationId,name:file.name.slice(0,120),storage_path:path,mime_type:format.mime,size_bytes:file.size,library_saved:true}).select("expires_at").single();
    if(record.error)return response(request,{error:"تعذّر تسجيل المستند أو تجاوزت مساحة حسابك."},503);
    const upload=await db.storage.from(DOCUMENT_BUCKET).upload(path,bytes,{contentType:format.mime,upsert:false});
    if(upload.error){await db.from("ai_document_files").delete().eq("id",id).eq("user_id",user.id);return response(request,{error:"تعذّر حفظ المستند الأصلي."},503);}
    return response(request,{id,librarySaved:true},201);
  }catch{return response(request,{error:"تعذّر قراءة المرفق."},400);}
}
export async function DELETE(request:Request){
  if(!isSameOriginMutation(request))return response(request,{error:"طلب غير مسموح."},403);
  if(!enabled())return response(request,{error:"حفظ المستندات غير مفعّل في هذه البيئة."},503);
  const params=new URL(request.url).searchParams,id=params.get("id"),conversationId=params.get("conversationId");
  if((!id&&!conversationId)||(id&&!UUID.test(id))||(conversationId&&!UUID.test(conversationId)))return response(request,{error:"طلب غير صالح."},400);
  const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return response(request,{error:"سجّل الدخول."},401);
  let query=db.from("ai_document_files").select("id,storage_path").eq("user_id",user.id);
  query=id?query.eq("id",id):query.eq("conversation_id",conversationId!).eq("library_saved",false);
  const rows=await query;if(rows.error)return response(request,{error:"تعذّر قراءة المستندات."},503);
  const files=rows.data??[];if(files.some(f=>!isOwnerDocumentPath(f.storage_path,user.id)))return response(request,{error:"طلب غير مسموح."},403);
  if(files.length){
    const deleted=await db.storage.from(DOCUMENT_BUCKET).remove(files.map(f=>f.storage_path));
    if(deleted.error)return response(request,{error:"تعذّر حذف الملفات. لم تُحذف سجلاتها؛ حاول مرة أخرى."},503);
    const records=await db.from("ai_document_files").delete().in("id",files.map(f=>f.id)).eq("user_id",user.id);
    if(records.error)return response(request,{error:"حُذفت الملفات لكن تعذّر تنظيف سجلاتها."},503);
  }
  return response(request,{deleted:files.length});
}
