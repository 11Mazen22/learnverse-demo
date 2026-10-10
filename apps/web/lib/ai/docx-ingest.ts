/**
 * Safe local extraction for Office Open XML (.docx) text documents.
 * No document execution, macros, external references or XML entity expansion.
 * Supports ordinary ZIP STORE/DEFLATE entries, Word paragraphs and tables.
 * Files are interpreted as untrusted context, never as system instructions.
 */
export const MAX_DOCX_INPUT = 6 * 1024 * 1024;
const MAX_DOC_XML = 3 * 1024 * 1024;
const MAX_DOC_TEXT = 9000;
const xmlPart = "word/document.xml";
const decoder = new TextDecoder("utf-8", {fatal:true});
export function isDocxDocument(file:{name:string;type:string}):boolean {
  return /\.docx$/i.test(file.name) &&
    (file.type==="" || file.type==="application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}
function read16(bytes:Uint8Array,pos:number) {
  if(pos<0||pos+2>bytes.length)throw new Error("Invalid DOCX ZIP header");
  return bytes[pos] | (bytes[pos+1]<<8);
}
function read32(bytes:Uint8Array,pos:number) {
  return ((bytes[pos] | (bytes[pos+1]<<8) | (bytes[pos+2]<<16) | (bytes[pos+3]<<24))>>>0);
}
async function readDocumentXml(input:ArrayBuffer):Promise<string> {
  const b=new Uint8Array(input);
  if(b.length<22 || b.length>MAX_DOCX_INPUT) throw new Error("Invalid or oversized DOCX");
  let end=-1;
  for(let i=b.length-22;i>=Math.max(0,b.length-65557);i--){
    if(read32(b,i)===0x06054b50){end=i;break;}
  }
  if(end<0)throw new Error("DOCX archive is missing its ZIP directory");
  const count=read16(b,end+10),centralSize=read32(b,end+12),centralOffset=read32(b,end+16);
  if(count>350 || centralOffset+centralSize>b.length)throw new Error("Invalid DOCX ZIP directory");
  let cursor=centralOffset;
  let location=null as null|{method:number;offset:number;size:number;expanded:number};
  for(let i=0;i<count;i++){
    if(read32(b,cursor)!==0x02014b50) throw new Error("Damaged DOCX directory");
    const flags=read16(b,cursor+8),method=read16(b,cursor+10);
    const size=read32(b,cursor+20),expanded=read32(b,cursor+24);
    const nameLen=read16(b,cursor+28),extraLen=read16(b,cursor+30),commentLen=read16(b,cursor+32);
    const local=read32(b,cursor+42);
    if(cursor+46+nameLen+extraLen+commentLen>b.length)throw new Error("Truncated DOCX directory");
    const name=decoder.decode(b.subarray(cursor+46,cursor+46+nameLen));
    if(name===xmlPart){
      if(flags&1)throw new Error("Encrypted DOCX files are not supported");
      if(![0,8].includes(method))throw new Error("Unsupported DOCX compression");
      if(expanded>MAX_DOC_XML || size>MAX_DOCX_INPUT)throw new Error("DOCX text is too large");
      location={method,offset:local,size,expanded};
      break;
    }
    cursor+=46+nameLen+extraLen+commentLen;
  }
  if(!location)throw new Error("DOCX has no Word document part");
  const {method,offset,size,expanded}=location;
  if(read32(b,offset)!==0x04034b50)throw new Error("Corrupt DOCX local header");
  const start=offset+30+read16(b,offset+26)+read16(b,offset+28);
  if(start+size>b.length)throw new Error("Truncated DOCX content");
  const compressed=b.slice(start,start+size);
  let raw:Uint8Array;
  if(method===0)raw=compressed;
  else {
    if(typeof DecompressionStream==="undefined")throw new Error("DOCX decompression is unavailable in this browser");
    const stream=new Blob([Uint8Array.from(compressed)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const reader=stream.getReader();
    const chunks:Uint8Array[]=[];let length=0;
    try {
      for(;;) {
        const {value,done}=await reader.read();
        if(done)break;
        if(value){length+=value.byteLength;if(length>MAX_DOC_XML)throw new Error("DOCX expands beyond safe limits");chunks.push(value);}
      }
    }finally{reader.releaseLock();}
    raw=new Uint8Array(length);let p=0;for(const v of chunks){raw.set(v,p);p+=v.byteLength;}
  }
  if(raw.byteLength!==expanded || raw.byteLength>MAX_DOC_XML)throw new Error("DOCX content size mismatch");
  return decoder.decode(raw);
}
function decodeXmlText(value:string):string {
  return value.replace(/&#(x[0-9a-fA-F]+|\d+);|&(amp|lt|gt|quot|apos);/g,(match,num:string,entity:string)=>{
    if(entity)return ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"} as Record<string,string>)[entity] ?? match;
    const code=num[0]==="x"?parseInt(num.slice(1),16):parseInt(num,10);
    return code>0 && code<=0x10ffff && (code<0xd800 || code>0xdfff)?String.fromCodePoint(code):"";
  });
}
function paragraphs(xml:string):string[] {
  const matches=xml.match(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g)??[];
  return matches.map(paragraph=>{
    const words=[...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    const result=words.map(m=>decodeXmlText(m[1])).join("");
    const isHeading=/<w:pStyle\b[^>]*w:val="Heading[12]"/.test(paragraph);
    return (isHeading?"# ":"")+result.trim();
  });
}
export async function extractDocxDocument(file:{
  name:string;type:string;size:number;arrayBuffer():Promise<ArrayBuffer>;
},maxCharacters=MAX_DOC_TEXT):Promise<{excerpt:string;truncated:boolean;paragraphs:number;tables:number}> {
  const limit=Math.max(1,Math.min(maxCharacters,200000));
  if(!isDocxDocument(file)||file.size<1||file.size>MAX_DOCX_INPUT)throw new Error("Unsupported or oversized DOCX");
  const xml=await readDocumentXml(await file.arrayBuffer());
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw new Error("Unsafe DOCX XML");
  // Preserve the position of table rows and cell boundaries in reading order.
  const body=xml.match(/<w:body(?:\s[^>]*)?>([\s\S]*?)<\/w:body>/)?.[1];
  if(!body)throw new Error("DOCX body not found");
  const chunks:string[]=[];
  let count=0,tables=0,at=0;
  const parts=/<w:tbl(?:\s[^>]*)?>[\s\S]*?<\/w:tbl>|<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g;
  let match:RegExpExecArray|null;
  while((match=parts.exec(body))!==null) {
    if(match.index<at)continue;
    const part=match[0];at=parts.lastIndex;
    if(part.startsWith("<w:tbl")){
      tables++;
      for(const row of part.match(/<w:tr(?:\s[^>]*)?>[\s\S]*?<\/w:tr>/g)??[]){
        const cells=(row.match(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/g)??[])
          .map(cell=>paragraphs(cell).filter(Boolean).join(" ").trim());
        if(cells.length) chunks.push(cells.join(" | "));
      }
    } else {
      const para=paragraphs(part);
      count+=para.length;
      chunks.push(...para);
    }
    if(chunks.join("\n").length > limit+100)break;
  }
  const text=chunks.join("\n").trim();
  if(!text)throw new Error("DOCX contains no readable text");
  return {excerpt:text.slice(0,limit),truncated:text.length>limit,paragraphs:count,tables};
}
