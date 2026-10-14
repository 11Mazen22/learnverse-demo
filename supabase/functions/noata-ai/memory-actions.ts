/** Real conversational memory commands. Never extract memories implicitly. */
export type MemoryWrite = {kind:"save";content:string}|{kind:"ask"}|{kind:"none"};
export function conversationalMemoryIntent(message:string):MemoryWrite{
 const input=message.normalize("NFKC").trim();
 if(!input||input.length>1600)return{kind:"none"};
 if(/^(?:(?:what|which)\s+(?:do|can)\s+you\s+(?:remember|recall)(?:\s+about\s+me)?\??|(?:ماذا|ايه|إيه|شو)\s+(?:تتذكر|فاكر|تفتكر)(?:\s+عني|\s+عنّي)?[؟?]?)$/i.test(input))return{kind:"ask"};
 const match=input.match(/^(?:(?:please\s+)?(?:remember|save\s+to\s+memory|remember\s+this)\s*(?:(?:that|this|:|,)\s*)?|(?:افتكر|تذكر|تذكّر|احفظ\s+في\s+الذاكرة|خلي\s+بالك)\s*(?:(?:إن|ان|أن|اني|إني|:|،)\s*)?)(.+)$/i);
 if(!match)return{kind:"none"};
 const content=match[1].replace(/[\s\u200f\u200e]+/g," ").replace(/[.!؟]+$/g,"").trim();
 if(content.length<8||content.length>500)return{kind:"none"};
 return{kind:"save",content};
}
/** Personal secrets are not automatically put in long-term memory even when a command says remember. */
export function memoryStorageRefusal(content:string):string|null{
 if(/(?:password|passcode|secret\s+key|api\s+key|access\s+token|private\s+key|credit\s+card|cvv|cvc|رقم\s+البطاقة|كلمة\s+السر|الرقم\s+السري|رمز\s+التحقق|مفتاح\s+سري)/i.test(content))return"secret";
 if(/\b(?:sk-[a-z0-9-]{12,}|sb_secret_[a-z0-9]{8,}|(?:\d[ -]?){14,19})\b/i.test(content))return"secret";
 return null;
}
export function memoryResultMessage(kind:"saved"|"exists"|"disabled"|"full"|"unsafe"|"empty"|"unavailable",locale:"ar"|"en",content=""):string{
 const en={
 saved:"Saved to your private memory: "+JSON.stringify(content)+". You can edit or delete it in Settings → Memory.",
 exists:"This is already in your saved memory. You can edit or delete it in Settings → Memory.",
 disabled:"Memory is off. Turn it on under Settings → Memory if you'd like me to save something across chats. Nothing was saved.",
 full:"Your memory is full (50 items). Delete an older memory in Settings → Memory to save this one.",
 unsafe:"I won't store passwords, tokens or payment details in long-term memory. Nothing was saved.",
 empty:"You don't have any saved memory notes yet. You can add them in Settings → Memory.",
 unavailable:"I couldn't verify or save your memory right now. Nothing was confirmed as saved."
 };
 const ar={
 saved:"اتحفظت في ذاكرتك الخاصة: "+JSON.stringify(content)+". تقدر تعدّلها أو تحذفها من الإعدادات ← الذاكرة.",
 exists:"المعلومة دي محفوظة بالفعل. تقدر تعدّلها أو تحذفها من الإعدادات ← الذاكرة.",
 disabled:"الذاكرة مقفولة حاليًا. فعّلها بنفسك من الإعدادات ← الذاكرة لو عاوزني أفتكر معلومات بين المحادثات. لم يتم حفظ أي شيء.",
 full:"وصلت للحد الحالي (50 ذاكرة). احذف ذاكرة قديمة من الإعدادات ← الذاكرة قبل إضافة جديدة.",
 unsafe:"مش هحفظ كلمات المرور أو رموز الدخول أو بيانات الدفع في الذاكرة. لم يتم حفظ أي شيء.",
 empty:"لسه مفيش معلومات محفوظة في الذاكرة. تقدر تضيف معلومات من الإعدادات ← الذاكرة.",
 unavailable:"تعذّر التحقق من الذاكرة أو حفظها الآن. مش هقول إنها اتحفظت من غير تأكيد."
 };
 return(locale==="ar"?ar:en)[kind];
}
