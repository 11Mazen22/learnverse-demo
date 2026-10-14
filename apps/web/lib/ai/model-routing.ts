import {resolveAutoRoute} from "../../../../supabase/functions/noata-ai/routing.ts";
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
  {id:"Fanar-Guard-2",arabic:"حارس 2",subtitle:"مراجعة السلامة",description:"فحص سلامة النص والوعي الثقافي. لا يتحقق من صحة المعلومات.",features:["فحص السلامة","درجات فعلية"],bestFor:"safety"},
  {id:"Fanar-Diwan",arabic:"ديوان",subtitle:"شعر إبداعي",description:"يصوغ الشعر من فكرتك؛ يخضع لإتاحة مزود الخدمة.",features:["مسودة شعرية","صياغة إبداعية"],bestFor:"creative"},
  {id:"Fanar-Oryx-IVU-2", arabic:"أوريكس رؤية",subtitle:"فهم الصور",description:"يقبل صورة مرفقة مع سؤال نصي.",features:["رؤية","صورة"],bestFor:"vision"},
] as const;
export function getChatModelCards(locale:"ar"|"en"="ar"){
  if(locale==="ar")return CHAT_MODEL_CARDS;
  const copy:Record<string,{subtitle:string;description:string;features:string[]}>= {
    Fanar:{subtitle:"Everyday conversations",description:"General conversation, explanation, and writing.",features:["Text","Streaming"]},
    "Fanar-S-1-7B":{subtitle:"Quick Arabic replies",description:"Brief Arabic questions and greetings. English requests use the general route in Auto.",features:["Text","Streaming"]},
    "Fanar-C-1-8.7B":{subtitle:"Reasoning and explanation",description:"Problems and step-by-step explanations.",features:["Text","Reasoning"]},
    "Fanar-C-2-27B":{subtitle:"Complex tasks",description:"Detailed explanations and more demanding problems.",features:["Text","Reasoning","Streaming"]},
    "Fanar-Sadiq":{subtitle:"Islamic questions",description:"Specialized answers. Responses are not an authoritative Quran text.",features:["Text","Islamic studies"]},
    "Fanar-Guard-2":{subtitle:"Safety review",description:"Screens text for safety and cultural awareness. This is not a factual accuracy check.",features:["Safety screening","Actual scores"]},
    "Fanar-Diwan":{subtitle:"Creative poetry",description:"Drafts poetry from your brief, subject to provider access.",features:["Poetry drafts","Creative writing"]},
    "Fanar-Oryx-IVU-2":{subtitle:"Image understanding",description:"Ask a question about an attached image.",features:["Vision","Image"]},
  };
  return CHAT_MODEL_CARDS.map(card=>({...card,arabic:card.id,...copy[card.id]}));
}
export function isConfiguredChatModel(id: unknown): id is typeof CHAT_MODEL_CARDS[number]["id"] {
  return typeof id==="string" && CHAT_MODEL_CARDS.some(x=>x.id===id);
}
export function resolveSuggestedModel(text:string,hasImage=false):string { return resolveAutoRoute(text,hasImage).model; }
/** Keep the client picker synced with declared backend model IDs. */
export function validateRegistry(){
  const pickerIds=FANAR_CAPABILITIES.filter(x=>x.visibleInPicker).map(x=>x.id).sort();
  const supported=CHAT_MODEL_CARDS.map(x=>x.id).sort();
  return JSON.stringify(pickerIds)===JSON.stringify(supported);
}

/** Old saved choices cannot keep selecting the retired Sadiq 2 picker entry. */
export function normalizeModelChoice(value:unknown):string{
 return isConfiguredChatModel(value)?value:"auto";
}
