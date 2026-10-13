import type {Research} from "./research.ts";
export type AnswerReviewReason="research_evidence"|"requested_depth";
export function answerReviewReason(request:string,text:string,research?:Research,format?:unknown):AnswerReviewReason|null{
 if(research?.status==="complete"&&research.sources.length){
  const ids=[...text.matchAll(/\[(\d{1,2})\]/g)].map(x=>Number(x[1]));
  const refusal=/capabilities.{0,60}(?:don't|do not|cannot|not include)|cannot.{0,35}(?:search|browse)|can't.{0,35}(?:search|browse)|لا (?:أستطيع|استطيع).{0,35}(?:البحث|التصفح)/i.test(text);
  if(refusal||!research.sources.some(s=>ids.includes(s.id)))return "research_evidence";
 }
 const human=request.split(/Verified extracted original document content:|المحتوى الأصلي للملف:|مصادر الملفات المرفقة/)[0];
 const long=/\b(long|detailed|comprehensive|in.depth|essay|report|talk\s+along)\b|بالتفصيل|شرح طويل|مطوّل|شامل/i.test(human);
 // An explicit shorter length or a concise request takes priority over the depth default.
 const shorter=/\b(?:short|brief|concise|summary|summarize)\b|باختصار|مختصر/i.test(human)
  || Number((human.match(/\b(\d[\d,]{0,5})\s*(?:words?|كلمة)/i)?.[1]??"600").replaceAll(",",""))<550;
 if(long&&!shorter&&!["pdf","docx","xlsx","pptx"].includes(String(format))){
  const words=text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)?.length??0;
  const headings=text.match(/^#{1,3}\s+\S/gm)?.length??0;
  if(words<550||headings<4)return "requested_depth";
 }
 return null;
}
export function answerReviewInstruction(reason:AnswerReviewReason,language:"ar"|"en"):string{
 const languageName=language==="ar"?"Arabic":"English";
 return reason==="research_evidence"
  ? "The app has ALREADY retrieved the evidence included below. You do not need to browse. Audit the earlier explanation against those excerpts. Write in "+languageName+". Use ## Supported by these sources and ## Still needs verification. Cite supporting IDs as [1], [2] beside each supported claim. Do not categorically deny source access, assert the whole earlier answer is correct, or invent evidence for details absent from the excerpts. Wikipedia excerpts are background only."
  : "Complete the user's requested long explanation in "+languageName+". Return a substantially improved, self-contained answer with 5-7 useful Markdown ## sections and about 650-850 relevant words, concrete examples and precise uncertainty. Preserve the topic and avoid inventing facts, repetitive openings or a closing offer. Do not discuss these instructions.";
}

/** Honest application fallback when a provider ignores already-retrieved evidence. */
export function limitedResearchSummary(research:Research,language:"ar"|"en"):string{
 const safe=(text:string)=>text.replace(/[\[\]<>\x60*#]/g,"").replace(/[\r\n]+/g," ").trim();
 const heading=language==="ar"?"## الأدلة المسترجعة":"## Retrieved evidence";
 const scope=language==="ar"?"هذه خلاصة المقاطع المسترجعة، وليست تحققًا كاملًا من الرد السابق. لا تثبت التفاصيل التي لم ترد في هذه المقاطع.":"This summarizes the retrieved excerpts. It is not a complete fact-check of the earlier answer; details absent from these excerpts still need verification.";
 return heading+"\n\n"+scope+"\n\n"+research.sources.map(s=>"- **"+safe(s.title)+"**: "+safe(s.excerpt)+" ["+s.id+"]").join("\n\n")+"\n\n"+
 (research.reason==="encyclopedia_background"
 ?language==="ar"?"مراجع ويكيبيديا للمعلومات العامة فقط؛ لا تتحقق من الأخبار أو الادعاءات الحالية.":"Wikipedia background excerpts only; they do not verify news or current claims."
 :language==="ar"?"يمكن متابعة التحقق من الادعاءات المحددة باستخدام مصادر إضافية.":"Specific claims can be checked further against additional sources.");
}
