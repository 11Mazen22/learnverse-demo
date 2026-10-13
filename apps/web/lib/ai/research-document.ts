import {validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";
const label=(value:string)=>value.replace(/[\[\]\\<>\r\n]/g," ").trim();
/** Carry actual retrieved evidence into a document; never invent sources. */
export function documentWithResearch(text:string,research:unknown,language:"ar"|"en",format:string):string{
 if(format!=="pdf"&&format!=="docx")return text;
 const data=validatedResearch(research);
 if(data?.status!=="complete"||!data.sources.length)return text;
 const bibliography=data.sources.map(s=>`- **[${s.id}] ${label(s.title)}** · ${label(s.domain)}\n  ${s.url}`).join("\n");
 if(text.includes(bibliography))return text;
 const referenced=text.replace(/\[(\d{1,2})\](?!\()/g,(marker,id)=>{
  const source=data.sources.find(s=>s.id===Number(id));
  return source?`[${id}](<${source.url}>)`:marker;
 });
 const note=data.reason==="encyclopedia_background"
  ?language==="ar"?"مراجع موسوعية عامة من ويكيبيديا؛ لا تتحقق من الأخبار أو المعلومات الحالية.":"Wikipedia background references; they do not verify news or current claims."
  :language==="ar"?"المراجع المسترجعة لا تثبت تلقائيًا كل ادعاء في المستند.":"Retrieved sources do not automatically verify every claim in this document.";
 // PDF rendering intentionally removes link actions. Keep every source URL visible as text,
 // including sources already linked inline, so exported citations remain usable offline.
 return referenced+"\n\n## "+(language==="ar"?"المراجع المسترجعة":"Retrieved references")+"\n\n"+note+"\n\n"+
  bibliography;
}
