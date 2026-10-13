import {validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";
const label=(value:string)=>value.replace(/[\[\]\\<>\r\n]/g," ").trim();
/** Carry actual retrieved evidence into a document; never invent sources. */
export function documentWithResearch(text:string,research:unknown,language:"ar"|"en",format:string):string{
 if(format!=="pdf"&&format!=="docx")return text;
 const data=validatedResearch(research);
 if(data?.status!=="complete"||!data.sources.length)return text;
 const referenced=text.replace(/\[(\d{1,2})\](?!\()/g,(marker,id)=>{
  const source=data.sources.find(s=>s.id===Number(id));
  return source?`[${id}](<${source.url}>)`:marker;
 });
 const missing=data.sources.filter(s=>!referenced.includes(s.url));
 if(!missing.length)return referenced;
 const note=data.reason==="encyclopedia_background"
  ?language==="ar"?"مراجع موسوعية عامة من ويكيبيديا؛ لا تتحقق من الأخبار أو المعلومات الحالية.":"Wikipedia background references; they do not verify news or current claims."
  :language==="ar"?"المراجع المسترجعة لا تثبت تلقائيًا كل ادعاء في المستند.":"Retrieved sources do not automatically verify every claim in this document.";
 return referenced+"\n\n## "+(language==="ar"?"المراجع المسترجعة":"Retrieved references")+"\n\n"+note+"\n\n"+
  missing.map(s=>`- [${s.id}] [${label(s.title)}](<${s.url}>) · ${label(s.domain)}`).join("\n");
}
