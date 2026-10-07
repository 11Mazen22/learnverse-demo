const wrapperTags=["quran","hadith","ayah","verse","tool","tool_call","tool_result","search","search_result","citation","reference","source"];

export function sanitizeFanarText(input:string){
  if(!input)return "";
  let text=input;
  for(const tag of ["quran","hadith","ayah","verse"]){
    const pattern=new RegExp("<"+tag+"_start>([\\s\\S]*?)<"+tag+"_end>","gi");
    text=text.replace(pattern,(_,inner)=>"\n\n> "+String(inner).trim().replace(/\n/g,"\n> ")+"\n\n");
  }
  return text
    .replace(/<\/?(?:think|thinking|analysis|reasoning)>/gi,"")
    .replace(new RegExp("<\\/?(?:"+wrapperTags.join("|")+")_(?:start|end)>","gi"),"")
    .replace(/<\/?[a-z][a-z0-9-]*_(?:start|end)>/gi,"")
    .replace(/\n{3,}/g,"\n\n")
    .trim();
}
