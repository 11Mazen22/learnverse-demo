/** Targeted OOXML text revisions. Unchanged local ZIP records remain byte-identical.
 * No filesystem extraction, executable content, external fetches or model-authored XML.
 * Explicitly excludes encrypted/ZIP64/signed/macro packages and complex text fields.
 */
export type OfficeFormat="docx"|"pptx"|"xlsx";
export type OfficeTextTarget={part:string;index:number;text:string;kind:"paragraph"|"cell";valueType?:"text"|"number"};
export type OfficeReplacementProblem="invalid_text"|"too_long"|"control_characters"|"number";

/** Shared preflight validation used by the editor UI and the package writer. */
export function officeReplacementProblem(target:Pick<OfficeTextTarget,"valueType">|undefined,value:unknown):OfficeReplacementProblem|null {
 if(typeof value!=="string")return "invalid_text";
 if(value.length>5000)return "too_long";
 // This editor changes one existing OOXML paragraph/cell at a time. The writer
 // intentionally rejects line breaks, tabs and XML control characters rather
 // than silently flattening them or generating malformed OOXML.
 if(/[\x00-\x1f\uD800-\uDFFF]/u.test(value))return "control_characters";
 if(target?.valueType==="number"&&(!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value)||!Number.isFinite(Number(value))))return "number";
 return null;
}
export type OfficeTextEdit=OfficeTextTarget & {replacement:string};
export const MAX_OFFICE_TEXT_EDITS=30;
const officeEditKey=(item:OfficeTextTarget)=>item.part+"|"+item.index;
/** Add or update one staged edit without creating duplicate edits for a target. */
export function queueOfficeTextEdit(queued:readonly OfficeTextEdit[],target:OfficeTextTarget,replacement:string):OfficeTextEdit[]{
 if(replacement===target.text)return [...queued];
 const next=queued.map(edit=>({...edit}));
 const index=next.findIndex(edit=>officeEditKey(edit)===officeEditKey(target));
 const value:OfficeTextEdit={...target,replacement};
 if(index>=0)next[index]=value;
 else if(next.length<MAX_OFFICE_TEXT_EDITS)next.push(value);
 return next;
}
/** Merge staged edits with the active field; the active field wins for its target. */
export function mergeOfficeTextEdits(queued:readonly OfficeTextEdit[],target:OfficeTextTarget|undefined,replacement:string):OfficeTextEdit[]{
 const unique=new Map<string,OfficeTextEdit>();
 for(const edit of queued)unique.set(officeEditKey(edit),{...edit});
 if(target&&replacement!==target.text)unique.set(officeEditKey(target),{...target,replacement});
 return [...unique.values()];
}
type Entry={path:string;flags:number;method:number;size:number;expanded:number;crc:number;offset:number;data:number;end:number;central:Uint8Array};
type Archive={bytes:Uint8Array;entries:Entry[];footer:Uint8Array};
const MAX_FILE=12*1024*1024,MAX_PART=2*1024*1024;
const utf8=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
function u16(b:Uint8Array,p:number){if(p<0||p+2>b.length)throw Error("office_archive_invalid");return b[p]|b[p+1]<<8;}
function u32(b:Uint8Array,p:number){return (u16(b,p)|u16(b,p+2)<<16)>>>0;}
function put16(b:Uint8Array,p:number,n:number){b[p]=n&255;b[p+1]=(n>>>8)&255;}
function put32(b:Uint8Array,p:number,n:number){put16(b,p,n);put16(b,p+2,n>>>16);}
function joined(parts:Uint8Array[]){const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;}
function crc32(bytes:Uint8Array){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function archive(bytes:Uint8Array):Archive{
 if(bytes.length<22||bytes.length>MAX_FILE||u32(bytes,0)!==0x04034b50)throw Error("office_archive_invalid");
 // Node Buffer.slice() aliases memory; normalize before any header copies/writes.
 bytes=Uint8Array.from(bytes);
 let end=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--)if(u32(bytes,p)===0x06054b50&&p+22+u16(bytes,p+20)===bytes.length){end=p;break;}
 if(end<0)throw Error("office_archive_invalid");
 const count=u16(bytes,end+10),start=u32(bytes,end+16),centralSize=u32(bytes,end+12);
 if(u16(bytes,end+4)||u16(bytes,end+6)||u16(bytes,end+8)!==count||count<1||count>500||start+centralSize!==end)throw Error("office_archive_unsupported");
 const entries:Entry[]=[],names=new Set<string>();let p=start;
 for(let i=0;i<count;i++){
  if(u32(bytes,p)!==0x02014b50)throw Error("office_archive_invalid");
  const flags=u16(bytes,p+8),method=u16(bytes,p+10),size=u32(bytes,p+20),expanded=u32(bytes,p+24),offset=u32(bytes,p+42);
  const nameLength=u16(bytes,p+28),extra=u16(bytes,p+30),comment=u16(bytes,p+32),next=p+46+nameLength+extra+comment;
  if(next>end||u16(bytes,p+34)||[size,expanded,offset].includes(0xffffffff))throw Error("office_archive_unsupported");
  const path=decoder.decode(bytes.subarray(p+46,p+46+nameLength));
  if(!path||path.startsWith("/")||path.includes("\\")||path.split("/").some(x=>x===".."||x===".")||names.has(path))throw Error("office_archive_invalid");
  if(/(?:^|\/)(?:_xmlsignatures|vbaProject\.bin)|origin\.sigs$/i.test(path)||(flags&0x2041)||![0,8].includes(method))throw Error("office_archive_unsupported");
  names.add(path);
  if(offset>=start||u32(bytes,offset)!==0x04034b50||u16(bytes,offset+6)!==flags||u16(bytes,offset+8)!==method)throw Error("office_archive_invalid");
  const localName=u16(bytes,offset+26),localExtra=u16(bytes,offset+28),data=offset+30+localName+localExtra;
  if(decoder.decode(bytes.subarray(offset+30,offset+30+localName))!==path||data+size>start)throw Error("office_archive_invalid");
  entries.push({path,flags,method,size,expanded,offset,data,end:0,crc:u32(bytes,p+16),central:bytes.slice(p,next)});p=next;
 }
 if(p!==end||!names.has("[Content_Types].xml"))throw Error("office_archive_invalid");
 const ordered=[...entries].sort((a,b)=>a.offset-b.offset);
 for(let i=0;i<ordered.length;i++){const entry=ordered[i];entry.end=ordered[i+1]?.offset??start;if(entry.data+entry.size>entry.end)throw Error("office_archive_invalid");}
 if(ordered[0].offset!==0)throw Error("office_archive_unsupported");
 return {bytes,entries,footer:bytes.slice(end)};
}
async function partText(a:Archive,entry:Entry):Promise<string>{
 if(entry.expanded>MAX_PART||entry.size>MAX_PART)throw Error("office_part_limit");
 let raw=a.bytes.slice(entry.data,entry.data+entry.size);
 if(entry.method===8){
  const reader=new Blob([Uint8Array.from(raw)]).stream().pipeThrough(new DecompressionStream("deflate-raw")).getReader();
  const parts:Uint8Array[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>entry.expanded||size>MAX_PART)throw Error("office_part_limit");parts.push(value);}}
  finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
  raw=joined(parts);
 }
 if(raw.length!==entry.expanded||crc32(raw)!==entry.crc)throw Error("office_archive_invalid");
 const xml=decoder.decode(raw);
 if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error("office_xml_unsupported");
 return xml;
}
function decoded(value:string){return value.replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi,(m,n:string,e:string)=>{
 if(e)return ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"} as Record<string,string>)[e.toLowerCase()]??m;
 const code=n[0].toLowerCase()==="x"?parseInt(n.slice(1),16):Number(n);
 return code>0&&code<=0x10ffff&&(code<0xd800||code>0xdfff)?String.fromCodePoint(code):"";
});}
function escaped(value:string){return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
type Block={start:number;end:number;xml:string;text:string;tag:string;kind:OfficeTextTarget["kind"]};
function blocks(xml:string,format:OfficeFormat):Block[]{
 const pattern=format==="docx"?/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g:format==="pptx"?/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g:/<c\b[^>]*>[\s\S]*?<\/c>/g;
 const tag=format==="docx"?"w:t":format==="pptx"?"a:t":"t";
 return [...xml.matchAll(pattern)].filter(m=>format!=="xlsx"||!/<f\b/.test(m[0])&&(!/\bt=/.test(m[0].slice(0,m[0].indexOf(">")))||/\bt="(?:inlineStr|n)"/.test(m[0].slice(0,m[0].indexOf(">"))))).map(m=>{
  const textTag=format==="xlsx"&&!/\bt="inlineStr"/.test(m[0].slice(0,m[0].indexOf(">")))?"v":tag;
  return {start:m.index!,end:m.index!+m[0].length,xml:m[0],tag:textTag,kind:format==="xlsx"?"cell" as const:"paragraph" as const,
  text:[...m[0].matchAll(new RegExp("<"+textTag+"(?:\\s[^>]*)?>([^<]*)<\\/"+textTag+">","g"))].map(t=>decoded(t[1])).join("")
 };
 }).filter(b=>b.text.trim()&&!/<(?:w:(?:fldChar|instrText|fldSimple|drawing|pict|object|tab|br|del|ins)|a:(?:fld|br)|f)\b/.test(b.xml));
}
function editableParts(a:Archive,format:OfficeFormat):Entry[]{
 const parts=a.entries.filter(e=>format==="docx"?e.path==="word/document.xml":format==="pptx"?/^ppt\/slides\/slide\d+\.xml$/.test(e.path):/^xl\/worksheets\/sheet\d+\.xml$/.test(e.path));
 if(!parts.length)throw Error("office_format_mismatch");
 if(parts.reduce((n,e)=>n+e.expanded,0)>6*1024*1024)throw Error("office_part_limit");
 return parts;
}
export async function officeTextTargets(bytes:Uint8Array,format:OfficeFormat):Promise<OfficeTextTarget[]>{
 const a=archive(bytes),targets:OfficeTextTarget[]=[];
 for(const entry of editableParts(a,format)){
  const xml=await partText(a,entry);
  blocks(xml,format).forEach((b,index)=>{if(b.text.length<=5000)targets.push({part:entry.path,index,text:b.text,kind:b.kind,valueType:b.tag==="v"?"number":"text"});});
  if(targets.length>1000)throw Error("office_target_limit");
 }
 return targets;
}
export async function reviseOfficeText(bytes:Uint8Array,format:OfficeFormat,edits:readonly OfficeTextEdit[]):Promise<{bytes:Uint8Array;changedParts:string[]}> {
 if(edits.length<1||edits.length>MAX_OFFICE_TEXT_EDITS)throw Error("office_edit_limit");
 const a=archive(bytes),permitted=new Set(editableParts(a,format).map(e=>e.path)),changed=new Map<string,Uint8Array>();let numericChange=false;
 for(const path of new Set(edits.map(e=>e.part))){
  if(!permitted.has(path))throw Error("office_edit_scope");
  const entry=a.entries.find(e=>e.path===path)!,xml=await partText(a,entry),targets=blocks(xml,format),patches:{start:number;end:number;value:string}[]=[],seen=new Set<number>();
  for(const edit of edits.filter(e=>e.part===path)){
   const block=targets[edit.index];
   if(!Number.isInteger(edit.index)||!block||seen.has(edit.index)||block.text!==edit.text||block.kind!==edit.kind)throw Error("office_stale_target");
   seen.add(edit.index);
   const problem=officeReplacementProblem({valueType:block.tag==="v"?"number":"text"},edit.replacement);
   if(problem)throw Error(problem==="number"?"office_number_invalid":"office_text_invalid");
   if(edit.replacement===edit.text)continue;
   if(block.tag==="v")numericChange=true;
   // Insert only character data. Keep every run, run property and paragraph property.
   // New text inherits the original first run; later run boundaries are retained empty.
   let first=true;
   const value=block.xml.replace(new RegExp("(<"+block.tag+"(?:\\s[^>]*)?>)[^<]*(<\\/"+block.tag+">)","g"),(_all,open:string,close:string)=>{
    const content=first?escaped(edit.replacement):"";first=false;
    const preserved=open.includes("xml:space=")?open.replace(/xml:space=(["']).*?\1/, 'xml:space="preserve"'):open.slice(0,-1)+' xml:space="preserve">';
    return preserved+content+close;
   });
   patches.push({start:block.start,end:block.end,value});
  }
  let revised=xml;for(const patch of patches.sort((x,y)=>y.start-x.start))revised=revised.slice(0,patch.start)+patch.value+revised.slice(patch.end);
  if(revised!==xml){const raw=utf8.encode(revised);if(raw.length>MAX_PART)throw Error("office_part_limit");changed.set(path,raw);}
 }
 if(!changed.size)throw Error("office_no_change");
 if(numericChange){
  const workbook=a.entries.find(e=>e.path==="xl/workbook.xml");if(!workbook)throw Error("office_format_mismatch");
  let xml=await partText(a,workbook);
  const calc='<calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/>';
  if(/<calcPr\b[^>]*\/>/.test(xml))xml=xml.replace(/<calcPr\b[^>]*\/>/,calc);
  else if(/<\/workbook>/.test(xml))xml=xml.replace(/<\/workbook>/,calc+"</workbook>");
  else throw Error("office_xml_unsupported");
  changed.set(workbook.path,utf8.encode(xml));
 }
 const locals:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 for(const entry of a.entries){
  const cd=entry.central.slice(),replacement=changed.get(entry.path);let local:Uint8Array;
  if(replacement){
   const header=a.bytes.slice(entry.offset,entry.data),flags=entry.flags&~0x000e,crc=crc32(replacement);
   put16(header,6,flags);put16(header,8,0);put32(header,14,crc);put32(header,18,replacement.length);put32(header,22,replacement.length);
   put16(cd,8,flags);put16(cd,10,0);put32(cd,16,crc);put32(cd,20,replacement.length);put32(cd,24,replacement.length);
   local=joined([header,replacement]);
  }else local=a.bytes.slice(entry.offset,entry.end);
  put32(cd,42,offset);locals.push(local);central.push(cd);offset+=local.length;
 }
 const footer=a.footer.slice();put32(footer,12,central.reduce((n,c)=>n+c.length,0));put32(footer,16,offset);
 const output=joined([...locals,...central,footer]);if(output.length>MAX_FILE)throw Error("office_part_limit");
 archive(output); // Reopen all directory/local-header boundaries before exposing bytes.
 return {bytes:output,changedParts:[...changed.keys()]};
}
