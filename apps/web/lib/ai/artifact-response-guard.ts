/** Noata's artifact truthfulness boundary. Pure: no model can create a refusal PDF. */
export function isArtifactCapabilityQuestion(prompt:string):boolean{
 const q=prompt.trim().replace(/[?.!؟]+$/g,"").trim();
 if(q.length>200)return false;
 const hasFormat=/\b(?:pdf|docx|word|xlsx|excel|pptx|powerpoint)\b|(?:بي\s*دي\s*اف|وورد|إكسل|اكسل|باوربوينت)/i.test(q);
 if(!hasFormat)return false;
 const question=/^(?:(?:can|could|do|does|will|are|is)\s+(?:(?:you|noata)\s+)?|(?:هل|ممكن|تقدر|بتقدر|تستطيع|هل\s+تقدر)\s*)/i.test(q);
 const reference=/\b(?:this|that|them|those|these|it|previous|above|last)\b|(?:دا|ده|دي|دول|هذا|هذه|تلك|اللي فوق|السابق)/i.test(q);
 const substantive=/\b(?:about|on|containing|with|from)\s+\S+/i.test(q)||/(?:عن|فيه|يحتوي)\s+\S{4,}/.test(q);
 return question&&!reference&&!substantive;
}
export function isArtifactRefusal(answer:string):boolean{
 const s=answer.slice(0,1800);
 return /(?:i (?:am |['’]?m )?(?:unable|not able)\s+to\s+(?:directly\s+)?(?:create|generate|make|produce|provide)|i (?:can(?:not|['’]t)|do not have the (?:ability|capability))\s+(?:directly\s+)?(?:create|generate|make|produce|provide)|my capabilities (?:do not|don[’\']t) include|cannot create downloadable files)/i.test(s)
 || /(?:لا أستطيع|لا يمكنني|غير قادر|ماقدرش|مقدرش|مش قادر)\s+(?:على\s+)?(?:إنشاء|توليد|عمل|تجهيز|إنتاج|عمل\s+ملف)/.test(s);
}
export function safeArtifactReplyOnCapabilityQuestion(prompt:string,answer:string,locale:"en"|"ar"):string{
 if(!isArtifactCapabilityQuestion(prompt)||!isArtifactRefusal(answer))return answer;
 return directArtifactAbilityAnswer(prompt,locale)??answer;
}
/** Answer a capability-probe without asking a model to guess the application's tools.
 * This is NOT a success receipt; the generated-file card is the sole receipt.
 */
export function directArtifactAbilityAnswer(prompt:string,locale:"en"|"ar"):string|null{
 if(!isArtifactCapabilityQuestion(prompt))return null;
 const q=prompt.toLowerCase();
 const format=/\b(?:excel|xlsx)\b|إكسل|اكسل/i.test(q)?"Excel":
  /\b(?:powerpoint|pptx)\b|باوربوينت/i.test(q)?"PowerPoint":
  /\b(?:word|docx)\b|وورد/i.test(q)?"Word":"PDF";
 return locale==="ar"
  ?"أيوه، أقدر أجهز ملف "+format+" قابل للتنزيل. تحب يكون فيه إيه؟ هتظهر بطاقة الملف هنا بعد ما الإنشاء والحفظ ينجحوا."
  :"Yes—I can prepare a downloadable "+format+" file here. What should it contain? I'll show the file only after generation and saving succeed.";
}
export function canCreateArtifactFromAnswer(reply:string,previous:string,usePrevious:boolean):boolean{
 const source=usePrevious&&previous.trim()?previous:reply;
 return source.trim().length>=20&&!isArtifactRefusal(source);
}
