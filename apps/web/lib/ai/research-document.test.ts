import test from "node:test";
import assert from "node:assert/strict";
import {documentWithResearch} from "./research-document.ts";
const source={id:1,title:"Photosynthesis",url:"https://en.wikipedia.org/wiki/Photosynthesis",domain:"en.wikipedia.org",excerpt:"Light to chemical energy.",retrievedAt:"2026-10-13T17:00:00Z"};
const research={version:1,status:"complete",reason:"encyclopedia_background",sources:[source],elapsedMs:10};
test("Document export retains actual retrieved citations and labels limited background",()=>{
 const value=documentWithResearch("## Summary\nLight is converted to chemical energy [1].",research,"en","pdf");
 assert.match(value,/\[1\]\(<https:\/\/en.wikipedia.org\/wiki\/Photosynthesis>\)/);
 assert.equal((value.match(/https:\/\/en.wikipedia.org/g)??[]).length,1);
 const uncited=documentWithResearch("Light to chemical energy.",research,"en","docx");
 assert.match(uncited,/Retrieved references/);assert.match(uncited,/do not verify news/);
 assert.equal(documentWithResearch("Workbook",research,"en","xlsx"),"Workbook");
});
test("Unavailable or unsafe evidence cannot become document citations",()=>{
 assert.equal(documentWithResearch("Content",{...research,status:"unavailable"},"en","pdf"),"Content");
 assert.equal(documentWithResearch("Content",{...research,sources:[{...source,url:"https://127.0.0.1/private"}]},"en","pdf"),"Content");
});
