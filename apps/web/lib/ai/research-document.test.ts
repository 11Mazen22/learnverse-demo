import test from "node:test";
import assert from "node:assert/strict";
import {documentWithResearch} from "./research-document.ts";
const source={id:1,title:"Photosynthesis",url:"https://en.wikipedia.org/wiki/Photosynthesis",domain:"en.wikipedia.org",excerpt:"Light to chemical energy.",retrievedAt:"2026-10-13T17:00:00Z"};
const research={version:1,status:"complete",reason:"encyclopedia_background",sources:[source],elapsedMs:10};
test("Document export retains actual retrieved citations and labels limited background",()=>{
 const value=documentWithResearch("## Summary\nLight is converted to chemical energy [1].",research,"en","pdf");
 assert.match(value,/\[1\]\(<https:\/\/en.wikipedia.org\/wiki\/Photosynthesis>\)/);
 assert.equal((value.match(/https:\/\/en.wikipedia.org/g)??[]).length,2);
 assert.match(value,/\*\*\[1\] Photosynthesis\*\* · en.wikipedia.org\n  https:\/\/en.wikipedia.org\/wiki\/Photosynthesis/);
 assert.equal(documentWithResearch(value,research,"en","pdf"),value,"Repeated exports retain one reference list");
 const uncited=documentWithResearch("Light to chemical energy.",research,"en","docx");
 assert.match(uncited,/Retrieved references/);assert.match(uncited,/do not verify news/);
 assert.equal(documentWithResearch("Workbook",research,"en","xlsx"),"Workbook");
});
test("Unavailable or unsafe evidence cannot become document citations",()=>{
 assert.equal(documentWithResearch("Content",{...research,status:"unavailable"},"en","pdf"),"Content");
 assert.equal(documentWithResearch("Content",{...research,sources:[{...source,url:"https://127.0.0.1/private"}]},"en","pdf"),"Content");
});

test("Every source remains readable when inline PDF link actions are removed",()=>{
 const second={...source,id:2,title:"Artificial photosynthesis",url:"https://en.wikipedia.org/wiki/Artificial_photosynthesis"};
 const value=documentWithResearch("Background [1]. More context [2].",{...research,sources:[source,second]},"en","pdf");
 for(const item of [source,second])assert.ok(value.includes("\n  "+item.url));
 assert.match(value,/do not verify news or current claims/);
});
