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
export {finishedDocumentInstruction} from "../../../../supabase/functions/noata-ai/file-delivery.ts";
