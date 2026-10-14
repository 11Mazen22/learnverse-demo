/** Genesis: deterministic creation requests, not a fake "AI tool" switch. */
import {searchPlan} from "../../../../supabase/functions/noata-ai/research.ts";
import {hasTableData,hasSlideStructure} from "./answer-export.ts";
export type ArtifactKind="pdf"|"docx"|"xlsx"|"pptx";
export type ArtifactIntent={kind:ArtifactKind;usePrevious:boolean};
export function detectArtifactIntents(prompt:string):ArtifactIntent[]{
 const raw=prompt.trim();
 if(!raw||raw.length>25000)return [];
 // Creative Studio includes quoted source text after a known delimiter.
 // Only the user's top-level instruction may select the requested file type.
 const q=raw.split(/\n\n(?:Verified extracted original document content:|المحتوى الأصلي للملف:)\s*\n/i)[0];
 if(q.length>4000)return [];
 // Ability questions need an answer or clarification, not a downloadable
 // document containing the model's answer to "can you make PDF?".
 if(/^(?:can|could|do|does|will|are|is)\s+(?:you|noata)\s+/i.test(q)
  &&!/(?:\b(?:that|this|them|those|these|it|previous|above)\b|(?:عن|about|from|containing)\s+\S{4,})/i.test(q))return [];
 if(/^(?:هل|ممكن|تقدر|تستطيع)\s+/i.test(q)
  &&!/(?:دا|ده|السابق|عن\s+\S{4,})/i.test(q))return [];
 if(/^(?:(?:how|why|what|explain|teach|tutorial)\b|(?:ازاي|إزاي|كيف|اشرح)(?:\s|$))/i.test(q))return [];
 if(!/\b(?:make|create|recreate|rewrite|improve|revise|polish|generate|export|convert|prepare|download|save|produce|give me|turn)\b|(?:اعمل|اصنع|أنشئ|جهز|حوّل|حول|صمم|نزّل|صدّر|اعمللي|حسّن|حسن|عدّل|عدل)/i.test(q))return [];
 const formats:ArtifactKind[]=[];
 if(/\bpdf\b|بي دي اف|بي دي إف/i.test(q))formats.push("pdf");
 if(/\bdocx\b|\bword (?:document|file)\b|ملف ورد|ملف وورد/i.test(q))formats.push("docx");
 if(/\bxlsx\b|\bexcel\b|\bspreadsheet\b|إكسل|اكسل/i.test(q))formats.push("xlsx");
 if(/\bpptx\b|\bpowerpoint\b|\bpresentation\b|بوربوينت|باوربوينت|عرض تقديمي/i.test(q))formats.push("pptx");
 if(!formats.length)return [];
 const order:Record<ArtifactKind,RegExp>={pdf:/\bpdf\b|بي دي اف|بي دي إف/i,docx:/\bdocx\b|\bword (?:document|file)\b|ملف ورد|ملف وورد/i,xlsx:/\bxlsx\b|\bexcel\b|\bspreadsheet\b|إكسل|اكسل/i,pptx:/\bpptx\b|\bpowerpoint\b|\bpresentation\b|بوربوينت|باوربوينت|عرض تقديمي/i};
 formats.sort((a,b)=>q.search(order[a])-q.search(order[b]));
 const bareFollowup=/^(?:(?:now|alright|okay|ok|please)\s*[,!]?\s*)*(?:make|create|generate|export|prepare|produce)\s+(?:(?:me|the|a|an)\s+)*(?:pdf|docx|xlsx|pptx|word(?:\s+(?:document|file))?|excel(?:\s+(?:file|sheet))?|powerpoint(?:\s+(?:file|presentation))?)(?:\s+(?:file|document))?[.!?]*$/i.test(q)||/^(?:دلوقتي\s+)?(?:اعمل|جهز|أنشئ|انشئ)\s+(?:ملف\s+)?(?:PDF|بي دي اف|وورد|ورد|اكسل|بوربوينت)[.!؟]*$/i.test(q);
 const research=searchPlan(q);
 const newResearch=research.needed&&(research.reason==="explicit"||research.reason==="freshness");
 const historyReference=/\b(?:above|previous|earlier|last answer)\b|اللي فوق|الرد السابق|الإجابة السابقة/i.test(q);
 const conversionReference=/\b(?:make|create|export|convert|turn|put|save|prepare|produce)\s+(?:it|this|that|them|those|these)\b|\b(?:from|of|using|for)\s+(?:it|this|that|them|those|these)\b|(?:اعمل|جهز|أنشئ|انشئ|حول|حوّل|احفظ)\s+(?:ده|دا|دي|دول|هذه|هذا|ذلك|تلك)(?:\s|$)/i.test(q);
 // "details that still need verification" is not a reference to a previous
 // reply. A requested research phase must run before document creation.
 const usePrevious=!newResearch&&(bareFollowup||historyReference||conversionReference);
 // Studio requests contain their own quoted file contents. Never substitute a prior chat answer.
 return formats.map(kind=>({kind,usePrevious:raw===q&&usePrevious}));
}
export function detectArtifactIntent(prompt:string):ArtifactIntent|null{
 const intents=detectArtifactIntents(prompt);return intents.length===1?intents[0]:null;
}
export function artifactContent(intent:ArtifactIntent,answer:string,previous:string):string{
 return (intent.usePrevious&&previous.trim()?previous:answer).trim();
}
export function checkArtifactContent(kind:ArtifactKind,text:string):string|null{
 if(!text.trim())return "empty";
 const max=kind==="pdf"?100000:kind==="pptx"?30000:kind==="xlsx"?120000:180000;
 if(text.length>max)return "too_large";
 if(kind==="xlsx"&&!hasTableData(text))return "table_required";
 if(kind==="pptx"&&!hasSlideStructure(text))return "slides_required";
 return null;
}
export function validArtifactBytes(kind:ArtifactKind,bytes:Uint8Array):boolean{
 if(bytes.length<150||bytes.length>12582912)return false;
 if(kind==="pdf")return new TextDecoder().decode(bytes.slice(0,5))==="%PDF-";
 if(bytes[0]!==80||bytes[1]!==75||bytes[2]!==3||bytes[3]!==4)return false;
 const text=new TextDecoder().decode(bytes);
 return kind==="docx"?text.includes("word/document.xml"):kind==="xlsx"?
 text.includes("xl/workbook.xml")&&text.includes("xl/worksheets/sheet1.xml"):
 text.includes("ppt/presentation.xml")&&text.includes("ppt/slides/slide1.xml");
}
