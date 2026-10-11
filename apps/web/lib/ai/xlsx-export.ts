import {packageZip} from "./docx-export.ts";
const esc=(s:string)=>s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const header='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const rel='http://schemas.openxmlformats.org/package/2006/relationships';
const docrel='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const xlsx='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
function col(index:number){let v=index+1,s="";while(v){v--;s=String.fromCharCode(65+v%26)+s;v=Math.floor(v/26);}return s;}
export function parseNoataData(text:string):string[][]{
 if(text.length>120000)throw Error("Source too long");
 const lines=text.replace(/\r\n?/g,"\n").split("\n").filter(x=>x.trim());
 const tables=lines.filter(x=>/^\s*\|.*\|\s*$/.test(x));
 if(tables.length>=2){
  const cells=tables.map(x=>x.trim().replace(/^\||\|$/g,"").split("|").map(y=>y.trim()));
  return cells.filter(row=>!row.every(y=>/^:?-{3,}:?$/.test(y)));
 }
 // Tab / CSV: deterministic lines only, no external execution.
 if(lines.length>1&&lines.slice(0,2).some(x=>x.includes("\t")||x.includes(","))){
  const sep=lines[0].includes("\t")?"\t":",";
  return lines.map(x=>{const result:string[]=[];let value="",quoted=false;
   for(let i=0;i<x.length;i++){
    if(x[i]==='"'){if(quoted&&x[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}
    else if(x[i]===sep&&!quoted){result.push(value.trim());value="";}else value+=x[i];
   }result.push(value.trim());return result;});
 }
 return [[ "Noata AI", "Content" ], ...lines.map((line,i)=>[String(i+1),line.replace(/^#{1,6}\s+/,"")])];
}
export function createNoataXlsx(source:string):Uint8Array{
 const matrix=parseNoataData(source);
 if(matrix.length===0||matrix.length>1000||matrix.some(row=>row.length>26))throw Error("Spreadsheet dimensions exceed limits");
 const rows=matrix.map((values,r)=>'<row r="'+(r+1)+'">'+values.map((v,c)=>{
  const value=v.slice(0,32767),reference=col(c)+(r+1);
  const formula=/^=(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-Z]{1,2}[1-9]\d{0,3}):([A-Z]{1,2}[1-9]\d{0,3})\)$/i.test(value);
  if(formula)return '<c r="'+reference+'"><f>'+esc(value.slice(1))+'</f></c>';
  const numeric=r>0&&/^[-+]?\d{1,12}(?:\.\d{1,8})?$/.test(value)&&Number.isFinite(Number(value));
  return numeric?'<c r="'+reference+'"><v>'+Number(value)+'</v></c>':
    '<c r="'+reference+'" t="inlineStr"><is><t xml:space="preserve">'+esc(value)+'</t></is></c>';
 }).join("")+'</row>').join("");
 const sheet=header+'<worksheet xmlns="'+xlsx+'"><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="20"/><sheetData>'+rows+'</sheetData></worksheet>';
 const book=header+'<workbook xmlns="'+xlsx+'" xmlns:r="'+docrel+'"><bookViews><workbookView/></bookViews><sheets><sheet name="Noata" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
 const manifest=header+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
 return packageZip({
  "[Content_Types].xml":manifest,
  "_rels/.rels":header+'<Relationships xmlns="'+rel+'"><Relationship Id="rId1" Type="'+docrel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  "xl/workbook.xml":book,
  "xl/_rels/workbook.xml.rels":header+'<Relationships xmlns="'+rel+'"><Relationship Id="rId1" Type="'+docrel+'/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
  "xl/worksheets/sheet1.xml":sheet
 });
}
export function downloadNoataXlsx(source:string,filename="noata-data.xlsx"){
 const bytes=createNoataXlsx(source);
 const href=URL.createObjectURL(new Blob([Uint8Array.from(bytes)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
 const a=document.createElement("a");a.href=href;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(href),15000);
}
