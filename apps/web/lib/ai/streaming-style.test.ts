import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const globalStyles=readFileSync(new URL("../../app/ai-reading-renaissance.css",import.meta.url),"utf8");
const workspaceStyles=readFileSync(new URL("../../components/ai/noata-one.module.css",import.meta.url),"utf8");

const richMessageSource=readFileSync(new URL("../../components/ai/rich-message.tsx",import.meta.url),"utf8");

test("streaming uses one inline typing caret, not competing parent and paragraph cursors",()=>{
 assert.doesNotMatch(globalStyles,/\.owui-layout\s+\.owui-message\.assistant\.streaming\s+\.ai-rich-message\s*>\s*:last-child::after/);
 assert.doesNotMatch(workspaceStyles,/\.root\s+:global\(\.owui-message\.assistant\.streaming\s+\.ai-rich-message::after\)/);
 assert.match(workspaceStyles,/\.root\s+:global\(\.owui-message\.assistant\.streaming\s+\.noata-stream-caret\)/);
 assert.match(richMessageSource,/rehypeStreamingCaret/);
 assert.equal((workspaceStyles.match(/animation:noata-caret 820ms/g)||[]).length,1);
});

test("the typing caret and stream indicator respect reduced-motion preferences",()=>{
 assert.match(workspaceStyles,/@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*\.noata-stream-caret[^}]*animation:none/s);
 assert.match(workspaceStyles,/@media\s*\(prefers-reduced-motion:\s*reduce\)[^{]*\{[^}]*\.owui-stream-badge::before[^}]*animation:none/s);
});
