function terms(text:string){return new Set(text.normalize("NFKC").replace(/[\u064b-\u065f\u0670]/g,"").toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)??[]);}
/** Local lexical retrieval. It is bounded source selection, not a claim of semantic/vector search. */
export function retrieveDocumentContext(text:string,query:string,limit:number):{excerpt:string;truncated:boolean}{
 if(text.length<=limit)return {excerpt:text,truncated:false};
 const wanted=terms(query),parts:{index:number;label:string;text:string;score:number}[]=[];
 let page="";let index=0;
 for(const paragraph of text.split(/\n\n+|(?=صفحة \d+:\n)/)){
  const label=/^صفحة \d+:/.exec(paragraph)?.[0];if(label)page=label;
  for(let offset=0;offset<paragraph.length;offset+=1200){
   const chunk=paragraph.slice(offset,offset+1200),found=terms(chunk);
   const score=[...wanted].reduce((s,t)=>s+(found.has(t)?1:0),0);
   parts.push({index:index++,label:page,text:chunk,score});
  }
 }
 const ranked=[...parts].sort((a,b)=>b.score-a.score||a.index-b.index);
 // Always include the opening for orientation and an end segment for long-file coverage.
 const chosen=new Map<number,typeof parts[number]>();
 let remaining=limit-90;
 for(const part of [parts[0],parts.at(-1),...ranked]){
  if(!part || chosen.has(part.index))continue;
  const block=(part.label?part.label+"\n":"")+part.text;
  if(block.length>remaining)continue;
  chosen.set(part.index,part);remaining-=block.length+15;
 }
 const excerpt=[...chosen.values()].sort((a,b)=>a.index-b.index).map(p=>(p.label?p.label+"\n":"")+p.text).join("\n[مقطع آخر]\n");
 return {excerpt:("[مقاطع منتقاة حسب السؤال؛ ليست كامل المستند]\n"+excerpt).slice(0,limit),truncated:true};
}
