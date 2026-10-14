/** Safe Noata AI suggestion contracts shared by Edge and web. */
export type SuggestionKind="welcome"|"followup";
export type SuggestionLocale="ar"|"en";
export type AISuggestion={id:string;title:string;prompt:string};
export const SUGGESTION_CACHE_MS=20*60*1000;
const defaults:Record<SuggestionLocale,AISuggestion[]>={
 ar:[
 {id:"a",title:"افهم فكرة صعبة",prompt:"اشرح لي فكرة صعبة ببساطة مع مثال واضح ثم اختبر فهمي."},
 {id:"b",title:"اختبر معلوماتي",prompt:"اسألني ثلاثة أسئلة متدرجة عن درس أختاره وصحح إجاباتي."},
 {id:"c",title:"رتّب ملاحظاتي",prompt:"ساعدني أنظم ملاحظات المذاكرة في ملخص وخطة مراجعة."},
 {id:"d",title:"اكتشف موضوعًا",prompt:"ساعدني أستكشف موضوعًا جديدًا في العلوم أو التاريخ بطريقة تفاعلية."}
 ],
 en:[
 {id:"a",title:"Understand a concept",prompt:"Explain a difficult idea simply with a clear example, then check my understanding."},
 {id:"b",title:"Test my knowledge",prompt:"Ask me three progressively harder questions about a topic I choose and check my answers."},
 {id:"c",title:"Organize my notes",prompt:"Help me organize my study notes into a clear summary and revision plan."},
 {id:"d",title:"Explore a topic",prompt:"Help me explore a new science or history topic with an engaging explanation."}
 ]};
export const welcomeDefaults=(locale:SuggestionLocale):AISuggestion[]=>defaults[locale].map(v=>({...v}));
export function suggestionContext(value:unknown,max=320):string{
 if(typeof value!=="string")return "";
 return value.normalize("NFKC").replace(/[\x00-\x1f\x7f]/g," ")
  .replace(/https?:\/\/[^\s]+/gi,"[link]")
  .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi,"[email]")
  .replace(/(?:sk-|sb_secret_|ghp_|github_pat_)[\w-]{8,}/gi,"[secret]")
  .replace(/\b(?:password|api[_ -]?key|access[_ -]?token|secret)\s*[:=]\s*\S+/gi,"[private]")
  .replace(/\s+/g," ").trim().slice(0,max);
}
export function parseSuggestions(raw:unknown,kind:SuggestionKind):AISuggestion[]{
 if(typeof raw!=="string"||raw.length>6000)return [];
 let parsed:unknown;
 try{parsed=JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,""));}catch{return [];}
 const values=Array.isArray(parsed)?parsed:(parsed&&typeof parsed==="object"&&"suggestions"in parsed)?(parsed as {suggestions:unknown}).suggestions:null;
 if(!Array.isArray(values)||values.length<(kind==="welcome"?4:3)||values.length>4)return [];
 const result:AISuggestion[]=[],seen=new Set<string>();
 for(const item of values){
  if(!item||typeof item!=="object"||Array.isArray(item))return [];
  const title=typeof item.title==="string"?item.title.replace(/[<>\x00-\x1f\x7f]/g,"").trim():"";
  const prompt=typeof item.prompt==="string"?item.prompt.replace(/[<>\x00-\x1f\x7f]/g,"").trim():"";
  if(title.length<4||title.length>65||prompt.length<12||prompt.length>380||seen.has(title.toLocaleLowerCase()))return [];
  seen.add(title.toLocaleLowerCase());result.push({id:kind+"-"+result.length,title,prompt});
 }
 return result;
}
export function validateSuggestionResult(value:unknown,kind:SuggestionKind):AISuggestion[]{
 if(!value||typeof value!=="object"||Array.isArray(value))return [];
 return parseSuggestions(JSON.stringify((value as {suggestions?:unknown}).suggestions),kind);
}
