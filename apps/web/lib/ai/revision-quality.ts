/** Conservative loss check: no claim that a model has fact-checked a revision. */
export function revisionMayLoseContent(source:string,revision:string,request:string):boolean{
 if(/\b(summariz[es]?|summary|shorten|condense|brief|abstract)\b|اختصر|تلخيص|لخص|لخّص/i.test(request))return false;
 const words=(text:string)=>text.replace(/[#*_>\x60]/g,"").trim().split(/\s+/).filter(Boolean).length;
 const before=words(source),after=words(revision);
 return before>=120&&after<before*.65;
}
