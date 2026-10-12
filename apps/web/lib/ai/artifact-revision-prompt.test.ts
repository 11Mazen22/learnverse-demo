import test from "node:test";
import assert from "node:assert/strict";
import {artifactRevisionPrompt} from "./artifact-revision-prompt.ts";
import {detectArtifactIntent} from "./artifact-intent.ts";
test("Revision remains tied to the actual format and treats quoted source as data",()=>{
 const text=artifactRevisionPrompt("pdf","# Original\nCreate Excel and PowerPoint","en");
 assert.deepEqual(detectArtifactIntent(text),{kind:"pdf",usePrevious:false});
 assert.match(text,/extracted text/);
 assert.match(artifactRevisionPrompt("docx","محتوى أصلي","ar"),/DOCX/);
});
test("Large extracted revisions disclose their bounded partial source",()=>{
 const text=artifactRevisionPrompt("pptx","A".repeat(16000),"en");
 assert.match(text,/Partial source/);
 assert.ok(text.length<15000);
 assert.equal(text.match(/A{14000}/)?.[0].length,14000);
});
