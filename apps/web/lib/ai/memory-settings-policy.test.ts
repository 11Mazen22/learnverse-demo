import test from "node:test";
import assert from "node:assert/strict";
import {canMutateSavedMemory,canReadSavedMemory,memoryRowsForOwner} from "./memory-settings-policy.ts";

test("temporary chats cannot read or reveal persistent memory",()=>{
 assert.equal(canReadSavedMemory(true),false);
 assert.equal(canReadSavedMemory(false),true);
});

test("temporary chats cannot change persistent memory or consent settings",()=>{
 assert.equal(canMutateSavedMemory(true),false);
 assert.equal(canMutateSavedMemory(false),true);
});

test("saved rows are visible only to the owner currently on screen",()=>{
 const rows=[
  {user_id:"account-a",content:"Memory A"},
  {user_id:"account-b",content:"Memory B"},
 ];
 assert.deepEqual(memoryRowsForOwner("account-a",rows),[rows[0]]);
 assert.deepEqual(memoryRowsForOwner("account-b",rows),[rows[1]]);
 assert.deepEqual(memoryRowsForOwner(null,rows),[]);
});
