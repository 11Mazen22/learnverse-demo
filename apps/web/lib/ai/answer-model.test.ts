import test from "node:test";
import assert from "node:assert/strict";
import {answerModelLabel} from "./answer-model.ts";
test("Answer badges identify a supported actual model instead of a generic placeholder",()=>{
 assert.equal(answerModelLabel("Fanar","en"),"Fanar");
 assert.equal(answerModelLabel("Fanar-Sadiq-2","ar"),"صادق 2");
 for(const model of ["auto","Noata","unknown","<script>","Fanar".repeat(100),null,{}])
  assert.equal(answerModelLabel(model,"en"),null);
});
