export type NoataAIIntent="general"|"fast"|"reasoning"|"deep-reasoning"|"islamic"|"vision"|"translation"|"moderation"|"poetry";

export function chooseFanarModel(input:{
  intent?:NoataAIIntent;
  hasImage?:boolean;
  islamic?:boolean;
  complexity?:"low"|"medium"|"high";
}){
  if(input.hasImage)return "Fanar-Oryx-IVU-2";
  if(input.islamic||input.intent==="islamic")return "Fanar-Sadiq-2";
  if(input.intent==="poetry")return "Fanar-Diwan";
  if(input.intent==="translation")return "Fanar-Shaheen-MT-1";
  if(input.intent==="moderation")return "Fanar-Guard-2";
  if(input.intent==="fast"||input.complexity==="low")return "Fanar-S-1-7B";
  if(input.intent==="deep-reasoning"||input.complexity==="high")return "Fanar-C-2-27B";
  if(input.intent==="reasoning"||input.complexity==="medium")return "Fanar-C-1-8.7B";
  return "Fanar";
}
