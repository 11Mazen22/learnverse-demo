/** Genesis: deterministic creation requests, not a fake "AI tool" switch. */
import {hasTableData,hasSlideStructure} from "./answer-export.ts";
export type ArtifactKind="pdf"|"docx"|"xlsx"|"pptx";
export type ArtifactIntent={kind:ArtifactKind;usePrevious:boolean};
export function detectArtifactIntent(prompt:string):ArtifactIntent|null{
 const q=prompt.trim();
 if(!q||q.length>4000)return null;
 if(/^(?:(?:how|why|what|explain|teach|tutorial)\b|(?:ازاي|إزاي|كيف|اشرح)(?:\s|$))/i.test(q))return null;
 if(!/\b(?:make|create|generate|export|convert|prepare|download|save|produce|give me|turn)\b|(?:اعمل|اصنع|أنشئ|جهز|حوّل|حول|صمم|نزّل|صدّر|اعمللي)/i.test(q))return null;
 const formats:ArtifactKind[]=[];
 if(/\bpdf\b|بي دي اف|بي دي إف/i.test(q))formats.push("pdf");
 if(/\bdocx\b|\bword (?:document|file)\b|ملف ورد|ملف وورد/i.test(q))formats.push("docx");
 if(/\bxlsx\b|\bexcel\b|\bspreadsheet\b|إكسل|اكسل/i.test(q))formats.push("xlsx");
 if(/\bpptx\b|\bpowerpoint\b|\bpresentation\b|بوربوينت|باوربوينت|عرض تقديمي/i.test(q))formats.push("pptx");
 if(formats.length!==1)return null;
 const usePrevious=/\b(?:that|this|above|previous|earlier|last answer)\b|(?:ده|دا|دي|هذا|ذلك|اللي فوق|الرد السابق|الإجابة السابقة)/i.test(q);
 return {kind:formats[0],usePrevious};
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
