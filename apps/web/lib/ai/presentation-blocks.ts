/**
 * Genre-aware prose blocks. Presentation directives never enable arbitrary HTML.
 * Partial directives remain plain Markdown until their closing marker arrives.
 */
export type PresentationSegment =
  | { type:"markdown"; text:string }
  | { type:"poem"|"insight"|"example"; text:string };

export function isPoetryRequest(text:string):boolean {
  if(text.length>5000)return false;
  const ar=/(?:اكتب|الف|ألّف|انشئ|أنشئ|نظم|صغ|اعمل|أريد|عاوز|اريد|عَايز)[\s\S]{0,100}(?:قصيده|قصيدة|شعر|أبيات|ابيات)/u;
  const en=/(?:write|compose|create|make|give me)[\s\S]{0,100}(?:poem|poetry|verses)\b/i;
  return ar.test(text)||en.test(text);
}
export function splitPresentationBlocks(text:string, preferPoem=false):PresentationSegment[] {
  const items:PresentationSegment[]=[];
  const lines=text.split("\n");
  let codeFence:string|null=null, start=-1, blockType:"poem"|"insight"|"example"|null=null;
  let cursor=0;
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    const code=line.match(/^([\x60~]{3,})/);
    if(code){
      if(!codeFence)codeFence=code[1][0];
      else if(codeFence===code[1][0])codeFence=null;
    }
    if(codeFence)continue;
    if(blockType){
      if(line===":::"){
        if(start>cursor)items.push({type:"markdown",text:lines.slice(cursor,start).join("\n")});
        items.push({type:blockType,text:lines.slice(start+1,i).join("\n").trim()});
        cursor=i+1;start=-1;blockType=null;
      }
    }else if(line===":::poem"||line===":::insight"||line===":::example"){
      start=i;
      blockType=line.slice(3) as "poem"|"insight"|"example";
    }
  }
  if(cursor<lines.length)items.push({type:"markdown",text:lines.slice(cursor).join("\n")});
  if(items.length===1&&items[0].type==="markdown"&&preferPoem){
    const lines=text.split("\n").filter(line=>line.trim());
    const isVerse=lines.length>=3&&lines.length<=90
      &&lines.every(line=>line.length<=110&&!/^\s*(?:#{1,6}\s|[-*]\s|\d+[.)]\s|[|>]|\x60{3}|~{3}|:::)/.test(line))
      &&lines.filter(line=>/[.!؟،,؛]$/.test(line.trim())).length<lines.length;
    if(isVerse)return [{type:"poem",text:text.trim()}];
  }
  return items.length?items:[{type:"markdown",text}];
}
