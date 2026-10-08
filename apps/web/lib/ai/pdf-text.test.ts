import test from "node:test";import assert from "node:assert/strict";
import {pdfTextLines,reconstructPdfLine} from "./pdf-text.ts";
test("shaped Arabic glyph runs reconstruct logical readable text without invented spaces",()=>{
 const items=[..."ﺔﻴﺑﺮﻋ"].map((str,i)=>({str,dir:"rtl",transform:[1,0,0,1,i*10,100]}));
 assert.equal(reconstructPdfLine(items),"عربية");
 assert.deepEqual(pdfTextLines([...items,{str:"English reference",transform:[1,0,0,1,0,50]}]),["عربية","English reference"]);
});
test("normal multi-character PDF text runs keep their existing logical order",()=>{
 assert.equal(reconstructPdfLine([{str:"نص عربي",dir:"rtl",transform:[]},{str:"English",dir:"ltr",transform:[]}]),"نص عربي English");
});
