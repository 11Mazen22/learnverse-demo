/** Convert provider line-break markup as text; never enable arbitrary HTML. */
export function displayMarkdown(content:string):string {
  let fence="";
  return content.split("\n").map(line=>{
    const marker=line.match(/^\s*(`{3,}|~{3,})/);
    if(marker){if(!fence)fence=marker[1][0];else if(marker[1][0]===fence)fence="";return line;}
    if(fence)return line;
    // Inline code is a literal example and must retain its markup.
    return line.split(/(`+[^`]*`+)/g).map(part=>part.startsWith("`")?part:
      part.replace(/(?:<br\s*\/?\s*>|&lt;br\s*\/?\s*&gt;)/gi,line.trim().startsWith("|")?" · ":"\n\n")
        .replace(/\\\((.+?)\\\)/g,(_,math)=>"$"+math+"$")
        .replace(/\\\[(.*?)\\\]/g,(_,math) =>"\n\n$$\n"+math+"\n$$\n\n")
        .replace(/^\s*\\[\[\]]\s*$/g,()=>"$$")).join("");
  }).join("\n");
}
