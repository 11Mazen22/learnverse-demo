import test from "node:test";
import assert from "node:assert/strict";
import {designFromMarkdown,parseDesignDocument,serializeDesignDocument,stripDesignFrontMatter} from "../../../../supabase/functions/noata-ai/document-design.ts";
import {documentAuthorInput,documentAuthorPrompt} from "../../../../supabase/functions/noata-ai/document-author.ts";
import {designedDocumentParts} from "./pdf-design.ts";

const fonts={arabic:"AAAA",latin:"BBBB",symbols:"CCCC"};

test("designed document front matter is parsed, allowlisted and serialized",()=>{
 const source='---noata\n{"title":"نهضة بغداد","subtitle":"حياة الناس في العصر العباسي","theme":"forest","cover":"bold","toc":true,"lang":"ar","evil":"url(http://x)"}\n---\n\n## المدن\n\nنص.'
 const parsed=parseDesignDocument(source,"سقوط");
 assert.equal(parsed.designed,true);
 assert.equal(parsed.design.title,"نهضة بغداد");
 assert.equal(parsed.design.theme,"forest");
 assert.equal(parsed.design.cover,"bold");
 assert.equal(parsed.design.lang,"ar");
 assert.equal(parsed.body.startsWith("## المدن"),true);
 const serialized=serializeDesignDocument(parsed.design,parsed.body);
 assert.match(serialized,/^---noata\n\{/);
 assert.doesNotMatch(serialized,/evil|http/);
 assert.equal(stripDesignFrontMatter(serialized),"## المدن\n\nنص.");
});
test("malformed design metadata falls back without leaking the marker",()=>{
 const parsed=parseDesignDocument('---noata\n{not json}\n---\n\n## Section\n\nBody',"Fallback");
 assert.equal(parsed.designed,true);
 assert.equal(parsed.design.title,"Section");
 assert.equal(parsed.body,"Body");
 assert.equal(parsed.design.theme,"midnight");
});
test("unknown theme and cover values never become arbitrary CSS",()=>{
 const parsed=parseDesignDocument('---noata\n{"title":"T","theme":"url(x)","cover":"javascript:","toc":"yes"}\n---\n\n## S\n\nx',"T");
 assert.equal(parsed.design.theme,"midnight");
 assert.equal(parsed.design.cover,"editorial");
 assert.equal(parsed.design.toc,true);
});
test("plain Markdown remains a readable non-designed fallback",()=>{
 const design=designFromMarkdown("## Intro\n\nText","Title","forest","en");
 assert.equal(design.title,"Intro");
 assert.equal(design.theme,"forest");
 assert.equal(design.lang,"en");
});
test("author prompt requires the marker and prohibits fake evidence",()=>{
 const prompt=documentAuthorPrompt("ar");
 assert.match(prompt,/---noata/);
 assert.match(prompt,/Never invent numbers/);
 assert.match(prompt,/untrusted data/);
 const input=documentAuthorInput({request:"تقرير",draft:"Draft",language:"ar",themeHint:"forest",sources:[{id:1,title:"T",url:"https://example.org",excerpt:"E"}]});
 assert.match(input,/forest/);assert.match(input,/https:\/\/example\.org/);
 const structured=documentAuthorInput({request:"وسّع القسم",draft:"## First\n\nLine one.\n\nLine two.",language:"ar"});
 assert.match(structured,/## First\\n\\nLine one/);
 const previous="# Existing\n\n"+"x".repeat(30_000);
 const revised=JSON.parse(documentAuthorInput({request:"حسّن",draft:"Draft",previous,language:"ar"}));
 assert.equal(revised.previous.length,previous.length,"Existing document sections are not silently truncated");
});
test("the cover title is never repeated at the top of the body",()=>{
 const source='---noata\n{"title":"Baghdad","theme":"ivory","lang":"en"}\n---\n\n# **BAGHDAD**\n\n## Markets\n\nText.';
 const parsed=parseDesignDocument(source,"Baghdad");
 assert.equal(parsed.body.startsWith("## Markets"),true);
 assert.equal(parsed.body.includes("# Baghdad"),false);
});
test("a chat lead-in before or after the marker never reaches the page",()=>{
 const before=parseDesignDocument('بالطبع! إليك التقرير المطلوب:\n\n---noata\n{"title":"تقرير","lang":"ar"}\n---\n\n## البداية\n\nنص.');
 assert.equal(before.body.startsWith("## البداية"),true);
 assert.equal(before.body.includes("بالتأكيد"),false);
 const plain=parseDesignDocument('---noata\n{"title":"Report","lang":"en"}\n---\n\nSure! Here is the report:\n\n# Report\n\n## Findings\n\nText.',"Report");
 assert.equal(plain.body.startsWith("## Findings"),true);
});
test("oversized authoring output is rejected before rendering",()=>{
 assert.throws(()=>parseDesignDocument("x".repeat(98_001)),/document_too_large/);
});
test("the cover keeps the last two title words together",async()=>{
 const source='---noata\n{"title":"Life in the Abbasid Era","theme":"forest","cover":"bold","lang":"en"}\n---\n\n## One\n\nText.';
 const parts=await designedDocumentParts(source,"Life in the Abbasid Era",fonts,"noata");
 assert.match(parts.coverHtml??"",/Abbasid&nbsp;Era/);
});
test("designed HTML renders a cover, contents, signature blocks and no metadata",async()=>{
 const source='---noata\n{"title":"Baghdad","subtitle":"A city in motion","kicker":"Field report","theme":"cobalt","cover":"editorial","toc":true,"lang":"en"}\n---\n\n## Markets\n\n:::stats\n- 42% | Growth in trade\n- 120 | Schools\n:::\n\nThe city moved.\n\n:::quote\nA key sentence from the document.\n-- Noata synthesis\n:::\n\n## Scholarship\n\n:::callout\nA turning point\nTranslation moved knowledge.\n:::\n\n### Detail\n\nMore.\n\n## Conclusion\n\n:::endnote\nA measured close.\n:::';
 const parts=await designedDocumentParts(source,"Baghdad",fonts,"noata");
 assert.equal(parts.coverHtml?.includes("Baghdad"),true);
 assert.equal(parts.coverHtml?.includes("Field report"),true);
 assert.equal(parts.bodyHtml.includes("Baghdad"),true);
 assert.equal(parts.bodyHtml.includes(":::"),false);
 assert.equal(parts.bodyHtml.includes("42%"),true);
 assert.equal(parts.bodyHtml.includes("pullquote"),true);
 assert.equal(parts.bodyHtml.includes("CONTENTS"),true);
 assert.equal(parts.bodyHtml.includes("---noata"),false);
});
