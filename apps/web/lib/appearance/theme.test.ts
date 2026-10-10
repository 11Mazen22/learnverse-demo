import test from "node:test";
import assert from "node:assert/strict";
import {contrastRatio,parseDesignSuggestion,validateTokens,isDesignRecord} from "./theme.ts";
test("contrast rejects bright accent and unsafe night text",()=>{
 assert.ok(contrastRatio("#235492","#ffffff")>=4.5);
 assert.throws(()=>validateTokens({accent:"#f5f5f5",deep:"#09162f",bright:"#aaaaaa"}),/فاتحة/);
 assert.throws(()=>validateTokens({accent:"#24508c",deep:"#bbbbbb",bright:"#77aadd"}),/تباين/);
 assert.throws(()=>validateTokens({accent:"javascript:alert(1)",deep:"#09162f",bright:"#77aadd"}),/HEX/);
});
test("Fanar output needs structured validated palette rather than injected styles",()=>{
 const a=parseDesignSuggestion('{"name":"محيط جديد","description":"هادئ","tokens":{"accent":"#24508C","deep":"#132B4D","bright":"#5194CD"}}');
 assert.equal(a.name,"محيط جديد");
 assert.equal(a.tokens.deep,"#132B4D");
 assert.throws(()=>parseDesignSuggestion("تم إنشاء التصميم!"),/Fanar/);
 assert.throws(()=>parseDesignSuggestion('{"name":"أ","tokens":{}}'),/عنوان/);
 const wrapped=parseDesignSuggestion('فكرة مبدئية {غير مكتملة}\n```json\n{"name":"محيط هادئ","description":"ألوان بحرية هادئة","tokens":{"accent":"#24508C","deep":"#132B4D","bright":"#5194CD"}}\n```\nيمكنك معاينتها.');
 assert.equal(wrapped.name,"محيط هادئ");
 assert.throws(()=>parseDesignSuggestion('```json\n{"name":"لون","tokens":{"accent":"javascript:alert(1)","deep":"#132B4D","bright":"#5194CD"}}\n```'),/HEX/);
});
test("record parser protects rendering from malformed persisted data",()=>{
 assert.equal(isDesignRecord({id:"a",user_id:"b",name:"x",visible:true,tokens:{accent:"#123456",deep:"#09162f",bright:"#56aacc"}}),true);
 assert.equal(isDesignRecord({id:"a",user_id:"b",visible:true,tokens:{accent:"red"}}),false);
});
