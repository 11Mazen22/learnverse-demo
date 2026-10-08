import { FANAR_CAPABILITIES } from "./catalog.ts";

/**
 * Runtime capability contract for the active noata-ai-v2 Edge Function.
 * These are configured routes, NOT claims that Fanar is currently online.
 * Tool calling is not enabled by the deployed chat request body.
 */
export const CHAT_MODEL_CARDS = [
  {id:"Fanar", arabic:"فنار",subtitle:"المحادثات والأسئلة اليومية",description:"حوار عام وشرح وصياغة بالعربية.",features:["نص","بث الرد"],bestFor:"general"},
  {id:"Fanar-S-1-7B", arabic:"فنار S",subtitle:"رد سريع",description:"أسئلة قصيرة وإجابات سريعة.",features:["نص","بث الرد"],bestFor:"fast"},
  {id:"Fanar-C-1-8.7B", arabic:"فنار C",subtitle:"تحليل وشرح",description:"مسائل وخطوات استنتاجية. التفكير الموسع يعتمد على إعداد الطلب.",features:["نص","شرح خطوات"],bestFor:"reasoning"},
  {id:"Fanar-C-2-27B", arabic:"فنار C 27B",subtitle:"مسائل أكثر تعقيدًا",description:"مسائل مطولة ومعالجة مسائل صعبة.",features:["نص","تحليل","بث الرد"],bestFor:"deep"},
  {id:"Fanar-Sadiq", arabic:"صادق",subtitle:"أسئلة إسلامية",description:"إجابات من المساعد المتخصص؛ لا تُعد نصًا قرآنيًا معتمدًا.",features:["نص","إسلامي"],bestFor:"islamic"},
  {id:"Fanar-Sadiq-2", arabic:"صادق 2",subtitle:"شرح إسلامي",description:"شرح وبيان. تحقق من الاستشهادات في مصادر موثوقة.",features:["نص","إسلامي"],bestFor:"islamic"},
  {id:"Fanar-Oryx-IVU-2", arabic:"أوريكس رؤية",subtitle:"فهم الصور",description:"يقبل صورة مرفقة مع سؤال نصي.",features:["رؤية","صورة"],bestFor:"vision"},
] as const;
export function isConfiguredChatModel(id: unknown): id is typeof CHAT_MODEL_CARDS[number]["id"] {
  return typeof id==="string" && CHAT_MODEL_CARDS.some(x=>x.id===id);
}
export function resolveSuggestedModel(text:string,hasImage=false):string {
  if (hasImage) return "Fanar-Oryx-IVU-2";
  const q=text.toLowerCase();
  if (/\b(quran|hadith|islam|allah|prophet|fatwa|salah|ramadan)\b/i.test(q) ||
      /(قرآن|حديث|إسلام|اسلام|الله|رسول|نبي|فتوى|صلاة|رمضان|سورة|آية|اية)/.test(text)) return "Fanar-Sadiq-2";
  if (/\b(prove|proof|derive|complex|advanced|analyze deeply|reason step by step)\b/i.test(q) ||
      /(برهن|اثبت|اشتق|حلل بعمق|مسألة صعبة|تفكير عميق)/.test(text) || text.length>900) return "Fanar-C-2-27B";
  if (/\b(why|explain why|solve|calculate|equation|geometry|physics|logic)\b/i.test(q) ||
      /(ليه|لماذا|حل|احسب|معادلة|هندسة|فيزياء|منطق|اشرح السبب)/.test(text)) return "Fanar-C-1-8.7B";
  if (text.length<160 && !/[?\u061f]/.test(text)) return "Fanar-S-1-7B";
  return "Fanar";
}
/** Keep the client picker synced with declared backend model IDs. */
export function validateRegistry(){
  const pickerIds=FANAR_CAPABILITIES.filter(x=>x.visibleInPicker).map(x=>x.id).sort();
  const supported=CHAT_MODEL_CARDS.map(x=>x.id).sort();
  return JSON.stringify(pickerIds)===JSON.stringify(supported);
}
