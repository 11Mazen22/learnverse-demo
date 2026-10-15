/** Normalize observed model math delimiters without changing literal code. */
export function normalizedDocumentSource(text:string):string {
 const chunks=text.replace(/\r\n?/g,"\n").split(/(\x60\x60\x60[\s\S]*?\x60\x60\x60|~~~[\s\S]*?~~~)/g);
 return chunks.map((chunk,index)=>index%2?chunk:chunk
  .replace(/\\\[([\s\S]*?)\\\]/g,(_,math)=>"\n$$\n"+math.trim()+"\n$$\n")
  .replace(/\\\(([\s\S]*?)\\\)/g,(_,math)=>"$"+math.trim()+"$")
  .replace(/^\[\s*([^\n]*\\(?:text|mathrm|frac|sqrt|rightarrow|xrightarrow|sum|int|begin)\b[^\n]*)\s*\]\s*$/gm,(_,math)=>"\n$$\n"+math.trim()+"\n$$\n")
 ).join("");
}
/** Remove opening Markdown headings already shown in the generated PDF cover. */
export function withoutDuplicateDocumentTitle(text:string,title:string):string{
 const key=(value:string)=>value.replace(/\.(pdf|docx|pptx|xlsx)$/i,"").replace(/[*_\x60]/g,"")
  .normalize("NFKD").replace(/[\p{M}\u0640]/gu,"").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
 const documentTitle=key(title);let remaining=text;
 while(documentTitle){
  const first=remaining.match(/^\s*#{1,2}\s+([^\n]+)(?:\n|$)/);
  if(!first||key(first[1])!==documentTitle)break;
  remaining=remaining.slice(first[0].length).trimStart();
 }
 return remaining;
}
