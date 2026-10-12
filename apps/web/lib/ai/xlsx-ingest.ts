/**
 * Read-only, bounded XLSX ingestion from actual OOXML bytes.
 * The spreadsheet is user-provided UNTRUSTED source data; never execute formulas.
 */
import {inspectOfficeArtifact} from "./studio-file-inspect.ts";
export const MAX_XLSX_BYTES=6*1024*1024;
const XLSX_MIME="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export function isXlsxDocument(file:{name:string;type:string}):boolean{
 const mime=file.type.split(";")[0].trim().toLowerCase();
 return /\.xlsx$/i.test(file.name)&&(mime===""||mime===XLSX_MIME||mime==="application/octet-stream");
}
export async function extractXlsxDocument(file:{
 name:string;type:string;size:number;arrayBuffer():Promise<ArrayBuffer>
},maxCharacters=120000):Promise<{excerpt:string;truncated:boolean}>{
 if(!isXlsxDocument(file)||file.size<100||file.size>MAX_XLSX_BYTES)
  throw Error("Unsupported or oversized Excel workbook");
 const buffer=await file.arrayBuffer();
 if(buffer.byteLength!==file.size)throw Error("Workbook size changed while reading");
 const bytes=new Uint8Array(buffer);
 if(bytes[0]!==80||bytes[1]!==75||bytes[2]!==3||bytes[3]!==4)
  throw Error("XLSX must be an actual Office ZIP package");
 const result=await inspectOfficeArtifact(bytes,"xlsx");
 let truncated=result.partial||result.pages.length>6,remaining=Math.min(120000,Math.max(1,maxCharacters));
 const pieces:string[]=[];
 // Preview limits are intentional: 6 sheets, 60 rows/sheet and 14 columns.
 // A formula is an expression, not a verified calculated value.
 for(const page of result.pages.slice(0,6)){
  if(remaining<100){truncated=true;break;}
  const rows=(page.table??[]),shown=rows.slice(0,60);
  if(!rows.length)continue;
  if(rows.length>60||rows.some(row=>row.length>14))truncated=true;
  const clean=(raw:string)=>raw.replace(/[\u0000-\u001f|]/g,ch=>ch==="|"?"\\|":" ").slice(0,240);
  const matrix=shown.map(row=>row.slice(0,14).map(cell=>clean(String(cell))));
  const count=Math.max(1,...matrix.map(r=>r.length));
  const rowText=matrix.map((cells,i)=>{
   const line="| "+Array.from({length:count},(_,j)=>cells[j]??"").join(" | ")+" |";
   return i===0?line+"\n| "+Array(count).fill("---").join(" | ")+" |":line;
  });
  const block="## Worksheet: "+page.title.replace(/[\r\n<>]/g," ").slice(0,80)+"\n"+rowText.join("\n");
  if(block.length>remaining){pieces.push(block.slice(0,remaining));truncated=true;break;}
  pieces.push(block);remaining-=block.length;
 }
 const excerpt=pieces.join("\n\n").trim();
 if(!excerpt)throw Error("The Excel workbook has no readable cells");
 // Never assert that Excel calculated formulas were evaluated.
 return {excerpt:excerpt+"\n\n[Workbook values are extracted from source cells; formulas were not recalculated.]",truncated};
}
