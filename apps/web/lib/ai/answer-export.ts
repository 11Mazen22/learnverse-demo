/** Honest export availability for Noata AI answers. */
export type AnswerFormat="pdf"|"docx"|"xlsx"|"pptx"|"markdown";
export function answerExportFormats(content:string):AnswerFormat[]{
 const text=content.trim();
 if(!text||text.length>200000)return [];
 const formats:AnswerFormat[]=["markdown"];
 if(text.length<=100000)formats.unshift("pdf");
 if(text.length<=180000)formats.push("docx");
 if(text.length<=120000 && hasTableData(text))formats.push("xlsx");
 if(text.length<=30000 && hasSlideStructure(text))formats.push("pptx");
 return formats;
}
export function hasTableData(text:string):boolean{
 const lines=text.split(/\r?\n/).filter(x=>x.trim()).slice(0,100);
 if(lines.length<2)return false;
 const markdown=lines.some((line,i)=>/^\s*\|.*\|\s*$/.test(line)&&/^\s*\|[\s|:\-]+\|\s*$/.test(lines[i+1]??""));
 const separated=lines.some((line,i)=>i+1<lines.length && (line.includes("\t")&&lines[i+1].includes("\t") ||
  (line.includes(",")&&lines[i+1].includes(",")&&line.split(",").length>=2)));
 return markdown||separated;
}
export function hasSlideStructure(text:string):boolean{
 return /(?:^|\n)#{1,3}\s+\S/m.test(text)||/(?:^|\n)\s*---\s*(?:\n|$)/.test(text);
}
export function safeExportStem(title:string){
 const cleaned=title.normalize("NFKC").replace(/[\\/:*?"<>|\x00-\x1f]/g,"").replace(/\s+/g,"-").slice(0,65).replace(/^[-.]+|[-.]+$/g,"");
 return cleaned||"noata-answer";
}
