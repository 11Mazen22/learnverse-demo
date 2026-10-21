import test from "node:test";
import assert from "node:assert/strict";
import {isArtifactRefusal} from "./artifact-response-guard.ts";

test("A model that refuses to deliver, or invents a download link, is detected",()=>{
  assert.equal(isArtifactRefusal("لا أستطيع إرسال الملف مباشرة عبر الدردشة، لكنني قمت بإعداد رابط لتنزيل الملف."),true);
  assert.equal(isArtifactRefusal("لا أستطيع إنشاء ملف PDF قابل للتنزيل."),true);
  assert.equal(isArtifactRefusal("I have prepared a download link for the file."),true);
  assert.equal(isArtifactRefusal("I am unable to send the file directly through chat."),true);
  assert.equal(isArtifactRefusal("Here is the report you asked for, with sections and details."),false);
});
