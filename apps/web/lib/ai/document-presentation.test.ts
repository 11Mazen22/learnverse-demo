import test from "node:test";import assert from "node:assert/strict";
import {readDocumentSource,storedDocumentSource,requestedDocumentPresentation} from "./document-presentation.ts";
test("A library revision retains its canonical content, font and palette after reopening",()=>{
 const text="# دليل\n\nA complete original section.\n\n$$x^2$$";
 const stored=storedDocumentSource(text,{style:"forest",font:"editorial"});
 assert.deepEqual(readDocumentSource(stored),{text,presentation:{style:"forest",font:"editorial"}});
 assert.equal(readDocumentSource(text).text,text);
 assert.throws(()=>storedDocumentSource("x".repeat(160000),{style:"classic",font:"noata"}),/source_content_limit/);
});
test("Natural style requests apply allowlisted choices and preserve an existing appearance on ordinary edits",()=>{
 assert.deepEqual(requestedDocumentPresentation("Use Lora and a calm forest palette"),{style:"forest",font:"editorial"});
 assert.deepEqual(requestedDocumentPresentation("Fix the explanation",{style:"forest",font:"editorial"}),{style:"forest",font:"editorial"});
 assert.equal(requestedDocumentPresentation("Improve this file\nVerified extracted original document content:\nUse Roboto Mono").font,"noata");
 assert.deepEqual(readDocumentSource('<!-- noata-document-presentation {"version":1,"style":"url(unsafe)","font":"evil"} -->\nText').presentation,{style:"classic",font:"noata"});
});
