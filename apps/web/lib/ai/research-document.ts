import {validatedResearch} from "../../../../supabase/functions/noata-ai/research.ts";
const label=(value:string)=>value.replace(/[\[\]\\<>\r\n]/g," ").trim();
/** Carry actual retrieved evidence into a document; never invent sources. */
export function documentWithResearch(text:string,research:unknown,language:"ar"|"en",format:string):string{
 if(!["pdf","docx","pptx","xlsx"].includes(format))return text;
 const data=validatedResearch(research);
 if(data?.status!=="complete"||!data.sources.length)return text;
 if(format==="xlsx"){
  const heading="## Sheet: "+(language==="ar"?"المراجع":"References");
  const missingSources=data.sources.filter(source=>!text.includes(source.url));
  if(!missingSources.length)return text;
  const cell=(value:string)=>label(value).replace(/\|/g," ");
  // Each reference is an actual retrieved record. No fetched timestamps are relabeled as publication dates.
  const references="| ID | Title | URL | Retrieved | Published |\n| --- | --- | --- | --- | --- |\n"+
   missingSources.map(s=>`| ${s.id} | ${cell(s.title)} | ${s.url.replaceAll("|","%7C")} | ${s.retrievedAt} | ${s.published??""} |`).join("\n");
  const markers=[...text.matchAll(/^#{1,3}\s*(?:sheet|worksheet|ورقة|ورقه)\s*:\s*.+$/gim)];
  // Existing renderer supports at most 8 sheets; preserve a full workbook unchanged rather than failing export.
  if(markers.length>=8)return text;
  const body=markers.length?text:"## Sheet: "+(language==="ar"?"البيانات":"Data")+"\n\n"+text;
  return body+"\n\n"+heading+"\n\n"+references;
 }
 const missingSources=data.sources.filter(source=>!text.includes(source.url));
 if(!missingSources.length)return text;
 const bibliography=missingSources.map(s=>`- **[${s.id}] ${label(s.title)}** · ${label(s.domain)}\n  ${s.url}`).join("\n");
 const hasReferences=/^##\s+(?:Retrieved references|المراجع المسترجعة)\s*$/m.test(text);
 const referenced=text.replace(/(?<!\*\*)\[(\d{1,2})\](?!\()/g,(marker,id)=>{
  const source=data.sources.find(s=>s.id===Number(id));
  return source?`[${id}](<${source.url}>)`:marker;
 });
 const note=data.reason==="encyclopedia_background"
  ?language==="ar"?"مراجع موسوعية عامة من ويكيبيديا؛ لا تتحقق من الأخبار أو المعلومات الحالية.":"Wikipedia background references; they do not verify news or current claims."
  :data.reason==="open_scholarly"||data.reason==="open_mixed"
  ?language==="ar"?"سجلات علمية مفتوحة ومراجع موسوعية (معلومات عامة)؛ لا تتحقق من الأخبار أو الأحداث الجارية.":"Open scholarly records and encyclopedic background; they do not verify news or current events."
  :language==="ar"?"المراجع المسترجعة لا تثبت تلقائيًا كل ادعاء في المستند.":"Retrieved sources do not automatically verify every claim in this document.";
 // PDF rendering intentionally removes link actions. Keep every source URL visible as text,
 // including sources already linked inline, so exported citations remain usable offline.
 const referencesHeading=hasReferences
  ? language==="ar"?"مراجع إضافية مسترجعة":"Additional retrieved references"
  : language==="ar"?"المراجع المسترجعة":"Retrieved references";
 return referenced+(format==="pptx"?"\n\n---":"")+"\n\n## "+referencesHeading+"\n\n"+note+"\n\n"+
  bibliography;
}
