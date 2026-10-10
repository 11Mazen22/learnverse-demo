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
test("recovers the annotated Fanar response observed in staging",()=>{
 const actual=`{
 "name": "Noata Serenity",
 "description": "ألوان زرقاء بنفسجية هادئة ومتناغمة"،
 "tokens": {
   "accent": "#263233", // ظل أزرق غامق
   "deep": "#1A2021", # تباين 7:1
   "bright": "#4F8BC3", /* لون مساند */
 }
}`;
 const design=parseDesignSuggestion(actual);
 assert.equal(design.tokens.accent,"#263233");
 assert.equal(design.tokens.deep,"#1A2021");
});
test("annotation recovery preserves quoted text and rejects unsafe values",()=>{
 const safe=parseDesignSuggestion(JSON.stringify({name:'Color #1',description:'Keep //, /* */, braces { } and ، inside text',tokens:{accent:'#263233',deep:'#1A2021',bright:'#4F8BC3'}}));
 assert.equal(safe.description,'Keep //, /* */, braces { } and ، inside text');
 assert.throws(()=>parseDesignSuggestion('{"name":"Unsafe","tokens":{"accent":"red",/*comment*/"deep":"#1A2021","bright":"#4F8BC3"}}'),/HEX/);
 assert.throws(()=>parseDesignSuggestion('{"name":"Unsafe","tokens":{"accent":alert(1),"deep":"#1A2021","bright":"#4F8BC3"}}'),/Fanar/);
 assert.throws(()=>parseDesignSuggestion('{"name":"Bright","tokens":{"accent":"#ffffff",// comment\n"deep":"#1A2021","bright":"#4F8BC3"}}'),/فاتحة/);
});
