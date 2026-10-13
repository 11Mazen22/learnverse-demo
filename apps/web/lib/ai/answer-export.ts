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
 if(markdown)return true;
 if(lines.length<2)return false;
 const separator=lines[0].includes("\t")?"\t":",";
 const rows=lines.map(line=>{
  const cells:string[]=[];let value="",quoted=false;
  for(let i=0;i<line.length;i++){
   const c=line[i];
   if(c==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
   else if(c===separator&&!quoted){cells.push(value.trim());value="";}else value+=c;
  }
  if(quoted)return[];cells.push(value.trim());return cells;
 });
 const width=rows[0].length;
 // Entire CSV/TSV must be rectangular with a short actual header.
 // Two comma-bearing prose paragraphs are never a spreadsheet dataset.
 return width>=2&&width<=26&&rows[0].every(cell=>cell.length>0&&cell.length<=60&&!/[.!?؟]/.test(cell))
   &&rows.every(row=>row.length===width&&row.every(cell=>cell.length<=256));
}
export function hasSlideStructure(text:string):boolean{
 return /(?:^|\n)#{1,3}\s+\S/m.test(text)||/(?:^|\n)\s*---\s*(?:\n|$)/.test(text);
}
export function safeExportStem(title:string){
 const cleaned=title.normalize("NFKC").replace(/[\\/:*?"<>|\x00-\x1f]/g,"").replace(/\s+/g,"-").slice(0,65).replace(/^[-.]+|[-.]+$/g,"");
 return cleaned||"noata-answer";
}
