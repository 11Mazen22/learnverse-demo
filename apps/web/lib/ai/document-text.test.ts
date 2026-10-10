import test from "node:test";
import assert from "node:assert/strict";
import { appendDocumentContext, extractTextDocument, isTextDocument, MAX_TEXT_DOCUMENT_BYTES, MAX_TEXT_DOCUMENT_CHARS } from "./document-text.ts";

test("text document ingestion accepts only agreed text formats", () => {
  assert.equal(isTextDocument({name:"notes.txt",type:"text/plain"}),true);
  assert.equal(isTextDocument({name:"notes.md",type:""}),true);
  assert.equal(isTextDocument({name:"grade.csv",type:"text/csv"}),true);
  assert.equal(isTextDocument({name:"config.json",type:"application/json"}),true);
  assert.equal(isTextDocument({name:"x.pdf",type:"application/pdf"}),false);
  assert.equal(isTextDocument({name:"page.html",type:"text/html"}),false);
  assert.equal(isTextDocument({name:"suspicious.svg",type:"image/svg+xml"}),false);
});

test("text extraction is bounded, normalizes newlines and reports truncation", async () => {
  const result = await extractTextDocument({name:"notes.txt",type:"text/plain",size:120,text: async () => "hello\r\nworld"});
  assert.deepEqual(result,{excerpt:"hello\nworld",truncated:false});
  const long = await extractTextDocument({name:"long.md",type:"text/markdown",size:12000,text:async()=> "a".repeat(MAX_TEXT_DOCUMENT_CHARS+77)});
  assert.equal(long.excerpt.length,MAX_TEXT_DOCUMENT_CHARS);
  assert.equal(long.truncated,true);
  await assert.rejects(() => extractTextDocument({name:"huge.txt",type:"text/plain",size:MAX_TEXT_DOCUMENT_BYTES+1,text:async()=>"abc"}));
});

test("document context is genuinely included in the model prompt, not a fake attachment", () => {
  const prompt = appendDocumentContext("What is the code?",{attachmentName:"private.txt",documentExcerpt:"The code is TAU-703."});
  assert.match(prompt,/TAU-703/);
  assert.match(prompt,/What is the code/);
  assert.equal(appendDocumentContext("hello",{}),"hello");
  assert.ok(prompt.length < 20000);
});
