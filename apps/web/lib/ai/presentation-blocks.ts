/**
 * Genre-aware prose blocks. Presentation directives never enable arbitrary HTML.
 * Partial directives remain plain Markdown until their closing marker arrives.
 */
export type PresentationSegment =
  | { type:"markdown"; text:string }
  | { type:"poem"|"insight"|"example"; text:string };

export function splitPresentationBlocks(text:string):PresentationSegment[] {
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
  return items.length?items:[{type:"markdown",text}];
}
