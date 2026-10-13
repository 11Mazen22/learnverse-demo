import test from "node:test";
import assert from "node:assert/strict";
import {requestLocale,documentApiBody} from "./document-api-copy.ts";
test("Document errors honor explicit UI language across bilingual browsers",()=>{
 const en=new Headers({cookie:"other=1; noata_locale=en", "accept-language":"ar-EG"});
 assert.equal(requestLocale(en),"en");
 assert.deepEqual(documentApiBody({error:"تعذّر حفظ المستند الأصلي."},en),{error:"Could not save the original document."});
 assert.equal(requestLocale(new Headers({"accept-language":"en-US,en;q=0.9"})),"en");
 assert.deepEqual(documentApiBody({error:"سجّل الدخول."},new Headers({cookie:"noata_locale=ar","accept-language":"en"})),{error:"سجّل الدخول."});
});
test("Download metadata is unchanged and unknown internal errors are not echoed",()=>{
 const headers=new Headers({cookie:"noata_locale=en"});
 const file={name:"مراجعة.pdf",url:"https://example.invalid/private"};
 assert.equal(documentApiBody(file,headers),file);
 assert.deepEqual(documentApiBody({error:"private diagnostic value"},headers),{error:"The document operation could not be completed."});
});
