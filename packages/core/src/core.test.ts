import test from "node:test";
import assert from "node:assert/strict";
import {deriveMastery,MASTERY_RULES} from "./mastery.ts";
import {balanceFor,xpProgress} from "./economy.ts";
import {transitionContent} from "./content.ts";
import type {ReviewableContent} from "./content.ts";

const now=new Date("2026-10-07T00:00:00Z");

test("mastery begins with no evidence",()=>{
  const result=deriveMastery([],now);
  assert.equal(result.state,"new");
  assert.equal(result.score,null);
  assert.equal(result.nextReviewAt,null);
});

test("assisted work is discounted and cannot equal independent evidence",()=>{
  const base=[
    {questionId:"q1",correct:true,assisted:false,difficulty:"core",createdAt:"2026-10-06T12:00:00Z"},
    {questionId:"q2",correct:true,assisted:false,difficulty:"application",createdAt:"2026-10-06T13:00:00Z"},
    {questionId:"q3",correct:true,assisted:false,difficulty:"transfer",createdAt:"2026-10-06T14:00:00Z"}
  ] as const;
  const independent=deriveMastery([...base],now);
  const assisted=deriveMastery(base.map(x=>({...x,assisted:true})),now);
  assert.equal(independent.independentQuestionCount,3);
  assert.equal(independent.score,100);
  assert.ok((assisted.score??0)<100);
  assert.equal(assisted.independentQuestionCount,0);
});

test("practice repeats do not inflate mastery evidence",()=>{
  const result=deriveMastery([
    {questionId:"q1",correct:true,assisted:false,practiceRepeat:false,difficulty:"core",createdAt:"2026-10-06T12:00:00Z"},
    {questionId:"q1",correct:true,assisted:false,practiceRepeat:true,difficulty:"core",createdAt:"2026-10-06T13:00:00Z"}
  ],now);
  assert.equal(result.evidenceCount,1);
  assert.equal(result.independentQuestionCount,1);
});

test("level and ledger helpers preserve XP and Coin semantics",()=>{
  assert.deepEqual(xpProgress(250),{
    xp:250,level:3,levelFloorXp:200,levelCeilingXp:300,levelPercent:50
  });
  assert.equal(balanceFor([
    {currency:"COIN",amount:100},
    {currency:"COIN",amount:-35},
    {currency:"XP",amount:500}
  ]),65);
});

test("content lifecycle enforces review before publish",()=>{
  const draft:ReviewableContent={
    reviewStatus:"draft",
    publicationStatus:"draft"
  };
  assert.throws(()=>transitionContent(draft,"publish","admin"));
  const review=transitionContent(draft,"submit_review","teacher","2026-10-07T00:00:00Z");
  const approved=transitionContent(review,"approve","teacher","2026-10-07T00:01:00Z");
  const published=transitionContent(approved,"publish","admin","2026-10-07T00:02:00Z");
  assert.equal(published.publicationStatus,"published");
  assert.equal(published.publishedBy,"admin");
});

test("mastery rule keeps a distinct-question minimum",()=>{
  assert.equal(MASTERY_RULES.minimumIndependentQuestions,3);
});
