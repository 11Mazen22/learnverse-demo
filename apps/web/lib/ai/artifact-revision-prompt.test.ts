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

test("Unreadable PDF glyphs are disclosed and control bytes never enter a revision request",()=>{
 const prompt=artifactRevisionPrompt("pdf","# Test\nA\u0000B\tC","en");
 assert.match(prompt,/could not be read/);
 assert.ok(!prompt.includes("\u0000"));
 assert.ok(prompt.includes("# Test\nAB\tC"));
 assert.match(artifactRevisionPrompt("pdf","س\u0000ص","ar"),/راجع الملف الأصلي/);
});
