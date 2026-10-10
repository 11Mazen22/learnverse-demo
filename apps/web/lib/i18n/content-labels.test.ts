import test from "node:test";
import assert from "node:assert/strict";
import {ledgerReason,ledgerSource,masteryLabel,notificationCopy,questionTypeLabel} from "./content-labels.ts";

test("English learning and reward labels explain server codes without exposing them",()=>{
 assert.equal(ledgerReason("SHOP_PURCHASE","en"),"Shop purchase");
 assert.equal(ledgerReason("QUESTION_FIRST_CORRECT","en"),"First correct answer");
 assert.equal(ledgerSource("shop_item","en"),"Shop");
 assert.equal(questionTypeLabel("numeric","en"),"Numeric answer");
 assert.equal(masteryLabel("provisional_mastery","en"),"Emerging mastery");
 assert.equal(masteryLabel("reteach","en"),"Needs another explanation");
 assert.equal(ledgerReason("future_internal_code","en"),"Balance update");
});
test("notification localization translates platform templates and preserves authored content",()=>{
 const row={type:"assignment",title:"واجب جديد: My experiment",body:"Teacher instructions · موعد التسليم 2026-10-11 09:00"};
 assert.deepEqual(notificationCopy(row,"en"),{title:"New assignment: My experiment",body:"Teacher instructions · Due 2026-10-11 09:00"});
 assert.equal(notificationCopy({type:"grade",title:"تم تقييم واجبك",body:"Essay · 80%"},"en").title,"Your assignment has been graded");
 assert.deepEqual(notificationCopy(row,"ar"),{title:row.title,body:row.body});
 const custom={type:"system",title:"رسالة خاصة",body:"User-authored content"};
 assert.deepEqual(notificationCopy(custom,"en"),{title:custom.title,body:custom.body});
});
