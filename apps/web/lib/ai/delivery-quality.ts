/** Do not store an AI's plan, confirmation request, or refusal as a finished document. */
export function isNonDeliverableDraft(content:string):boolean{
 const t=content.trim();
 if(!t)return true;
 const start=t.slice(0,2500),last=t.slice(-1100);
 // A live failure created a PDF from "I need more specific details ... could you
 // please tell me". Conversation clarification is not finished source content.
 // Restrict this check to an untitled introduction so a titled exercise that
 // quotes a clarification question remains valid educational material.
 const introduction=t.split(/\n\s*\n/)[0].slice(0,1000);
 if(!/^#{1,6}\s/.test(t)&&/(?:i (?:need|require) (?:some |a few |more )?(?:specific |additional )?(?:details|information|context)|could you (?:please )?(?:tell me|specify|clarify)|once i have (?:a |the )?better understanding|أحتاج (?:إلى )?(?:مزيد من |المزيد من )?(?:التفاصيل|تفاصيل|معلومات)|هل يمكنك (?:أن )?(?:توضح|تحدد)|ممكن توضح)/i.test(introduction))return true;
 if(!/^#{1,6}\s/.test(t)&&/^(?:Which public topic or claim should I verify|What should the file contain|What would you like me to search for|أي موضوع عام أو معلومة تحب|ما المحتوى الذي تريد)/i.test(introduction))return true;
 const planning=/(?:once (?:you )?(?:confirm|approve)|before (?:i |we )?proceed|please confirm (?:this |the |if |whether|that)|would you (?:prefer|like me to)|shall i (?:proceed|create|generate)|i(?:'|’)ll (?:proceed|start|generate|create) (?:the |your )?(?:pdf|document|file)|i will (?:proceed|start|generate|create) (?:the |your )?(?:pdf|document|file)|after (?:your |you )?(?:confirmation|confirm)|before generating the pdf|then (?:i |we )?will (?:create|generate) the (?:pdf|document)|بعد (?:تأكيدك|موافقتك)|يرجى (?:التأكيد|تأكيد)|هل (?:تفضل|تريد) أن|سأبدأ (?:في )?(?:إنشاء|توليد) (?:الملف|المستند)|بعد موافقتك)/i;
 if(planning.test(last)||/once (?:the content is |it is |the document is )?finalized[\s\S]{0,100}(?:generat|creat|proceed)|(?:i['’]ll|i will) proceed to generat/i.test(last))return true;
 if(t.length<200&&/(?:here(?:'s| is) (?:the )?(?:proposed|suggested) (?:structure|outline)|plan for (?:your |the )?(?:document|pdf)|خطة (?:الملف|المستند))/i.test(start))return true;
 const lines=t.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 return lines.length<4 && /^\s*(?:yes|sure|great|absolutely|ok|okay|حاضر|تمام)[!,.،\s]/i.test(t)
   && /(?:can create|will create|i can prepare|سأنشئ|أقدر أجهز)/i.test(t);
}
export function imageNeedsSubject(prompt:string):boolean{
 const q=prompt.trim().toLowerCase().replace(/[.!?؟،]+$/g,"").trim();
 return /^(?:(?:please|can you|could you)\s+)?(?:make|create|generate|draw|design|render|paint)\s+(?:(?:me|us)\s+)?(?:an?|the|some)?\s*(?:image|picture|photo|illustration|art|drawing)\s*(?:for me|please)?$/i.test(q)
  || /^(?:اعمل|اعملي|ارسم|ارسملي|صمم|صمّم|ولد|ولّد|أنشئ|انشئ)\s*(?:لي|لنا)?\s*(?:صورة|صوره|رسمة|رسم|تصميم)(?:\s*لو سمحت)?$/i.test(q);
}
