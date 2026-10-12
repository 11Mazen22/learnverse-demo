/** Bounded contextual resolution for approving an already requested file. */
import {detectArtifactIntent,type ArtifactIntent} from "./artifact-intent.ts";
export function confirmedFileIntent(message:string,recentUserMessages:readonly string[]):ArtifactIntent|null{
 const q=message.trim();
 if(!/^(?:yes|yes perfect|perfect|okay|ok|sure|go ahead|approved|please proceed|تمام|ايوه|أيوه|ماشي|موافق)(?:[,!.،\s]+(?:now\s+)?(?:create|make|generate|export|produce|finish)\s+(?:it|the file|the document|the pdf)|[,!.،\s]+(?:اعمِل|اعمل|جهز|أنشئ|انشئ)\s*(?:الملف|ده|دا|دلوقتي))?[!.،\s]*$/i.test(q)
 &&!/^(?:now\s+)?(?:create|make|generate|export|finish)\s+(?:it|the file|the document)\s*[!.]*$/i.test(q))return null;
 for(const old of [...recentUserMessages].reverse().slice(0,12)){
  const intent=detectArtifactIntent(old);
  if(intent)return{kind:intent.kind,usePrevious:false};
 }
 return null;
}
export function finishedDocumentInstruction(kind:string,language:"ar"|"en"):string{
 return language==="ar"
 ?"تعليمات نهائية: المستخدم طلب إنشاء ملف "+kind+" ووافق على التنفيذ. اكتب المحتوى النهائي الكامل هنا، وليس خطة أو مقترحًا. استخدم عناوين وأمثلة وتفاصيل فعلية، ولا تطلب موافقة أخرى أو تقل أنك ستنشئ الملف لاحقًا."
 :"FINAL DELIVERY: The user explicitly requested a "+kind.toUpperCase()+" file and authorized creation. Write the COMPLETE document content now—not a plan, promise, outline for approval, or follow-up question. Supply substantive titled sections, correct examples, useful details and meaningful conclusions. Never say you will create the file later. The app produces and stores actual bytes after the content is ready.";
}
