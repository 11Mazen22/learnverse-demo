import test from "node:test";import assert from "node:assert/strict";
import {fileDeliveryInstruction} from "../../../../supabase/functions/noata-ai/file-delivery.ts";
test("Scoped revisions do not ask a provider to replace the whole document",()=>{
 for(const format of ["pdf","docx","xlsx","pptx"]){
  const message=fileDeliveryInstruction(format,"en",2);
  assert.match(message,/ONLY the selected source section/);assert.match(message,/heading at level 2/);assert.doesNotMatch(message,/one descriptive # title|4-8 slides/);
 }
 assert.match(fileDeliveryInstruction("pdf","ar",2),/أعد هذا القسم فقط/);
 assert.match(fileDeliveryInstruction("pdf","en",99),/complete document with one descriptive/);
});
