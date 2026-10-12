import test from "node:test";
import assert from "node:assert/strict";
import {artifactFilename} from "./artifact-filename.ts";
test("Meaningful bilingual names have an exact validated extension",()=>{
 assert.equal(artifactFilename({format:"pdf",content:"# Newton's Laws — Revision Guide\nA lesson."}),"Newton's Laws — Revision Guide.pdf");
 assert.equal(artifactFilename({format:"docx",title:"مراجعة النحو العربي"}),"مراجعة النحو العربي.docx");
 assert.equal(artifactFilename({format:"pptx",title:"Renewable Energy.pdf"}),"Renewable Energy.pptx");
 assert.equal(artifactFilename({format:"xlsx",title:"Budget",revision:true}),"Budget — Revised.xlsx");
});
test("Filenames reject traversal, device names, secrets, addresses and misleading identifiers",()=>{
 for(const title of ["../../report","C:\\private\\lesson","CON","LPT1","teacher@example.com","API_KEY=private","Learner 1234567890","noata-819a5730","untitled"]){
  assert.equal(artifactFilename({format:"pdf",title}),"Learning guide.pdf",title);
 }
 assert.equal(artifactFilename({format:"pdf",title:"\u202eChemistry\u0000"}),"Chemistry.pdf");
 assert.ok(artifactFilename({format:"pdf",title:"علم ".repeat(100),revision:true}).length<=100);
 assert.equal(artifactFilename({format:"pdf",title:"../../secret",locale:"ar"}),"دليل تعليمي.pdf");
});

test("Provider bold headings name revisions without copying the user request",()=>{
 assert.equal(artifactFilename({format:"pdf",title:"أنشئ نسخة PDF عربية مصححة بعنوان مراجعة البناء",content:"**# مراجعة البناء الضوئي – نسخة مصححة**\n\nدرس كامل"}),"مراجعة البناء الضوئي – نسخة مصححة.pdf");
 assert.equal(artifactFilename({format:"pdf",title:"Create a PDF for this long private request",content:"This finished document has no heading."}),"Learning guide.pdf");
 assert.equal(artifactFilename({format:"pdf",title:"أنشئ ملف PDF عن العلم",content:"درس مكتمل بلا عنوان"}),"دليل تعليمي.pdf");
 assert.equal(artifactFilename({format:"pdf",title:"Conversation",content:"\\# Escaped document heading\nBody"}),"Escaped document heading.pdf");
});
