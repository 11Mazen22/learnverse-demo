import test from "node:test";import assert from "node:assert/strict";
import {createNoataDocx} from "./docx-export.ts";
import {createNoataXlsx} from "./xlsx-export.ts";
import {createNoataPptx} from "./pptx-export.ts";
import {inspectOfficeArtifact} from "./studio-file-inspect.ts";
test("Real DOCX/PPTX/XLSX package content is inspected rather than fabricated",async()=>{
 const word=await inspectOfficeArtifact(createNoataDocx("# A real document\nA genuine written paragraph."),"docx");
 assert.match(word.editableText,/genuine written paragraph/);
 const deck=await inspectOfficeArtifact(createNoataPptx("# Introduction\n- First detail\n# Conclusion\n- Final detail"),"pptx");
 assert.ok(deck.pages.length>=2);
 assert.match(deck.editableText,/Conclusion/);
 const book=await inspectOfficeArtifact(createNoataXlsx("| Day | Temperature |\n|---|---|\n| Mon | 23 |\n| Tue | 25 |"),"xlsx");
 assert.match(book.editableText,/Temperature/);
 assert.match(book.editableText,/23/);
});
test("Untrusted arbitrary bytes are never treated as Office content",async()=>{
 await assert.rejects(inspectOfficeArtifact(new Uint8Array(180),"pptx"),/Unsupported|Invalid/);
});
