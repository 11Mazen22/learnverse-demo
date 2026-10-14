import {spreadsheetCell,workbookFormula} from "./spreadsheet-cell.ts";
/** Noata structured Excel workbooks: bounded multi-sheet OOXML with editable formulas. */
import {packageZip} from "./docx-export.ts";
const NS="http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const REL="http://schemas.openxmlformats.org/package/2006/relationships";
const DOCREL="http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const CT="http://schemas.openxmlformats.org/package/2006/content-types";
const xml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const esc=(s:string)=>s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const col=(i:number)=>String.fromCharCode(65+i);
export type NoataSheet={name:string;rows:string[][]};
export function parseNoataSheets(text:string,parseTable:(source:string)=>string[][]):NoataSheet[]|null{
 const src=text.replace(/\r\n?/g,"\n");
 const markers=[...src.matchAll(/^#{1,3}\s*(?:sheet|worksheet|ورقة|ورقه)\s*:\s*(.+)\s*$/gim)];
 if(markers.length<2)return null;
 if(src.slice(0,markers[0].index).trim())throw Error("Multi-sheet content must begin with a sheet heading");
 if(markers.length>8)throw Error("Workbook supports up to eight worksheets");
 const names=new Set<string>();
 return markers.map((m,i)=>{
   const end=i+1<markers.length?markers[i+1].index:src.length;
   const chunk=src.slice((m.index??0)+m[0].length,end).trim();
   if(!chunk)throw Error("A worksheet is empty");
   let base=m[1].trim().replace(/[\\/:*?\[\]]/g," ").replace(/\s+/g," ").slice(0,31).trim();
   if(!base)base="Sheet "+(i+1);
   let name=base,n=1;
   while(names.has(name.toLowerCase())){n++;const suffix=" ("+n+")";name=base.slice(0,31-suffix.length)+suffix;}
   names.add(name.toLowerCase());
   const rows=parseTable(chunk);
   if(rows.length<2||rows.length>1000||rows.some(r=>r.length>26))throw Error("Worksheet requires a bounded table");
   return{name,rows};
 });
}
function styles(){
 const fonts='<fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>';
 const fills='<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF225A7A"/><bgColor indexed="64"/></patternFill></fill></fills>';
 const borders='<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>';
 const base='<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>';
 const head='<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"><alignment vertical="center" wrapText="1"/></xf>';
 return xml+'<styleSheet xmlns="'+NS+'">'+fonts+fills+borders+'<cellStyleXfs count="1">'+base+'</cellStyleXfs><cellXfs count="2">'+base+head+'</cellXfs></styleSheet>';
}
function sheetXml(rows:string[][],sheets:NoataSheet[],current:number):string{
 const count=Math.max(...rows.map(r=>r.length)),rtl=rows.slice(0,5).some(r=>r.some(v=>/[\u0600-\u06ff]/.test(v)));
 const widths=Array.from({length:count},(_,i)=>Math.min(40,Math.max(12,...rows.slice(0,70).map(r=>(r[i]??"").length+3))));
 const cols='<cols>'+widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join("")+'</cols>';
 const xmlRows=rows.map((values,r)=>{
  const cells=values.map((value,c)=>{
   const text=spreadsheetCell(value).slice(0,32767),pos=col(c)+(r+1),style=r===0?' s="1"':"";
   const formula=r>0?workbookFormula(text,sheets,current,r,c):null;
   if(formula)return '<c r="'+pos+'"'+style+'><f>'+esc(formula.formula)+'</f>'+(formula.cached===null?"":'<v>'+formula.cached+'</v>')+'</c>';
   const numeric=r>0&&/^[-+]?\d{1,12}(?:\.\d{1,8})?$/.test(text)&&Number.isFinite(Number(text));
   if(numeric)return '<c r="'+pos+'"'+style+'><v>'+Number(text)+'</v></c>';
   return '<c r="'+pos+'"'+style+' t="inlineStr"><is><t xml:space="preserve">'+esc(text)+'</t></is></c>';
  }).join("");
  return '<row r="'+(r+1)+'"'+(r===0?' ht="30" customHeight="1"':'')+'>'+cells+'</row>';
 }).join("");
 const right=rtl?' rightToLeft="1"':"";
 const view='<sheetViews><sheetView workbookViewId="0"'+right+'><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
 const filter='<autoFilter ref="A1:'+col(count-1)+rows.length+'"/>';
 return xml+'<worksheet xmlns="'+NS+'">'+view+'<sheetFormatPr defaultRowHeight="19"/>'+cols+'<sheetData>'+xmlRows+'</sheetData>'+filter+'</worksheet>';
}
export function createNoataMultiSheetXlsx(sheets:NoataSheet[]):Uint8Array{
 if(sheets.length<2||sheets.length>8)throw Error("Expected two to eight worksheets");
 const total=sheets.reduce((sum,s)=>sum+s.rows.reduce((n,r)=>n+r.length,0),0);
 if(total>25000)throw Error("Workbook has too many cells");
 const file:Record<string,string>={};
 file["xl/styles.xml"]=styles();
 file["xl/workbook.xml"]=xml+'<workbook xmlns="'+NS+'" xmlns:r="'+DOCREL+'"><bookViews><workbookView/></bookViews><sheets>'+
  sheets.map((s,i)=>'<sheet name="'+esc(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join("")+
  '</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
 file["xl/_rels/workbook.xml.rels"]=xml+'<Relationships xmlns="'+REL+'">'+
  sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="'+DOCREL+'/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join("")+
  '<Relationship Id="rId'+(sheets.length+1)+'" Type="'+DOCREL+'/styles" Target="styles.xml"/></Relationships>';
 file["_rels/.rels"]=xml+'<Relationships xmlns="'+REL+'"><Relationship Id="rId1" Type="'+DOCREL+'/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 for(let i=0;i<sheets.length;i++)file["xl/worksheets/sheet"+(i+1)+".xml"]=sheetXml(sheets[i].rows,sheets,i);
 file["[Content_Types].xml"]=xml+'<Types xmlns="'+CT+'"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
  '<Default Extension="xml" ContentType="application/xml"/>'+
  '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+
  '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+
  sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join("")+'</Types>';
 return packageZip(file);
}
