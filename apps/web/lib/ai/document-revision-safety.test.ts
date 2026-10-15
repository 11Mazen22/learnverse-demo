import test from "node:test";
import assert from "node:assert/strict";
import {
 canCreateExtractedRevision,
 requiresPartialExtractionAcknowledgement,
 revisionRequiresExtractedDraft,
} from "./document-revision-safety.ts";

test("partial extraction requires explicit acknowledgement before reconstruction",()=>{
 for(const mode of ["preview","edit","compare"] as const){
  assert.equal(requiresPartialExtractionAcknowledgement(true,mode),true);
  assert.equal(canCreateExtractedRevision(true,false,mode),false);
  assert.equal(canCreateExtractedRevision(true,true,mode),true);
  assert.equal(canCreateExtractedRevision(false,false,mode),true);
 }
});

test("native PDF page operations and targeted Office edits do not require extracted full-document text",()=>{
 assert.equal(revisionRequiresExtractedDraft("pages"),false);
 assert.equal(requiresPartialExtractionAcknowledgement(true,"pages"),false);
 assert.equal(canCreateExtractedRevision(true,false,"pages"),true);
 assert.equal(revisionRequiresExtractedDraft("targeted"),false);
 assert.equal(requiresPartialExtractionAcknowledgement(true,"targeted"),false);
 assert.equal(canCreateExtractedRevision(true,false,"targeted"),true);
});

test("text-backed revisions continue to require an extracted draft while native page revisions do not",()=>{
 assert.equal(revisionRequiresExtractedDraft("edit"),true);
 assert.equal(revisionRequiresExtractedDraft("compare"),true);
 assert.equal(revisionRequiresExtractedDraft("preview"),true);
 assert.equal(revisionRequiresExtractedDraft("pages"),false);
});
