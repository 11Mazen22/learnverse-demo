import test from "node:test";import assert from "node:assert/strict";
import {answerReviewReason,answerReviewIssue,answerReviewInstruction,requestedDepth} from "../../../../supabase/functions/noata-ai/answer-quality.ts";
const source={id:1,title:"Photosynthesis",url:"https://en.wikipedia.org/wiki/Photosynthesis",domain:"en.wikipedia.org",excerpt:"Biological conversion of light energy.",retrievedAt:"2026-10-13T00:00:00Z"};
const research={version:1 as const,status:"complete" as const,sources:[source],elapsedMs:1};
test("Observed source-access denial and missing citations require one evidence review",()=>{
 assert.equal(answerReviewReason("Search this","My capabilities don't include performing real-time internet searches.",research),"research_evidence");
 assert.equal(answerReviewReason("Search this","The entire earlier answer is correct.",research),"research_evidence");
 assert.equal(answerReviewReason("Search this","Light becomes chemical energy [1]. Details beyond this excerpt still need verification.",research),"research_evidence");
 assert.equal(answerReviewIssue("Search this","Light becomes chemical energy [1]. Details beyond this excerpt still need verification.",research),null);
 assert.match(answerReviewInstruction("research_evidence","en"),/ALREADY retrieved/);
});
test("Requested long explanations need substantial sections; brief, explicit length and greetings are preserved",()=>{
 assert.equal(answerReviewReason("Talk along about photosynthesis","A short paragraph."),"requested_depth");
 assert.equal(answerReviewReason("Hello","Hi!"),null);
 assert.equal(answerReviewReason("A detailed explanation in 100 words","Short requested answer"),null);
 assert.equal(answerReviewReason("Give a brief detailed summary","Brief answer"),null);
 const full=Array.from({length:5},(_,i)=>"## Section "+i+"\n"+("Useful explanation ".repeat(65))).join("\n");
 assert.equal(answerReviewReason("Write a long guide",full),null);
});

import {limitedResearchSummary} from "../../../../supabase/functions/noata-ai/answer-quality.ts";
test("A provider failure becomes explicitly limited retrieved evidence, never a false verification claim",()=>{
 const text=limitedResearchSummary({...research,reason:"encyclopedia_background"},"en");
 assert.match(text,/not a complete fact-check/);assert.match(text,/\[1\]/);assert.match(text,/background excerpts only/);
 assert.doesNotMatch(text,/cannot search|entire earlier answer is correct/);
});

test("Artifact engines retain their explicit structure and long numeric requests retain depth",()=>{
 assert.equal(answerReviewReason("Write a long presentation","## Slide 1\nFive concise bullets.",undefined,"pptx"),null);
 assert.equal(answerReviewReason("Write a detailed 1,500 word guide","Short answer"),"requested_depth");
});

test("Observed 512-word reply to a 700-word request fails its explicit depth requirement",()=>{
 const observed=Array.from({length:7},(_,i)=>"## Section "+i+"\n"+("word ".repeat(70))).join("\n");
 assert.equal(answerReviewReason("Give a detailed explanation in about 700 words",observed),"requested_depth");
 assert.deepEqual(requestedDepth("Explain in 1,500 words"),{target:1500,minimum:1275,sections:4});
 assert.equal(answerReviewIssue("Search this","Everything in the entire earlier answer is correct [1].",research),"research_evidence");
 assert.equal(answerReviewIssue("Search this","Light becomes energy [4].",research),"research_evidence");
 assert.match(answerReviewInstruction("research_evidence","ar"),/EVERY substantive claim/);
});

test("Arabic numeric depth and explicitly limited evidence remain readable and honestly scoped",()=>{
 assert.equal(requestedDepth("شرح شامل في ٧٠٠ كلمة")?.target,700);
 assert.equal(answerReviewIssue("Search this","Not every detail is verified. Light becomes chemical energy [1].",research),null);
});
