import test from "node:test";import assert from "node:assert/strict";
import {normalizedDocumentSource,withoutDuplicateDocumentTitle} from "./document-source.ts";
test("Observed bare-bracket math is repaired without changing fenced code or arbitrary brackets",()=>{
 const raw="[ 6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 ]";
 assert.match(normalizedDocumentSource(raw),/^\n\$\$/);
 assert.equal(normalizedDocumentSource("[This is not mathematics]"),"[This is not mathematics]");
 const code="\x60\x60\x60latex\n"+raw+"\n\x60\x60\x60";
 assert.equal(normalizedDocumentSource(code),code);
 assert.equal(withoutDuplicateDocumentTitle("# Photosynthesis Guide\n\n## Introduction\nFacts","Photosynthesis Guide"),"## Introduction\nFacts");
 assert.equal(withoutDuplicateDocumentTitle("## Introduction\nFacts","Photosynthesis Guide"),"## Introduction\nFacts");
});

test("A filename without terminal punctuation does not duplicate the same opening question",()=>{
 assert.equal(withoutDuplicateDocumentTitle("## What is Photosynthesis?\n\nFacts","What is Photosynthesis"),"Facts");
 assert.equal(withoutDuplicateDocumentTitle("## Is it safe?\nFacts","Different topic"),"## Is it safe?\nFacts");
});
