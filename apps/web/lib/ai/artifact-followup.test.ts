import test from "node:test";import assert from "node:assert/strict";
import {confirmedFileIntent,finishedDocumentInstruction} from "./artifact-followup.ts";
test("Continuation 'now create it' inherits only an explicit earlier authorized file format",()=>{
 assert.deepEqual(confirmedFileIntent("Yes perfect, now create it",["Make a professional PDF about machine learning"]),{kind:"pdf",usePrevious:false});
 assert.deepEqual(confirmedFileIntent("now create it",["Create Excel for test grades"]),{kind:"xlsx",usePrevious:false});
 assert.equal(confirmedFileIntent("yes perfect, now create it",["What is chocolate?"]),null);
 assert.equal(confirmedFileIntent("yes I like chocolate",["Make a PDF about cake"]),null);
 assert.match(finishedDocumentInstruction("pdf","en"),/COMPLETE document content/);
});
