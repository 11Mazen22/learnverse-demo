const documentCopy=(ar:string,en:string)=>typeof document!=="undefined"&&document.documentElement.lang==="en"?en:ar;
import type {DocumentSource} from "./multi-document.ts";
async function boundedDocumentFetch(input:string,init:RequestInit={},timeout=12000){
 return fetch(input,{...init,signal:AbortSignal.any([...(init.signal?[init.signal]:[]),AbortSignal.timeout(timeout)])});
}
const originals=new Map<string,{file:File;at:number}>();
const MAX_MEMORY=32*1024*1024;
export function clearOriginalDocuments(){originals.clear();}
function prune(){
 for(const [id,item] of originals)if(Date.now()-item.at>30*60*1000)originals.delete(id);
 let size=[...originals.values()].reduce((n,v)=>n+v.file.size,0);
 for(const [id,item] of originals){if(size<=MAX_MEMORY)break;originals.delete(id);size-=item.file.size;}
}
export function stageOriginalDocument(file:File){const id=crypto.randomUUID();originals.set(id,{file,at:Date.now()});prune();return id;}
export function originalDocument(id:unknown):File|null{prune();return typeof id==="string"?originals.get(id)?.file??null:null;}
export async function retainOriginalDocuments(sources:DocumentSource[],files:File[],conversationId:string,temporary:boolean,signal?:AbortSignal){
 const capabilities=temporary?{retention:false}:await boundedDocumentFetch("/api/documents?capabilities=1",{signal},8000).then(r=>{if(!r.ok)throw Error(documentCopy("تعذّر التحقق من حفظ الملفات.","Could not verify document storage."));return r.json();});
 const uploaded:string[]=[];
 try{
  for(let i=0;i<sources.length;i++){
   const localId=crypto.randomUUID();originals.set(localId,{file:files[i],at:Date.now()});sources[i].localId=localId;
   if(capabilities.retention){
    const form=new FormData();form.set("file",files[i]);form.set("conversationId",conversationId);
    const r=await boundedDocumentFetch("/api/documents",{method:"POST",body:form,signal},85000);const body=await r.json();
    if(!r.ok)throw Error(body.error || documentCopy("تعذّر حفظ المستند الأصلي.","Could not save the original document."));
    sources[i].documentId=body.id;if(body.expiresAt)sources[i].expiresAt=body.expiresAt;sources[i].librarySaved=body.librarySaved===true;uploaded.push(body.id);
   }
  }
  prune();return uploaded;
 }catch(error){await deleteOriginalDocuments(uploaded);throw error;}
}
export async function deleteOriginalDocuments(ids:string[]){
 const results=await Promise.all(ids.map(id=>boundedDocumentFetch("/api/documents?id="+encodeURIComponent(id),{method:"DELETE"},12000)));
 if(results.some(r=>!r.ok))throw Error(documentCopy("تعذّر تنظيف بعض المستندات الأصلية. حاول حذفها من المحادثة.","Some original documents could not be cleared. Try removing them from the conversation."));
}
