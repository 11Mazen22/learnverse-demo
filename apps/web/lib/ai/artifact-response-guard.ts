/** Noata's artifact truthfulness boundary. Pure: no model can create a refusal PDF. */
export function isArtifactCapabilityQuestion(prompt:string):boolean{
 const q=prompt.trim().replace(/[?.!؟]+$/g,"").trim();
 if(q.length>200)return false;
 const hasFormat=/\b(?:pdf|docx|word|xlsx|excel|pptx|powerpoint)\b|(?:بي\s*دي\s*اف|وورد|إكسل|اكسل|باوربوينت)/i.test(q);
 if(!hasFormat)return false;
 const question=/^(?:(?:can|could|do|does|will|are|is)\s+(?:(?:you|noata)\s+)?|(?:هل|ممكن|تقدر|بتقدر|تستطيع|هل\s+تقدر)\s*)/i.test(q);
 const reference=/\b(?:this|that|previous|above|last)\b|(?:دا|ده|دي|هذا|هذه|اللي فوق|السابق)/i.test(q);
 const substantive=/\b(?:about|on|containing|with|from)\s+\S{4,}/i.test(q)||/(?:عن|فيه|يحتوي)\s+\S{4,}/.test(q);
 return question&&!reference&&!substantive;
}
export function isArtifactRefusal(answer:string):boolean{
 const s=answer.slice(0,1800);
 return /(?:i (?:am |['’]?m )?(?:unable|not able)\s+to\s+(?:create|generate|make|produce|provide)|i (?:can(?:not|['’]t)|do not have the (?:ability|capability))\s+(?:create|generate|make|produce|provide)|my capabilities do not include|cannot create downloadable files)/i.test(s)
 || /(?:لا أستطيع|لا يمكنني|غير قادر|ماقدرش|مقدرش|مش قادر)\s+(?:على\s+)?(?:إنشاء|توليد|عمل|تجهيز|إنتاج|عمل\s+ملف)/.test(s);
}
export function safeArtifactReplyOnCapabilityQuestion(prompt:string,answer:string,locale:"en"|"ar"):string{
 if(!isArtifactCapabilityQuestion(prompt)||!isArtifactRefusal(answer))return answer;
 return locale==="ar"
 ? "أيوه، Noata يقدر يجهز ملفات PDF وWord وExcel وPowerPoint قابلة للتنزيل لما إنشاء الملفات يكون متاحًا لحسابك. قولي تحب الملف يحتوي على إيه، ولما الإنشاء والحفظ ينجحوا هتظهر بطاقة الملف في المحادثة. مش هقول إن ملف اتعمل غير لما يكون اتحفظ فعلًا."
 : "Yes. Noata supports creating downloadable PDF, Word, Excel, and PowerPoint files when file generation is available for your account. Tell me what you want included. A file card appears in the chat only after generation and saving succeed—I won't claim a file exists before that.";
}
export function canCreateArtifactFromAnswer(reply:string,previous:string,usePrevious:boolean):boolean{
 const source=usePrevious&&previous.trim()?previous:reply;
 return source.trim().length>=20&&!isArtifactRefusal(source);
}
