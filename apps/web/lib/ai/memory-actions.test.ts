import test from "node:test";
import assert from "node:assert/strict";
import {conversationalMemoryIntent,memoryStorageRefusal,memoryResultMessage,persistentMemoryAllowed} from "../../../../supabase/functions/noata-ai/memory-actions.ts";
test("Explicit conversational memory commands are parsed without automatic inference",()=>{
 assert.deepEqual(conversationalMemoryIntent("Remember that I prefer Arabic math explanations"),{kind:"save",content:"I prefer Arabic math explanations"});
 assert.deepEqual(conversationalMemoryIntent("افتكر إن أنا أفضل شرح الرياضيات بالعربي"),{kind:"save",content:"أنا أفضل شرح الرياضيات بالعربي"});
 assert.deepEqual(conversationalMemoryIntent("what do you remember about me?"),{kind:"ask"});
 assert.deepEqual(conversationalMemoryIntent("Just explain Arabic math"),{kind:"none"});
 assert.deepEqual(conversationalMemoryIntent("How does memory work?"),{kind:"none"});
});
test("Memory cannot silently persist personal secrets or claim success without storage",()=>{
 assert.equal(memoryStorageRefusal("my password is hello123"),"secret");
 assert.equal(memoryStorageRefusal("API key sk-abcdefghijklmnopqrstuvwxyz"),"secret");
 assert.equal(memoryStorageRefusal("I prefer short explanations"),null);
 assert.match(memoryResultMessage("disabled","en"),/Nothing was saved/);
 assert.match(memoryResultMessage("saved","en","Prefers short explanations"),/Settings → Memory/);
});

test("Temporary chats cannot read or write persistent cross-chat memory",()=>{
 assert.equal(persistentMemoryAllowed(true),false);
 assert.equal(persistentMemoryAllowed(false),true);
});
