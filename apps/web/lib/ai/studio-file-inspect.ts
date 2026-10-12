/** Safe, bounded client-side previews of real generated OpenXML files.
 * A preview is extracted from actual package parts, never invented model text.
 * Unsupported or encrypted packages fail closed. No scripts, macros, or external fetches.
 */
export type StudioPage={title:string;lines:string[];table?:string[][]};
export type StudioInspection={pages:StudioPage[];editableText:string;partial:boolean};
type Format="docx"|"xlsx"|"pptx";
function u16(b:Uint8Array,p:number){if(p<0||p+2>b.length)throw Error("Invalid ZIP header");return b[p]|(b[p+1]<<8);}
function u32(b:Uint8Array,p:number){if(p<0||p+4>b.length)throw Error("Invalid ZIP header");return (b[p]|b[p+1]<<8|b[p+2]<<16|b[p+3]<<24)>>>0;}
function decodedXml(t:string){return t.replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(Math.min(0x10ffff,parseInt(n,16)))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Math.min(0x10ffff,parseInt(n,10)))).replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&");}
function orderedText(xml:string,element:string):string[]{
 const matches=[...xml.matchAll(new RegExp("<"+element+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+element+">","g"))];
 return matches.map(m=>decodedXml(m[1]).replace(/[\x00-\x1f]/g," ").trim()).filter(Boolean);
}
export async function inspectOfficeArtifact(bytes:Uint8Array,format:Format):Promise<StudioInspection>{
 if(bytes.length<64||bytes.length>12*1024*1024||u32(bytes,0)!==0x04034b50)throw Error("Unsupported or oversized Office document");
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(u32(bytes,i)===0x06054b50){end=i;break;}}
 if(end<0)throw Error("Invalid Office archive directory");
 const count=u16(bytes,end+10),start=u32(bytes,end+16);if(count>500||count<1)throw Error("Office package exceeds part limit");
 const matched:Record<string,string>={};
 let cursor=start,total=0;
 for(let i=0;i<count;i++){
  if(u32(bytes,cursor)!==0x02014b50)throw Error("Invalid Office package");
  const flags=u16(bytes,cursor+8),method=u16(bytes,cursor+10);
  const compressed=u32(bytes,cursor+20),expanded=u32(bytes,cursor+24),nameLen=u16(bytes,cursor+28);
  const extra=u16(bytes,cursor+30),comment=u16(bytes,cursor+32),local=u32(bytes,cursor+42);
  const endOfEntry=cursor+46+nameLen+extra+comment;
  if(endOfEntry>bytes.length)throw Error("Damaged archive directory");
  const path=new TextDecoder().decode(bytes.slice(cursor+46,cursor+46+nameLen));
  cursor=endOfEntry;
  const wanted=path==="word/document.xml"||path==="xl/workbook.xml"||/^xl\/worksheets\/sheet\d+\.xml$/.test(path)||/^ppt\/slides\/slide\d+\.xml$/.test(path);
  if(!wanted)continue;
  if((flags&1)||![0,8].includes(method)||expanded>2*1024*1024||compressed>2*1024*1024)throw Error("Unsupported encrypted or oversized Office part");
  total+=expanded;if(total>6*1024*1024)throw Error("Office preview exceeds safe limits");
  if(u32(bytes,local)!==0x04034b50)throw Error("Invalid Office part header");
  const offset=local+30+u16(bytes,local+26)+u16(bytes,local+28);
  if(offset+compressed>bytes.length)throw Error("Truncated Office part");
  let raw=bytes.slice(offset,offset+compressed);
  if(method===8){
   if(typeof DecompressionStream==="undefined")throw Error("Compressed Office preview unsupported in this browser");
   const stream=new Blob([Uint8Array.from(raw)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
   const reader=stream.getReader(),parts:Uint8Array[]=[];let n=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;if(value){n+=value.length;if(n>expanded||n>2*1024*1024)throw Error("Office part expands too far");parts.push(value);}}}finally{reader.releaseLock();}
   raw=new Uint8Array(n);let off=0;for(const part of parts){raw.set(part,off);off+=part.length;}
  }
  if(raw.length!==expanded)throw Error("Office part size mismatch");
  matched[path]=new TextDecoder("utf-8",{fatal:true}).decode(raw);
 }
 const pages:StudioPage[]=[];
 if(format==="docx"){
  const xml=matched["word/document.xml"];if(!xml)throw Error("Word document content unavailable");
  const paragraphs=[...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)]
   .map(m=>orderedText(m[1],"w:t").join("")).filter(Boolean);
  if(!paragraphs.length)throw Error("Word document has no readable text");
  pages.push({title:"Word document",lines:paragraphs.slice(0,400)});
 }else if(format==="pptx"){
  const keys=Object.keys(matched).filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x))
   .sort((a,b)=>Number(a.match(/slide(\d+)/)?.[1])-Number(b.match(/slide(\d+)/)?.[1]));
  for(const key of keys.slice(0,60)){
   const paragraphs=[...matched[key].matchAll(/<a:p(?:\s[^>]*)?>([\s\S]*?)<\/a:p>/g)]
    .map(m=>orderedText(m[1],"a:t").join("")).filter(Boolean);
   const title=paragraphs[0]||"Slide "+(pages.length+1);
   pages.push({title,lines:paragraphs.slice(1,60)});
  }
 }else{
  const keys=Object.keys(matched).filter(x=>/^xl\/worksheets\/sheet\d+\.xml$/.test(x))
   .sort((a,b)=>Number(a.match(/sheet(\d+)/)?.[1])-Number(b.match(/sheet(\d+)/)?.[1]));
  const names=[...((matched["xl/workbook.xml"]??"").matchAll(/<sheet\b[^>]*name="([^"]+)"/g))].map(m=>decodedXml(m[1]));
  for(const key of keys.slice(0,24)){
   const matrix=[...matched[key].matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].slice(0,180).map(row=>{
    return [...row[1].matchAll(/<c\b[^>]*>([\s\S]*?)<\/c>/g)].slice(0,26).map(cell=>{
     const text=orderedText(cell[1],"t").join("");
     const value=orderedText(cell[1],"v").join("");
     const formula=orderedText(cell[1],"f").join("");
     return formula?"="+formula:text||value;
    });
   });
   pages.push({title:names[pages.length]||"Sheet "+(pages.length+1),lines:[],table:matrix});
  }
 }
 if(!pages.length)throw Error("This file has no previewable content");
 const editableText=format==="xlsx"
  ?pages.map(p=>"## Sheet: "+p.title+"\n"+(p.table??[]).map((r,i)=>"| "+r.join(" | ")+" |\n"+(i===0?"| "+r.map(()=>"---").join(" | ")+" |\n":"")).join("")).join("\n")
  :pages.map(p=>"# "+p.title+"\n"+p.lines.map(x=>"- "+x).join("\n")).join("\n\n---\n\n");
 return {pages,editableText:editableText.slice(0,150000),partial:editableText.length>150000||pages.length>=60};
}
