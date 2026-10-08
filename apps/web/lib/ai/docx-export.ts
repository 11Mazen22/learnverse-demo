/**
 * Small dependency-free OOXML/DOCX writer for Noata AI.
 * Exports Arabic-first paragraphs and Markdown # headings as editable Word text.
 * Uses ZIP STORE records, CRC32 and proper Office relationships.
 * No server, third-party key or hidden PDF rendering dependency.
 */
const utf8 = new TextEncoder();
function xml(value: string) {
  return value.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g,"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function crc32(bytes:Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i=0;i<8;i++) crc = (crc >>> 1) ^ ((crc&1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function u16(a:Uint8Array, offset:number, value:number){
  a[offset]=value&255;a[offset+1]=(value>>>8)&255;
}
function u32(a:Uint8Array, offset:number, value:number){
  u16(a,offset,value&65535);u16(a,offset+2,(value>>>16)&65535);
}
function concat(parts:Uint8Array[]) {
  const size=parts.reduce((s,x)=>s+x.length,0);
  const out=new Uint8Array(size);let off=0;
  for(const part of parts){out.set(part,off);off+=part.length;}return out;
}
function packageZip(files:Record<string,string>):Uint8Array {
  const locals:Uint8Array[]=[];const central:Uint8Array[]=[];
  let offset=0;
  for(const [path,value] of Object.entries(files)){
    const name=utf8.encode(path), data=utf8.encode(value), checksum=crc32(data);
    const local=new Uint8Array(30+name.length);
    u32(local,0,0x04034b50);
    u16(local,4,20);u16(local,6,0x0800);u16(local,8,0);
    u32(local,14,checksum);u32(local,18,data.length);u32(local,22,data.length);
    u16(local,26,name.length);local.set(name,30);
    locals.push(local,data);
    const cd=new Uint8Array(46+name.length);
    u32(cd,0,0x02014b50);u16(cd,4,20);u16(cd,6,20);
    u16(cd,8,0x0800);u16(cd,10,0);
    u32(cd,16,checksum);u32(cd,20,data.length);u32(cd,24,data.length);
    u16(cd,28,name.length);u32(cd,42,offset);cd.set(name,46);
    central.push(cd);
    offset+=local.length+data.length;
  }
  const cdSize=central.reduce((s,x)=>s+x.length,0);
  const footer=new Uint8Array(22);
  u32(footer,0,0x06054b50);
  u16(footer,8,central.length);u16(footer,10,central.length);
  u32(footer,12,cdSize);u32(footer,16,offset);
  return concat([...locals,...central,footer]);
}
function wordDocument(text:string) {
  if(text.length>200000) throw new Error("The document is too large for this exporter");
  const paragraphs=text.replace(/\r\n?/g,"\n").split("\n");
  const content=paragraphs.map(line=>{
    const heading=/^(#{1,2})\s+(.+)$/.exec(line);
    const value=heading?heading[2]:line;
    const style=heading?(heading[1].length===1?"Heading1":"Heading2"):null;
    return '<w:p><w:pPr><w:bidi w:val="1"/><w:jc w:val="right"/>' +
      (style?'<w:pStyle w:val="'+style+'"/>':"")+'</w:pPr>'+
      (value?'<w:r><w:rPr><w:rtl w:val="1"/><w:rFonts w:cs="Arial" w:ascii="Arial" w:hAnsi="Arial"/></w:rPr><w:t xml:space="preserve">'+xml(value)+'</w:t></w:r>':"")+'</w:p>';
  }).join("");
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:body>'+content+
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1247" w:right="1134" w:bottom="1247" w:left="1134"/></w:sectPr>'+
    '</w:body></w:document>';
}
export function createNoataDocx(text:string):Uint8Array {
  const types='<?xml version="1.0" encoding="UTF-8"?>'+
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'+
    '<Default Extension="xml" ContentType="application/xml"/>'+
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
    '</Types>';
  const rels='<?xml version="1.0" encoding="UTF-8"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'+
    '</Relationships>';
  const docrels='<?xml version="1.0" encoding="UTF-8"?>'+
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
    '</Relationships>';
  const styles='<?xml version="1.0" encoding="UTF-8"?>'+
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:rPrDefault>'+
    '<w:pPrDefault><w:pPr><w:bidi w:val="1"/><w:jc w:val="right"/></w:pPr></w:pPrDefault></w:docDefaults>'+
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="38"/></w:rPr></w:style>'+
    '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style>'+
    '</w:styles>';
  return packageZip({
    "[Content_Types].xml":types,
    "_rels/.rels":rels,
    "word/document.xml":wordDocument(text),
    "word/_rels/document.xml.rels":docrels,
    "word/styles.xml":styles,
  });
}
export function downloadNoataDocx(text:string,filename="noata-ai.docx") {
  const data=createNoataDocx(text);
  const blob=new Blob([Uint8Array.from(data)],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
  const url=URL.createObjectURL(blob),anchor=document.createElement("a");
  anchor.href=url;anchor.download=filename.endsWith(".docx")?filename:filename+".docx";
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),15000);
}
