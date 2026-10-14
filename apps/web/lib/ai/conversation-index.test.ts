import test from "node:test";import assert from "node:assert/strict";
import {CONVERSATION_PAGE_SIZE,mergeConversationPage} from "./conversation-index.ts";
import type {Conversation} from "./workspace.ts";
test("Conversation pages preserve older chats beyond the previous 200 limit without duplicates",()=>{
 const source=Array.from({length:233},(_,i)=>({id:String(i).padStart(4,"0"),title:"Chat "+i,pinned:i===2,archived:false,temporary:false,selected_model:"auto",updated_at:new Date(1700000000000+i*1000).toISOString()})) as Conversation[];
 let result:Conversation[]=[];for(let offset=0;offset<source.length;offset+=CONVERSATION_PAGE_SIZE)result=mergeConversationPage(result,source.slice(Math.max(0,offset-1),offset+CONVERSATION_PAGE_SIZE),true);
 assert.equal(result.length,233);assert.equal(result[0].id,"0002");assert.equal(new Set(result.map(x=>x.id)).size,233);
 const refreshed=mergeConversationPage(result,[{...source[10],title:"Revised title"}],false);assert.equal(refreshed.length,1);assert.equal(refreshed[0].title,"Revised title");
});
