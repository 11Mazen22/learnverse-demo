import test from "node:test";
import assert from "node:assert/strict";
import {isNonDeliverableDraft,imageNeedsSubject} from "./delivery-quality.ts";
test("A document plan or confirmation request must not become a completed PDF",()=>{
 assert.equal(isNonDeliverableDraft("That sounds great! I can create a PDF. Would you prefer a summary or detailed guide?"),true);
 assert.equal(isNonDeliverableDraft("# Proposed contents\n- Supervised learning\n- Unsupervised learning\n\nPlease confirm this structure before proceeding."),true);
 assert.equal(isNonDeliverableDraft("Once finalized, I'll proceed to generating the PDF."),true);
 assert.equal(isNonDeliverableDraft("# Machine learning guide\n## Supervised learning\nClassification uses labeled examples, such as spam detection.\n## Unsupervised learning\nClustering finds patterns without predefined labels. This is a concise completed explanation."),false);
});
test("Bare image requests ask for a subject instead of generating random stock-like artwork",()=>{
 assert.equal(imageNeedsSubject("make an image"),true);
 assert.equal(imageNeedsSubject("can you create a picture for me?"),true);
 assert.equal(imageNeedsSubject("ارسم صورة"),true);
 assert.equal(imageNeedsSubject("Generate an image of Cairo at sunset"),false);
 assert.equal(imageNeedsSubject("Design a futuristic school logo with blue colors"),false);
});
