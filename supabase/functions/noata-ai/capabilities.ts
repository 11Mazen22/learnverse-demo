/** Noata AI capability contracts, provider configuration != live verification. */
export type CapabilityId="chat"|"research.search"|"research.scholarly"|"text.translate"|"image.generate"|"image.inpaint"|"image.background_remove"|"voice.transcribe"|"voice.speak"|"document.pdf"|"document.docx"|"document.pdf.page_edit"|"document.pdf.annotate"|"document.office.targeted_edit"|"memory.recall"|"artifact.xlsx"|"artifact.pptx"|"projects.manage";
export type CapabilityStatus="configured"|"unavailable"|"planned"|"local";
export type CapabilityDefinition={id:CapabilityId;category:"conversation"|"research"|"creative"|"documents"|"voice"|"personalization"|"workspace";provider:"fanar"|"brave"|"open"|"local"|"none";requiresAuth:boolean;sideEffects:boolean};
export const CAPABILITIES:readonly CapabilityDefinition[]=[
 {id:"chat",category:"conversation",provider:"fanar",requiresAuth:true,sideEffects:false},
 {id:"research.search",category:"research",provider:"brave",requiresAuth:true,sideEffects:false},
 {id:"research.scholarly",category:"research",provider:"open",requiresAuth:true,sideEffects:false},
 {id:"text.translate",category:"conversation",provider:"fanar",requiresAuth:true,sideEffects:false},
 {id:"image.generate",category:"creative",provider:"fanar",requiresAuth:true,sideEffects:true},
 {id:"image.inpaint",category:"creative",provider:"none",requiresAuth:true,sideEffects:true},
 {id:"image.background_remove",category:"creative",provider:"none",requiresAuth:true,sideEffects:true},
 {id:"voice.transcribe",category:"voice",provider:"fanar",requiresAuth:true,sideEffects:false},
 {id:"voice.speak",category:"voice",provider:"fanar",requiresAuth:true,sideEffects:true},
 {id:"document.pdf",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"document.docx",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"document.pdf.page_edit",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"document.pdf.annotate",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"document.office.targeted_edit",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"memory.recall",category:"personalization",provider:"local",requiresAuth:true,sideEffects:false},
 {id:"artifact.xlsx",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"artifact.pptx",category:"documents",provider:"local",requiresAuth:true,sideEffects:true},
 {id:"projects.manage",category:"workspace",provider:"local",requiresAuth:true,sideEffects:true}
] as const;
export type CapabilityAvailability={id:CapabilityId;status:CapabilityStatus;requiresAuth:boolean;sideEffects:boolean};
export function getCapabilityAvailability(env:{fanar:boolean;brave:boolean;memorySchema:boolean}):CapabilityAvailability[]{
 return CAPABILITIES.map(({id,provider,requiresAuth,sideEffects})=>{
  let status:CapabilityStatus=provider==="none"?"planned":provider==="local"?"local":provider==="open"?"configured":
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

/** Safe provider-aware capability statement for the assistant's system context.
 * Configuration is not a receipt or proof that a live tool call succeeded.
 */
export function capabilitySystemContext(env:{fanar:boolean;brave:boolean;memorySchema:boolean}):string{
 const list=getCapabilityAvailability(env);
 const status=(id:CapabilityId)=>list.find(x=>x.id===id)?.status??"unavailable";
 const available=(id:CapabilityId)=>["local","configured"].includes(status(id));
 return [
 "NOATA APP CAPABILITY CONTRACT — authoritative about the surrounding application, not model-generated claims.",
 "The chat application supports PDF, DOCX, XLSX, and PPTX generation from complete, useful answer content. File cards are evidence ONLY after validation and persistence succeed. It also has a Creative Studio to preview saved PDF pages and Office file content, edit drafts, ask for improvements, export revisions, and save new owner-scoped files. Some complex Office visuals and layout fidelity are not yet preserved on editing.",
 "Never claim that a file was generated, attached, downloaded or stored from model text alone; wait for the application receipt. Do not ask for another confirmation when the request clearly specifies the deliverable, unless an essential detail is actually missing.",
 "Image generation: "+(available("image.generate")?"provider credential configured; an explicit single raster image prompt may execute, but success depends on the actual provider response.":"provider unavailable; do not claim an image was created.")+
  " Generative image inpainting and background removal are NOT implemented. Basic image generation does not prove an edit succeeded. Guaranteed transparency, vector SVG and multiple independent image generations are also NOT verified features.",
 "PDF editing boundary: built-in edits include native page reorder/rotation and portable page-level sticky-note annotations that preserve source page text and layout. Annotation is not text replacement or redaction. Arbitrary PDF text or layout replacement is NOT implemented. Text reconstruction from partial/scanned extraction may omit content; require acknowledgement before creating a separate reconstruction.",
 "Office editing boundary: targeted single-paragraph or single-cell edits are available only for supported OOXML structures. Complex visuals, layouts and unsupported package features may not be preserved; never imply a universal Word/Excel/PowerPoint editor.",
 "Web research: "+(available("research.search")?"Brave provider is configured; only validated returned sources are live evidence.":"Brave live web provider is NOT configured. Wikipedia snippets and open scholarly records may supply encyclopedic and bibliographic background but must not be represented as current web research.")+
   " Open scholarly records (Crossref bibliographic metadata: titles, abstracts, DOIs, publication years) are available for non-current research topics; cite them honestly as scholarly records, never as live web pages or breaking news."+
  " Do not invent source links, search activity, dates or verified external pages.",
 "Speech and voice: "+(available("voice.transcribe")?"provider key configured; actual audio operations are independently authenticated.":"live provider unavailable; do not imply speech recognition succeeded."),
 "Memory is optional, owner-scoped and consent-gated. Previous chats may only be accessed through authorized verified retrieval in non-temporary conversations. If context is missing, do not guess a prior user's exact words.",
 "When the user asks what Noata can do, explain concrete supported tasks alongside their constraints. Avoid generic apologies that claim PDF/Word/Excel/PowerPoint creation is inherently impossible."
 ].join("\n");
}
