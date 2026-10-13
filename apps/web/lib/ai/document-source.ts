/** Normalize observed model math delimiters without changing literal code. */
export function normalizedDocumentSource(text:string):string {
 const chunks=text.replace(/\r\n?/g,"\n").split(/(\x60\x60\x60[\s\S]*?\x60\x60\x60|~~~[\s\S]*?~~~)/g);
 return chunks.map((chunk,index)=>index%2?chunk:chunk
  .replace(/\\\[([\s\S]*?)\\\]/g,(_,math)=>"\n$$\n"+math.trim()+"\n$$\n")
  .replace(/\\\(([\s\S]*?)\\\)/g,(_,math)=>"$"+math.trim()+"$")
  .replace(/^\[\s*([^\n]*\\(?:text|mathrm|frac|sqrt|rightarrow|xrightarrow|sum|int|begin)\b[^\n]*)\s*\]\s*$/gm,(_,math)=>"\n$$\n"+math.trim()+"\n$$\n")
 ).join("");
}
/** The separate PDF cover already displays a matching first Markdown title. */
export function withoutDuplicateDocumentTitle(text:string,title:string):string{
 const key=(value:string)=>value.replace(/\.(pdf|docx)$/i,"").replace(/[*_\x60]/g,"").normalize("NFKC").replace(/\s+/g," ").trim().replace(/[.!?؟。]+$/u,"").toLocaleLowerCase();
 const first=text.match(/^\s*#{1,2}\s+([^\n]+)(?:\n|$)/);
 return first&&key(first[1])===key(title)?text.slice(first[0].length).trimStart():text;
}
