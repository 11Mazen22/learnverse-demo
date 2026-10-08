import test from "node:test";import assert from "node:assert/strict";
import {documentPath,isOwnerDocumentPath,validDocumentBytes,documentFormat} from "./document-storage.ts";
import {safeStorageLink} from "./workspace.ts";
const user="e33a12a6-b488-4d98-9af0-8d76868a65d1",conversation="a52ae1c4-b13e-4a1d-8fd5-5b13b5d4c423",id="59c146f1-cf16-4a47-8b15-6034219b9172";
test("private documents bind owner, conversation and generated ID; paths cannot escape",()=>{
 const path=documentPath(user,conversation,id,"درس.pdf");assert.ok(isOwnerDocumentPath(path,user));
 assert.ok(!isOwnerDocumentPath(path,id));assert.ok(!isOwnerDocumentPath(user+"/../"+id+".pdf",user));
 assert.throws(()=>documentPath(user,"temporary",id,"درس.pdf"));assert.equal(documentFormat("file.html"),null);
});
test("private documents reject forged binary headers, invalid UTF8 and oversize files",()=>{
 assert.equal(validDocumentBytes("x.pdf",new TextEncoder().encode("<script>")),false);
 assert.equal(validDocumentBytes("x.docx",new TextEncoder().encode("plain")),false);
 assert.equal(validDocumentBytes("x.txt",new Uint8Array([255])),false);
 assert.equal(validDocumentBytes("x.txt",new Uint8Array(512*1024+1)),false);
 assert.equal(validDocumentBytes("x.txt",new TextEncoder().encode("محتوى عربي")),true);
});
test("retained-document links are confined to the authenticated project's private document bucket",()=>{
 const origin="https://staging.supabase.co",link=origin+"/storage/v1/object/sign/noata-documents/owner/file.pdf?token=example";
 assert.equal(safeStorageLink(link,origin,"noata-documents"),link);
 assert.equal(safeStorageLink(link,"https://other.supabase.co","noata-documents"),null);
 assert.equal(safeStorageLink(link.replace("noata-documents","public"),origin,"noata-documents"),null);
 assert.equal(safeStorageLink(link,origin),null);
});
