import test from "node:test";
import assert from "node:assert/strict";
import {
 nativePdfRevisionRecord,
 pdfRevisionExtractionNotice,
} from "./pdf-revision-source.ts";

test("native page revisions have explicit operation metadata without claiming extracted text",()=>{
 const record=nativePdfRevisionRecord({
  mode:"pages",pageCount:3,order:[3,1,2],rotatePage:2,rotation:90,
 });
 assert.match(record,/# Noata native PDF revision record/);
 assert.match(record,/not extracted document text/);
 assert.match(record,/Output page order.*3, 1, 2/);
 assert.match(record,/page 2 by 90 degrees/);
 assert.match(record,/saved PDF bytes preserve the original page content/);
 assert.match(record,/Text extraction\/OCR: not used/);
});

test("native annotation revisions record their safe operation and validate note input",()=>{
 const record=nativePdfRevisionRecord({
  mode:"annotate",pageCount:2,notes:[{page:1,text:"ملاحظة أصلية",position:"top-right"}],
 });
 assert.match(record,/standard PDF \/Text sticky-note annotations/);
 assert.match(record,/Annotations added: 1/);
 assert.match(record,/not text replacement or redaction/);
 assert.throws(()=>nativePdfRevisionRecord({
  mode:"annotate",pageCount:2,notes:[{page:3,text:"bad page",position:"top-right"}],
 }),/pdf_revision_notes_invalid/);
 assert.throws(()=>nativePdfRevisionRecord({
  mode:"pages",pageCount:3,order:[1,1,3],rotatePage:1,rotation:0,
 }),/pdf_revision_page_order_invalid/);
 assert.throws(()=>nativePdfRevisionRecord({
  mode:"pages",pageCount:3,order:[1,2,3],rotatePage:4,rotation:90,
 }),/pdf_revision_rotation_invalid/);
});

test("native PDF page operations accept image-only PDFs without requiring OCR",()=>{
 const record=nativePdfRevisionRecord({
  mode:"annotate",pageCount:11,notes:[{page:11,text:"Arabic note",position:"bottom-left"}],
 });
 assert.match(record,/Text extraction\/OCR: not used/);
 assert.match(record,/Page count: 11/);
});

test("partial text extraction lists scan/damaged/truncated pages and stays empty when extraction is complete",()=>{
 assert.equal(pdfRevisionExtractionNotice({scannedPages:[],damagedPages:[],truncated:false}),"");
 const notice=pdfRevisionExtractionNotice({
  scannedPages:[2,5],
  damagedPages:[7],
  truncated:true,
 });
 assert.match(notice,/incomplete and must not be treated as a full reconstruction/);
 assert.match(notice,/2, 5/);
 assert.match(notice,/7/);
 assert.match(notice,/truncated/);
 assert.match(notice,/OCR was not performed/);
});
