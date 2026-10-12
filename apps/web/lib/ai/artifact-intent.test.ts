import test from "node:test";
import assert from "node:assert/strict";
import {detectArtifactIntent,artifactContent,checkArtifactContent,validArtifactBytes} from "./artifact-intent.ts";
import {createConversationalArtifact,type ArtifactDriver} from "./artifact-runner.ts";
const owner="11111111-1111-4111-8111-111111111111",id="22222222-2222-4222-8222-222222222222";
test("Noata only creates explicitly requested files and uses previous answer for 'that'",()=>{
 assert.deepEqual(detectArtifactIntent("Can you make a PDF for that?"),{kind:"pdf",usePrevious:true});
 assert.deepEqual(detectArtifactIntent("اصنع ملف بوربوينت عن الطاقة"),{kind:"pptx",usePrevious:false});
 assert.deepEqual(detectArtifactIntent("جهز ملف إكسل للدرجات"),{kind:"xlsx",usePrevious:false});
 assert.equal(detectArtifactIntent("How do I create a PDF?"),null);
 assert.equal(detectArtifactIntent("can you make pdf?"),null);
 assert.equal(detectArtifactIntent("هل تقدر تعمل PDF؟"),null);
 assert.equal(detectArtifactIntent("إزاي اعمل PDF؟"),null);
 assert.equal(detectArtifactIntent("I read a PDF yesterday"),null);
 assert.equal(detectArtifactIntent("Create PDF and Excel"),null);
 assert.equal(artifactContent({kind:"pdf",usePrevious:true},"Let me make it","# Temperature chart"),"# Temperature chart");
});
test("Workbook and slideshow requests require suitable source content",()=>{
 assert.equal(checkArtifactContent("xlsx","An ordinary paragraph"),"table_required");
 assert.equal(checkArtifactContent("pptx","A paragraph"),"slides_required");
 assert.equal(checkArtifactContent("xlsx","| Day | Value |\n|---|---|\n| Mon | 24 |"),null);
 assert.equal(checkArtifactContent("pptx","# Physics\n- Forces"),null);
});
test("Generation persists verified bytes before publishing a message artifact",async()=>{
 const log:string[]=[];
 const data=new Uint8Array(250);
 data.set(new TextEncoder().encode("%PDF-1.7"));
 const driver:ArtifactDriver={
  renderPdf:async()=>data,
  upload:async()=>{log.push("upload");},
  insert:async()=>{log.push("insert");},
  attach:async()=>{log.push("attach");},
  remove:async()=>{log.push("remove");},
  removeRecord:async()=>{log.push("removeRecord");}
 };
 const input={intent:{kind:"pdf" as const,usePrevious:false},content:"# Report",owner,id,title:"Report",signal:new AbortController().signal,driver};
 const result=await createConversationalArtifact(input);
 assert.equal(result.mimeType,"application/pdf");
 assert.equal(result.filename,"Report.pdf");
 assert.equal(result.storagePath,owner+"/"+id+"/noata-"+id.slice(0,8)+".pdf");
 assert.deepEqual(log,["upload","insert","attach"]);
 log.length=0;
 await assert.rejects(createConversationalArtifact({...input,driver:{...driver,attach:async()=>{throw Error("attach failed")}}}),/attach failed/);
 assert.deepEqual(log,["upload","insert","removeRecord","remove"]);
 log.length=0;
 await assert.rejects(createConversationalArtifact({...input,driver:{...driver,renderPdf:async()=>new Uint8Array(250)}}),/generated_file_invalid/);
 assert.equal(log.length,0);
});
test("Office file signatures are checked, not merely the extension",()=>{
 const fake=new Uint8Array(300);
 assert.equal(validArtifactBytes("pdf",fake),false);
 assert.equal(validArtifactBytes("docx",fake),false);
});

test("Creative Studio source is data, not a second competing output-format request",()=>{
 const prompt="Improve and recreate this document as a PDF file with polished headings.\n\nVerified extracted original document content:\n# Instructions\nCreate Excel charts and PowerPoint slides\nMake an image of mountains";
 assert.deepEqual(detectArtifactIntent(prompt),{kind:"pdf",usePrevious:false});
});

test("Artifact transaction never uploads a clarification reply",async()=>{
 let invoked=false;
 const driver={renderPdf:async()=>{invoked=true;return new Uint8Array(250);}} as unknown as ArtifactDriver;
 await assert.rejects(createConversationalArtifact({intent:{kind:"pdf",usePrevious:false},content:"I need more specific details to proceed. Could you please tell me what aspects of chocolate you want?",owner,id,title:"Chocolate",signal:new AbortController().signal,driver}),/unfinished_content/);
 assert.equal(invoked,false);
});

 test("A generated PDF uses its descriptive artifact title instead of the conversation prompt",async()=>{
 const data=new Uint8Array(250);data.set(new TextEncoder().encode("%PDF-1.7"));
 let renderedTitle="";
 const driver:ArtifactDriver={renderPdf:async(_source,title)=>{renderedTitle=title;return data;},upload:async()=>{},insert:async()=>{},attach:async()=>{},remove:async()=>{},removeRecord:async()=>{}};
 const file=await createConversationalArtifact({intent:{kind:"pdf",usePrevious:false},content:"# مراجعة البناء الضوئي\n\nدرس مكتمل",owner,id,title:"Create a downloadable PDF, please...",signal:new AbortController().signal,driver});
 assert.equal(file.filename,"مراجعة البناء الضوئي.pdf");
 assert.equal(renderedTitle,"مراجعة البناء الضوئي");
 });

test("The observed plural PDF follow-up references the actual previous answer",()=>{
 for(const prompt of ["Make them in a pdf","Convert those into a PDF","Make these a PDF","Save it as a PDF","Can you make a PDF for them?","اعمل دول PDF"]){
  assert.deepEqual(detectArtifactIntent(prompt),{kind:"pdf",usePrevious:true},prompt);
 }
 assert.deepEqual(detectArtifactIntent("Make a PDF about sea level"),{kind:"pdf",usePrevious:false});
});
