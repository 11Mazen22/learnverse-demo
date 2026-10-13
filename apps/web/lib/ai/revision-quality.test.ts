import test from "node:test";import assert from "node:assert/strict";
import {revisionMayLoseContent} from "./revision-quality.ts";
test("An unrequested partial rewrite cannot silently replace a complete document",()=>{
 const original="Original factual sentence. ".repeat(100);
 assert.equal(revisionMayLoseContent(original,"Shortened paragraph. ".repeat(10),"Improve clarity and preserve all sections"),true);
 assert.equal(revisionMayLoseContent(original,original+"A clearer heading.","Improve style"),false);
 assert.equal(revisionMayLoseContent(original,"A brief summary.","Summarize this in one paragraph"),false);
});
