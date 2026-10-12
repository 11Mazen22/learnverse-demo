import {artifactFilename} from "./artifact-filename.ts";
import {isNonDeliverableDraft} from "./delivery-quality.ts";
import {isArtifactRefusal} from "./artifact-response-guard.ts";
/** Genesis artifact transaction: no success until bytes, storage, row and message link exist. */
import {checkArtifactContent,validArtifactBytes,type ArtifactIntent,type ArtifactKind} from "./artifact-intent.ts";
export type CreatedArtifact={
 id:string;format:ArtifactKind;filename:string;storagePath:string;mimeType:string;byteSize:number;
};
export const AI_ARTIFACT_BUCKET="noata-ai-artifacts";
const mime:Record<ArtifactKind,string>={
 pdf:"application/pdf",
 docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
 xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"
};
export type ArtifactDriver={
 renderPdf:(source:string,title:string,signal:AbortSignal)=>Promise<Uint8Array>;
 upload:(path:string,bytes:Uint8Array,mimeType:string)=>Promise<void>;
 insert:(artifact:CreatedArtifact,owner:string)=>Promise<void>;
 attach:(artifact:CreatedArtifact)=>Promise<void>;
 remove:(path:string)=>Promise<void>;
 removeRecord:(id:string)=>Promise<void>;
};
export async function createConversationalArtifact(input:{
 intent:ArtifactIntent;content:string;owner:string;id:string;title:string;signal:AbortSignal;driver:ArtifactDriver;
}):Promise<CreatedArtifact>{
 const {intent,content,owner,id,title,signal,driver}=input;
 const invalid=checkArtifactContent(intent.kind,content);
 if(invalid)throw Error(invalid);
 if(isNonDeliverableDraft(content)||isArtifactRefusal(content))throw Error("unfinished_content");
 if(!/^[0-9a-f-]{36}$/i.test(owner)||!/^[0-9a-f-]{36}$/i.test(id))throw Error("invalid_identity");
 if(signal.aborted)throw Error("cancelled");
 const filename=artifactFilename({format:intent.kind,title:content.match(/^#\s+(.+)$/m)?.[1]??title,content});
 const documentTitle=filename.slice(0,-(intent.kind.length+1));
 let bytes:Uint8Array;
 if(intent.kind==="pdf")bytes=await driver.renderPdf(content,documentTitle,signal);
 else if(intent.kind==="docx")bytes=(await import("./docx-export.ts")).createNoataDocx(content);
 else if(intent.kind==="xlsx")bytes=(await import("./xlsx-export.ts")).createNoataXlsx(content);
 else bytes=(await import("./pptx-export.ts")).createNoataPptx(content);
 if(signal.aborted)throw Error("cancelled");
 if(!validArtifactBytes(intent.kind,bytes))throw Error("generated_file_invalid");
 const storagePath=owner+"/"+id+"/noata-"+id.slice(0,8)+"."+intent.kind;
 const artifact:CreatedArtifact={id,format:intent.kind,filename,storagePath,mimeType:mime[intent.kind],byteSize:bytes.byteLength};
 let uploaded=false,recorded=false;
 try{
  await driver.upload(storagePath,bytes,artifact.mimeType);uploaded=true;
  if(signal.aborted)throw Error("cancelled");
  await driver.insert(artifact,owner);recorded=true;
  if(signal.aborted)throw Error("cancelled");
  await driver.attach(artifact);
  return artifact;
 }catch(error){
  if(recorded)await driver.removeRecord(id).catch(()=>{});
  if(uploaded)await driver.remove(storagePath).catch(()=>{});
  throw error;
 }
}
