/** Noata AI capability contracts, provider configuration != live verification. */
export type CapabilityId="chat"|"research.search"|"text.translate"|"image.generate"|"voice.transcribe"|"voice.speak"|"document.pdf"|"document.docx"|"memory.recall"|"artifact.xlsx"|"artifact.pptx"|"projects.manage";
export type CapabilityStatus="configured"|"unavailable"|"planned"|"local";
export type CapabilityDefinition={id:CapabilityId;category:"conversation"|"research"|"creative"|"documents"|"voice"|"personalization"|"workspace";provider:"fanar"|"brave"|"local"|"none";requiresAuth:boolean;sideEffects:boolean};
export const CAPABILITIES:readonly CapabilityDefinition[]=[
 {id:"chat",category:"conversation",provider:"fanar",requiresAuth:true,sideEffects:false},
 {id:"research.search",category:"research",provider:"brave",requiresAuth:true,sideEffects:false},
 {id:"text.translate",category:"conversation",provider:"fanar",requiresAuth:true,sideEffects:false},
 {id:"image.generate",category:"creative",provider:"fanar",requiresAuth:true,sideEffects:true},
 {id:"voice.transcribe",category:"voice",provider:"fanar",requiresAuth:true,sideEffects:false},
 {id:"voice.speak",category:"voice",provider:"fanar",requiresAuth:true,sideEffects:true},
 {id:"document.pdf",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"document.docx",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"memory.recall",category:"personalization",provider:"local",requiresAuth:true,sideEffects:false},
 {id:"artifact.xlsx",category:"documents",provider:"none",requiresAuth:true,sideEffects:true},
 {id:"artifact.pptx",category:"documents",provider:"none",requiresAuth:true,sideEffects:true},
 {id:"projects.manage",category:"workspace",provider:"none",requiresAuth:true,sideEffects:true}
] as const;
export type CapabilityAvailability={id:CapabilityId;status:CapabilityStatus;requiresAuth:boolean;sideEffects:boolean};
export function getCapabilityAvailability(env:{fanar:boolean;brave:boolean;memorySchema:boolean}):CapabilityAvailability[]{
 return CAPABILITIES.map(({id,provider,requiresAuth,sideEffects})=>{
  let status:CapabilityStatus=provider==="none"?"planned":provider==="local"?"local":
    provider==="fanar"?(env.fanar?"configured":"unavailable"):(env.brave?"configured":"unavailable");
  if(id==="memory.recall")status=env.memorySchema?"local":"unavailable";
  return {id,status,requiresAuth,sideEffects};
 });
}
type TranslationInput={text:string;langpair:"ar-en"|"en-ar"};
type ImageInput={prompt:string};
export type CapabilityExecution=
 |{id:"text.translate";input:TranslationInput}
 |{id:"image.generate";input:ImageInput};
export type CapabilityValidation={ok:true;request:CapabilityExecution}|{ok:false;reason:"unsupported_capability"|"invalid_input"};
export function validateCapabilityExecution(value:unknown):CapabilityValidation{
 if(!value||typeof value!=="object"||Array.isArray(value))return {ok:false,reason:"invalid_input"};
 const raw=value as Record<string,unknown>,input=raw.input;
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false,reason:"invalid_input"};
 const v=input as Record<string,unknown>;
 if(raw.id==="text.translate"){
  if(typeof v.text!=="string"||v.text.trim().length===0||v.text.length>5000||!(v.langpair==="ar-en"||v.langpair==="en-ar"))return {ok:false,reason:"invalid_input"};
  return {ok:true,request:{id:"text.translate",input:{text:v.text,langpair:v.langpair}}};
 }
 if(raw.id==="image.generate"){
  if(typeof v.prompt!=="string"||v.prompt.trim().length<3||v.prompt.length>3000)return {ok:false,reason:"invalid_input"};
  return {ok:true,request:{id:"image.generate",input:{prompt:v.prompt}}};
 }
 return {ok:false,reason:"unsupported_capability"};
}
