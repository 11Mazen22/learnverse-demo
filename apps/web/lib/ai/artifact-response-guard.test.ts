import test from "node:test";
import assert from "node:assert/strict";
import {isArtifactCapabilityQuestion,isArtifactRefusal,safeArtifactReplyOnCapabilityQuestion,directArtifactAbilityAnswer,canCreateArtifactFromAnswer} from "./artifact-response-guard.ts";
test("Question about abilities is not a request to create a refusal PDF",()=>{
 assert.equal(isArtifactCapabilityQuestion("can you make pdf?"),true);
 assert.equal(isArtifactCapabilityQuestion("هل تقدر تعمل PDF؟"),true);
 assert.equal(isArtifactCapabilityQuestion("can you make a pdf for that?"),false);
 assert.equal(isArtifactCapabilityQuestion("Can you generate a PDF about the water cycle?"),false);
 assert.equal(isArtifactCapabilityQuestion("Make a PDF about temperature."),false);
 assert.ok(isArtifactRefusal("I am unable to generate PDFs at this time. My capabilities do not include creating downloadable files like PDFs."));
 const response=safeArtifactReplyOnCapabilityQuestion("can you make pdf?","I cannot create a PDF.","en");
 assert.match(response,/prepare a downloadable PDF/);
 assert.match(directArtifactAbilityAnswer("can you make Excel?","en")??"",/Excel file/);
 assert.match(directArtifactAbilityAnswer("هل تقدر تعمل باوربوينت؟","ar")??"",/PowerPoint/);
 assert.equal(directArtifactAbilityAnswer("Create a PDF about planets","en"),null);
 assert.ok(!isArtifactRefusal(response));
});
test("Never convert refusals or empty text into a completed artifact",()=>{
 const refusal="I am unable to generate PDFs at this time. My capabilities do not include creating downloadable files like PDFs.";
 assert.equal(canCreateArtifactFromAnswer(refusal,"",false),false);
 assert.equal(canCreateArtifactFromAnswer(refusal,"# Verified temperature data\n| Day | C |\n|---|---|\n| Mon | 25 |",true),true);
 assert.equal(canCreateArtifactFromAnswer("Yes.","",false),false);
 assert.equal(canCreateArtifactFromAnswer("Here is the lesson on the water cycle with detailed examples.","",false),true);
});

test("Direct-creation refusals are detected without mistaking plural follow-ups for ability probes",()=>{
 assert.equal(isArtifactCapabilityQuestion("Can you make a PDF for them?"),false);
 assert.equal(isArtifactRefusal("I cannot directly create a PDF document."),true);
});

import {canDeliverArtifactTurn} from "./artifact-response-guard.ts";
import {isNonDeliverableDraft} from "./delivery-quality.ts";
test("The observed research clarification must never reach an artifact engine",()=>{
 assert.equal(canDeliverArtifactTurn({finishReason:"clarification"}),false);
 assert.equal(canDeliverArtifactTurn({finishReason:"research_unavailable"}),false);
 assert.equal(canDeliverArtifactTurn({finishReason:"stop",capabilityProbe:true}),false);
 assert.equal(canDeliverArtifactTurn({finishReason:"stop"}),true);
 assert.equal(isNonDeliverableDraft("Which public topic or claim should I verify? I could not resolve the subject."),true);
});
